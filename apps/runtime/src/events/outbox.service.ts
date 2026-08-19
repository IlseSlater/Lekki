import { Injectable } from '@nestjs/common';
import type { EventEnvelope } from '@lekki/contracts';
import { Prisma } from '@prisma/client';
import { newEventId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';

type DbClient = PrismaService | Prisma.TransactionClient;

@Injectable()
export class OutboxService {
  constructor(private readonly prisma: PrismaService) {}

  async append(envelope: EventEnvelope, tx: DbClient = this.prisma) {
    await tx.outboxMessage.create({
      data: {
        id: envelope.eventId || newEventId(),
        eventName: envelope.eventName,
        envelope: envelope as object,
      },
    });
  }
}
