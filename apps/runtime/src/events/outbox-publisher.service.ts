import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Inject,
  forwardRef,
} from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from './event-bus.service';
import { PaymentExpiryService } from '../leos/payment-expiry.service';
import {
  OUTBOX_MAX_ATTEMPTS,
  nextRetry,
  shouldDeadLetter,
  truncateError,
  validateEnvelope,
} from './outbox-policy';

type ClaimedOutboxRow = {
  id: string;
  eventName: string;
  envelope: unknown;
  publishedAt: Date | null;
  attempts: number;
  nextRetryAt: Date | null;
  deadLetteredAt: Date | null;
  lastError: string | null;
  createdAt: Date;
};

const CLAIM_BATCH = 20;

@Injectable()
export class OutboxPublisherService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer?: NodeJS.Timeout;
  private ticking = false;
  private stopped = false;
  /** Last tick filled the batch — drain faster. */
  private backlog = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
    @Inject(forwardRef(() => PaymentExpiryService))
    private readonly paymentExpiry: PaymentExpiryService,
  ) {}

  onModuleInit() {
    this.scheduleNext(1000);
  }

  onModuleDestroy() {
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
  }

  private scheduleNext(ms: number) {
    if (this.stopped) return;
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => void this.tick(), ms);
  }

  /** One cadence: expire abandoned payments, then publish outbox. */
  async tick() {
    if (this.ticking || this.stopped) return;
    this.ticking = true;
    try {
      try {
        await this.paymentExpiry.expireAbandoned();
      } catch (err) {
        this.logger.error(
          `expireAbandoned failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`,
        );
      }
      try {
        await this.publishPending();
      } catch (err) {
        this.logger.error(
          `publishPending failed: ${err instanceof Error ? err.stack ?? err.message : String(err)}`,
        );
      }
    } finally {
      this.ticking = false;
      this.scheduleNext(this.backlog ? 200 : 1000);
    }
  }

  async publishPending() {
    if (!this.prisma?.outboxMessage) {
      this.backlog = false;
      return;
    }

    let claimed = 0;
    for (let i = 0; i < CLAIM_BATCH; i++) {
      try {
        const did = await this.processNextDue();
        if (!did) break;
        claimed += 1;
      } catch (err) {
        this.logger.error(
          `outbox claim/process crashed: ${
            err instanceof Error ? err.stack ?? err.message : String(err)
          }`,
        );
      }
    }
    this.backlog = claimed >= CLAIM_BATCH;
  }

  /**
   * Claim one due row (SKIP LOCKED), validate, publish or dead-letter / retry.
   * One transaction per message so message 7 failing cannot skip 8–20.
   */
  private async processNextDue(): Promise<boolean> {
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<ClaimedOutboxRow[]>`
        SELECT id, "eventName", envelope, "publishedAt", attempts,
               "nextRetryAt", "deadLetteredAt", "lastError", "createdAt"
        FROM "OutboxMessage"
        WHERE "publishedAt" IS NULL
          AND "deadLetteredAt" IS NULL
          AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= ${now})
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;
      const row = rows[0];
      if (!row) return false;

      const validation = validateEnvelope(row.envelope);
      if (!validation.ok) {
        await tx.outboxMessage.update({
          where: { id: row.id },
          data: {
            deadLetteredAt: now,
            lastError: truncateError(`poison: ${validation.reason}`),
            attempts: Math.max(row.attempts, 1),
          },
        });
        this.logger.error(
          `Dead-lettered outbox ${row.id} on attempt 1 — ${validation.reason}`,
        );
        return true;
      }

      const envelope = row.envelope as EventEnvelope;
      try {
        await this.bus.publish(envelope);
        await tx.outboxMessage.update({
          where: { id: row.id },
          data: { publishedAt: now, lastError: null },
        });
        this.logger.debug(`Published ${envelope.eventName}`);
      } catch (err) {
        const message = truncateError(
          err instanceof Error ? err.message : String(err),
        );
        const retry = nextRetry({ attempts: row.attempts, now });
        if (
          shouldDeadLetter({
            attempts: retry.attempts,
            maxAttempts: OUTBOX_MAX_ATTEMPTS,
          })
        ) {
          await tx.outboxMessage.update({
            where: { id: row.id },
            data: {
              attempts: retry.attempts,
              nextRetryAt: retry.nextRetryAt,
              deadLetteredAt: now,
              lastError: message,
            },
          });
          this.logger.error(
            `Dead-lettered outbox ${row.id} eventId=${envelope.eventId} after ${retry.attempts} attempts: ${message}`,
          );
        } else {
          await tx.outboxMessage.update({
            where: { id: row.id },
            data: {
              attempts: retry.attempts,
              nextRetryAt: retry.nextRetryAt,
              lastError: message,
            },
          });
          this.logger.warn(
            `Outbox ${row.id} attempt ${retry.attempts} failed — retry at ${retry.nextRetryAt.toISOString()}: ${message}`,
          );
        }
      }
      return true;
    });
  }
}
