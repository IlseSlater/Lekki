import { Injectable, Logger, OnModuleInit, Inject, forwardRef } from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from './event-bus.service';
import { PaymentExpiryService } from '../leos/payment-expiry.service';

@Injectable()
export class OutboxPublisherService implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer?: NodeJS.Timeout;
  private ticking = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
    @Inject(forwardRef(() => PaymentExpiryService))
    private readonly paymentExpiry: PaymentExpiryService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.tick(), 1000);
  }

  /** One cadence: expire abandoned payments, then publish outbox. */
  async tick() {
    if (this.ticking) return;
    this.ticking = true;
    try {
      await this.paymentExpiry.expireAbandoned();
      await this.publishPending();
    } finally {
      this.ticking = false;
    }
  }

  async publishPending() {
    if (!this.prisma?.outboxMessage) return;

    const pending = await this.prisma.outboxMessage.findMany({
      where: { publishedAt: null },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });

    for (const message of pending) {
      const envelope = message.envelope as unknown as EventEnvelope;
      await this.bus.publish(envelope);
      await this.prisma.outboxMessage.update({
        where: { id: message.id },
        data: { publishedAt: new Date() },
      });
      this.logger.debug(`Published ${envelope.eventName}`);
    }
  }
}
