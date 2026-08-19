import { Controller, Get, Query } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Operate floor — live places/sessions for Waiter (LEK-027 Floor / Live Sessions).
 */
@Controller('operate')
export class OperateController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('floor')
  async floor(
    @Query('venueId') venueId?: string,
    @Query('organisationId') organisationId?: string,
  ) {
    const sessions = await this.prisma.experienceSession.findMany({
      where: {
        status: { in: ['created', 'active', 'settling'] },
        ...(venueId ? { venueId } : {}),
        ...(organisationId ? { organisationId } : {}),
      },
      include: {
        physicalContext: true,
        fulfilments: {
          include: {
            lines: true,
            transaction: { include: { lines: true } },
          },
        },
        transactions: { select: { id: true } },
        assistanceRequests: {
          where: { status: { in: ['open', 'acknowledged'] } },
          select: { id: true, kind: true, status: true },
        },
      },
      orderBy: { startedAt: 'asc' },
    });

    const now = Date.now();
    return {
      tables: sessions.map((s) => {
        const active = s.fulfilments.filter(
          (f) => !['delivered', 'completed', 'cancelled'].includes(f.status),
        );
        const readyCount = active.filter((f) => f.status === 'ready').length;
        const preparingCount = active.filter(
          (f) => f.status === 'preparing' || f.status === 'confirmed',
        ).length;
        const pendingCount = active.filter(
          (f) => f.status === 'pending' || f.status === 'created',
        ).length;
        const idleMinutes = Math.max(0, Math.floor((now - s.startedAt.getTime()) / 60000));

        const items = active.flatMap((f) => {
          const labelByTxLine = new Map(
            (f.transaction?.lines ?? []).map((l) => [l.id, l.label] as const),
          );
          const lines = f.lines?.length
            ? f.lines
            : [{ quantity: 1, transactionLineId: '', stationId: f.stationId }];
          return lines.map((line) => ({
            fulfilmentId: f.id,
            status: f.status,
            stationId: f.stationId,
            label: labelByTxLine.get(line.transactionLineId) ?? 'Item',
            quantity: line.quantity,
          }));
        });

        return {
          sessionId: s.id,
          placeCode: s.physicalContext?.code ?? '—',
          placeType: s.physicalContext?.type ?? '',
          contextId: s.physicalContextId,
          venueId: s.venueId,
          status: s.status,
          startedAt: s.startedAt.toISOString(),
          idleMinutes,
          orderCount: s.transactions.length,
          fulfilmentCount: active.length,
          readyCount,
          preparingCount,
          pendingCount,
          helpCount: s.assistanceRequests.length,
          helpKinds: s.assistanceRequests.map((a) => a.kind),
          items,
        };
      }),
    };
  }
}
