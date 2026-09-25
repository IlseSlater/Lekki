import { Controller, Get, NotFoundException, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

/**
 * Operate floor — live places/sessions for Waiter (LEK-027 Floor / Live Sessions).
 * Staff token required — org derived from token, never from query alone.
 */
@Controller('operate')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('session.read')
export class OperateController {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Payment attention — failed/amount-mismatch on still-open sessions, not yet noted.
   * Continuity: Open table + Got it (operatorNotedAt). Never invents refund.
   */
  @Get('payments-attention')
  async paymentsAttention(
    @Req() req: { staff: StaffTokenClaims },
    @Query('venueId') venueId?: string,
  ) {
    const organisationId = req.staff.org;
    const payments = await this.prisma.payment.findMany({
      where: {
        organisationId,
        status: { in: ['failed', 'amount_mismatch'] },
        operatorNotedAt: null,
        session: {
          status: { in: ['created', 'active', 'settling'] },
          ...(venueId ? { venueId } : {}),
        },
      },
      select: {
        id: true,
        status: true,
        sessionId: true,
        createdAt: true,
        session: { select: { physicalContext: { select: { code: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return payments.map((p) => ({
      id: p.id,
      sessionId: p.sessionId,
      placeCode: p.session?.physicalContext?.code ?? null,
      status: p.status,
      createdAt: p.createdAt.toISOString(),
    }));
  }

  /** Owner noted the failure — money status unchanged. */
  @Post('payments-attention/:id/heard')
  async paymentAttentionHeard(
    @Req() req: { staff: StaffTokenClaims },
    @Param('id') id: string,
  ) {
    const organisationId = req.staff.org;
    const existing = await this.prisma.payment.findFirst({
      where: {
        id,
        organisationId,
        status: { in: ['failed', 'amount_mismatch'] },
      },
    });
    if (!existing) throw new NotFoundException('Payment not found');
    if (existing.operatorNotedAt) return { id: existing.id, noted: true };
    const updated = await this.prisma.payment.update({
      where: { id },
      data: { operatorNotedAt: new Date() },
    });
    return { id: updated.id, noted: true };
  }

  @Get('floor')
  async floor(
    @Req() req: { staff: StaffTokenClaims },
    @Query('venueId') venueId?: string,
  ) {
    const organisationId = req.staff.org;
    const sessions = await this.prisma.experienceSession.findMany({
      where: {
        organisationId,
        status: { in: ['created', 'active', 'settling'] },
        ...(venueId ? { venueId } : {}),
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
