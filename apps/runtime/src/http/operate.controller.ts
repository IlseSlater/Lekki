import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeosService } from '../leos/leos.service';
import { WaiterTablesService } from '../leos/waiter-tables.service';
import { KitchenPaceService } from '../leos/kitchen-pace.service';
import { canManage } from '../leos/staff-admin';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';
import { SessionNotActiveError } from '../leos/domain-errors';

/**
 * Operate floor — live places/sessions for Waiter (LEK-027 Floor / Live Sessions).
 * Staff token required — org derived from token, never from query alone.
 */
@Controller('operate')
@UseGuards(StaffAuthGuard)
@RequireStaffPermission('session.read')
export class OperateController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leos: LeosService,
    private readonly tables: WaiterTablesService,
    private readonly kitchenPace: KitchenPaceService,
  ) {}

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
        const heldCount = active.filter((f) => f.status === 'held').length;
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
          heldCount,
          helpCount: s.assistanceRequests.length,
          helpKinds: s.assistanceRequests.map((a) => a.kind),
          waiterId: s.waiterId ?? null,
          waiterName: s.waiterName ?? null,
          items,
        };
      }),
    };
  }

  /** The kitchen's pace right now: hours, pause, busy minutes, hold-and-fire. */
  @Get('pace')
  async pace(@Req() req: { staff: StaffTokenClaims }) {
    const { pace } = await this.kitchenPace.forOrganisation(req.staff.org);
    return pace;
  }

  /** A manager saves the pace. */
  @Put('pace')
  async savePace(@Req() req: { staff: StaffTokenClaims }, @Body() body: unknown) {
    this.requireManager(req.staff);
    return this.kitchenPace.save(req.staff.org, body);
  }

  /** A manager pauses or resumes new orders. Seated guests can still see and pay. */
  @Post('pace/pause')
  async pause(@Req() req: { staff: StaffTokenClaims }, @Body() body: { paused?: boolean }) {
    this.requireManager(req.staff);
    return this.kitchenPace.setPaused(req.staff.org, body?.paused === true);
  }

  /** Fire a held round: every ticket for the table goes to its station together. */
  @Post('sessions/:sessionId/fire')
  async fire(@Req() req: { staff: StaffTokenClaims }, @Param('sessionId') sessionId: string) {
    return this.leos.fireRound(sessionId.trim(), req.staff.org);
  }

  private requireManager(staff: StaffTokenClaims) {
    if (!canManage(staff.permissions)) {
      throw new ForbiddenException('Only a manager can do this.');
    }
  }

  /** My tips this shift. Each waiter sees their own. */
  @Get('tips/mine')
  async myTips(@Req() req: { staff: StaffTokenClaims }) {
    const { since, waiters } = await this.tables.tipsThisShift(req.staff.org);
    const mine = waiters.find((w) => w.waiterId === req.staff.sub);
    return { since, tipMinor: mine?.tipMinor ?? 0, count: mine?.count ?? 0 };
  }

  /** The owner's one evening sentence. Empty until the averages are real. */
  @Get('evening')
  async evening(@Req() req: { staff: StaffTokenClaims }) {
    this.requireManager(req.staff);
    return { sentence: await this.tables.eveningSentence(req.staff.org) };
  }

  /** "I've got this table." Ready alerts and help for it come to this waiter. */
  @Post('sessions/:sessionId/take')
  async take(
    @Req() req: { staff: StaffTokenClaims },
    @Param('sessionId') sessionId: string,
  ) {
    return this.tables.take(sessionId.trim(), req.staff);
  }

  /** A manager moves an open bill to another table. */
  @Post('sessions/:sessionId/move')
  async move(
    @Req() req: { staff: StaffTokenClaims },
    @Param('sessionId') sessionId: string,
    @Body() body: { toCode?: string },
  ) {
    return this.leos.moveTable({
      sessionId: sessionId.trim(),
      toCode: body?.toCode ?? '',
      organisationId: req.staff.org,
      permissions: req.staff.permissions ?? [],
    });
  }

  /**
   * Key a bill line (staff_operate) so a pilot can run before Pilot POS sync exists.
   * One question: what should we add to this table's bill?
   */
  @Post('sessions/:sessionId/bill-lines')
  async addBillLine(
    @Req() req: { staff: StaffTokenClaims },
    @Param('sessionId') sessionId: string,
    @Body() body: { label?: string; unitPrice?: number; quantity?: number },
  ) {
    const label = (body.label ?? '').trim();
    const unitPrice = Number(body.unitPrice);
    const quantity = body.quantity != null ? Number(body.quantity) : 1;
    if (!label) throw new BadRequestException('label is required');
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      throw new BadRequestException('unitPrice must be a non-negative number');
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      throw new BadRequestException('quantity must be at least 1');
    }

    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId.trim() },
      select: { organisationId: true },
    });
    if (!session) throw new BadRequestException('Session not found');
    if (session.organisationId !== req.staff.org) {
      throw new ForbiddenException('Wrong organisation');
    }

    try {
      return await this.leos.appendStaffOperateLine({
        sessionId,
        organisationId: req.staff.org,
        label,
        unitPrice,
        quantity,
      });
    } catch (err) {
      if (err instanceof SessionNotActiveError) {
        throw new BadRequestException('Session is no longer active');
      }
      if (err instanceof Error && err.message === 'Wrong organisation') {
        throw new ForbiddenException(err.message);
      }
      throw err;
    }
  }
}
