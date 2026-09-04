import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  OUTBOX_LAG_BUDGET_SECONDS,
  outboxHealth,
} from '../events/outbox-policy';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async health() {
    let database: 'up' | 'down' = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      database = 'up';
    } catch {
      database = 'down';
    }

    const now = new Date();
    let pending = 0;
    let deadLettered = 0;
    let oldestPendingAt: Date | null = null;
    try {
      if (this.prisma.outboxMessage) {
        pending = await this.prisma.outboxMessage.count({
          where: { publishedAt: null, deadLetteredAt: null },
        });
        deadLettered = await this.prisma.outboxMessage.count({
          where: { deadLetteredAt: { not: null } },
        });
        const oldest = await this.prisma.outboxMessage.findFirst({
          where: { publishedAt: null, deadLetteredAt: null },
          orderBy: { createdAt: 'asc' },
          select: { createdAt: true },
        });
        oldestPendingAt = oldest?.createdAt ?? null;
      }
    } catch {
      // schema may lag behind code during migrate; health still reports DB
    }

    const outbox = outboxHealth({
      oldestPendingAt,
      deadLettered,
      now,
      lagBudgetSeconds: OUTBOX_LAG_BUDGET_SECONDS,
    });

    const status =
      database === 'down' || outbox.state === 'degraded' ? 'degraded' : 'ok';

    return {
      status,
      service: 'lekki:runtime',
      database,
      outbox: {
        pending,
        oldestPendingSeconds: outbox.lagSeconds,
        deadLettered,
        state: outbox.state,
      },
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: now.toISOString(),
    };
  }
}
