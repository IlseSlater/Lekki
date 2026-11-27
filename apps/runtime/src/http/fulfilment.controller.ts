import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CANCEL_REASONS, cancelAlert, cleanCancelReason } from '../leos/order-log';
import { PushService } from '../push/push.service';
import { LeosService } from '../leos/leos.service';
import { PrismaService } from '../prisma/prisma.service';
import { WaiterTablesService } from '../leos/waiter-tables.service';
import { StaffAuthGuard, RequireStaffPermission } from '../staff-auth/staff-auth.guard';
import { StaffTokenService, type StaffTokenClaims } from '../staff-auth/staff-token.service';
import { restaurantStationAccess } from '@lekki/pack-restaurant';
import { isDeliverOnlyRole } from '../staff-auth/station-access';

@Controller('fulfilments')
export class FulfilmentController {
  constructor(
    private readonly leos: LeosService,
    private readonly prisma: PrismaService,
    private readonly tokens: StaffTokenService,
    private readonly tables: WaiterTablesService,
    private readonly push: PushService,
  ) {}

  @Patch(':id/status')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('fulfilment.update')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string; note?: string },
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    const staff = req.staff!;
    // A cancel always says why; managers hear about it.
    const reason =
      body?.status === 'cancelled' ? cleanCancelReason(body.reason, body.note) : null;
    if (body?.status === 'cancelled' && !reason) {
      throw new BadRequestException(
        `Say why the order is cancelled: ${CANCEL_REASONS.join(', ')}. "Other" needs a few words.`,
      );
    }
    const existing = await this.prisma.fulfilment.findUnique({
      where: { id },
      include: { session: { include: { physicalContext: true } } },
    });
    if (!existing) throw new ForbiddenException('Fulfilment not found');
    if (existing.organisationId !== staff.org) {
      throw new ForbiddenException('Wrong organisation');
    }
    if (!this.tokens.canAccessStation(staff.role, existing.stationId)) {
      throw new ForbiddenException('Experience cannot update this station');
    }
    // Serve / handoff roles may only mark ready → delivered
    if (
      isDeliverOnlyRole(staff.role, restaurantStationAccess) &&
      body.status !== 'delivered'
    ) {
      throw new ForbiddenException('Serve role can only mark served');
    }
    const actor = { id: staff.sub, name: staff.name };
    const updated = await this.leos.updateFulfilmentStatus(id, body.status, { actor, reason });
    if (body.status === 'delivered' && /waiter|staff/i.test(staff.role)) {
      await this.tables.takeIfFree(existing.sessionId, staff).catch(() => null);
    }
    if (reason) {
      void this.push.notifyManagers(
        staff.org,
        cancelAlert({ by: staff.name, placeCode: existing.session.physicalContext?.code, reason }),
      );
    }
    return updated;
  }

  /** Push one order back by 5, 10, 20 or 30 minutes — once per order. */
  @Post(':id/delay')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('fulfilment.update')
  async delay(
    @Param('id') id: string,
    @Body() body: { minutes?: number },
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    const staff = req.staff!;
    // Same rule as moving a ticket: only the station that makes it can push it back.
    const existing = await this.prisma.fulfilment.findUnique({ where: { id } });
    if (!existing || existing.organisationId !== staff.org) {
      throw new ForbiddenException('Fulfilment not found');
    }
    if (
      !this.tokens.canAccessStation(staff.role, existing.stationId) ||
      isDeliverOnlyRole(staff.role, restaurantStationAccess)
    ) {
      throw new ForbiddenException('Only the station making this order can delay it');
    }
    return this.leos.delayFulfilment(id, body?.minutes, staff.org, {
      id: staff.sub,
      name: staff.name,
    });
  }

  /** Every step of one order, with the time and who did it. */
  @Get(':id/timeline')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('fulfilment.read')
  timeline(@Param('id') id: string, @Req() req: { staff?: StaffTokenClaims }) {
    return this.leos.fulfilmentTimeline(id, req.staff!.org);
  }

  @Get('station/:stationId')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('fulfilment.read')
  async listByStation(
    @Param('stationId') stationId: string,
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    const staff = req.staff!;
    if (!this.tokens.canAccessStation(staff.role, stationId)) {
      throw new ForbiddenException('Experience cannot read this station');
    }
    const rows = await this.prisma.fulfilment.findMany({
      where: {
        stationId,
        organisationId: staff.org,
        status: { notIn: ['delivered', 'held'] },
      },
      include: {
        lines: true,
        transaction: { include: { lines: true } },
        session: { include: { physicalContext: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return rows.map((f) => {
      const labelByTxLine = new Map(
        (f.transaction.lines ?? []).map((l) => [l.id, l.label] as const),
      );
      return {
        id: f.id,
        status: f.status,
        stationId: f.stationId,
        sessionId: f.sessionId,
        /** Same place code Guest sees — never invent from Studio place list. */
        placeCode: f.session.physicalContext?.code ?? null,
        createdAt: f.createdAt.toISOString(),
        transaction: { id: f.transactionId },
        lines: f.lines.map((line) => ({
          quantity: line.quantity,
          label: labelByTxLine.get(line.transactionLineId) ?? 'Item',
          transactionLineId: line.transactionLineId,
        })),
      };
    });
  }
}
