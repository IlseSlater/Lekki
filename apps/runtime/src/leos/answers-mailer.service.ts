import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from '../events/event-bus.service';
import { EmailRuntimeService } from './email-runtime.service';
import { toCsv } from './csv';

type VisitRecordRequestedPayload = {
  venueId: string;
  period: 'week' | 'month';
  toEmail: string;
};

/**
 * S-17 Answers — subscribes to VisitRecordRequested, builds the CSV, sends it.
 * Reuses the outbox/event-bus retry+backoff machinery instead of sending
 * synchronously inside the Grow controller's request/response cycle.
 */
@Injectable()
export class AnswersMailerService implements OnModuleInit {
  private readonly logger = new Logger(AnswersMailerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
    private readonly email: EmailRuntimeService,
  ) {}

  onModuleInit() {
    this.bus.subscribe(async (envelope) => {
      if (envelope.eventName !== 'VisitRecordRequested') return;
      await this.handle(envelope.payload as VisitRecordRequestedPayload);
    });
  }

  private async handle(payload: VisitRecordRequestedPayload) {
    const start = periodStart(payload.period);
    const lines = await this.prisma.transactionLine.findMany({
      where: {
        transaction: {
          createdAt: { gte: start },
          session: { venueId: payload.venueId },
        },
      },
      select: {
        label: true,
        quantity: true,
        unitPrice: true,
        transaction: { select: { createdAt: true } },
      },
      orderBy: { transaction: { createdAt: 'asc' } },
    });

    const rows = lines.map((l) => ({
      date: l.transaction.createdAt.toISOString().slice(0, 10),
      item: l.label,
      quantity: l.quantity,
      unitPrice: Number(l.unitPrice),
      lineTotal: l.quantity * Number(l.unitPrice),
    }));
    const csv = toCsv(rows, [
      { key: 'date', header: 'Date' },
      { key: 'item', header: 'Item' },
      { key: 'quantity', header: 'Quantity' },
      { key: 'unitPrice', header: 'Unit price' },
      { key: 'lineTotal', header: 'Line total' },
    ]);

    const periodLabel = payload.period === 'month' ? 'this month' : 'last week';
    const result = await this.email.capability().send({
      to: payload.toEmail,
      subject: `Your orders — ${periodLabel}`,
      text: `Attached: your orders for ${periodLabel}.`,
      attachments: [
        {
          filename: `orders-${payload.period}.csv`,
          content: Buffer.from(csv, 'utf8').toString('base64'),
          contentType: 'text/csv',
        },
      ],
    });

    if (!result.ok) {
      this.logger.error(`Could not send visit record to ${payload.toEmail}: ${result.reason}`);
      throw new Error(result.reason ?? 'Email send failed');
    }
  }
}

function periodStart(period: 'week' | 'month'): Date {
  const now = new Date();
  const daysBack = period === 'month' ? 30 : 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack);
}
