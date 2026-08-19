import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';
import { PrismaService } from '../prisma/prisma.service';
import { EventBusService } from './event-bus.service';

@Injectable()
export class OutboxPublisherService implements OnModuleInit {
  private readonly logger = new Logger(OutboxPublisherService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly bus: EventBusService,
  ) {}

  onModuleInit() {
    this.timer = setInterval(() => void this.publishPending(), 1000);
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
