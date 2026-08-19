import { Body, Controller, ForbiddenException, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { PrismaService } from '../prisma/prisma.service';
import { StaffAuthGuard, RequireStaffPermission } from '../staff-auth/staff-auth.guard';
import { StaffTokenService, type StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('fulfilments')
export class FulfilmentController {
  constructor(
    private readonly leos: LeosService,
    private readonly prisma: PrismaService,
    private readonly tokens: StaffTokenService,
  ) {}

  @Patch(':id/status')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('fulfilment.update')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
    @Req() req: { staff?: StaffTokenClaims },
  ) {
    const staff = req.staff!;
    const existing = await this.prisma.fulfilment.findUnique({ where: { id } });
    if (!existing) throw new ForbiddenException('Fulfilment not found');
    if (existing.organisationId !== staff.org) {
      throw new ForbiddenException('Wrong organisation');
    }
    if (!this.tokens.canAccessStation(staff.role, existing.stationId)) {
      throw new ForbiddenException('Experience cannot update this station');
    }
    // Waiter may only mark ready → delivered (serve)
    if (staff.role === 'waiter' && body.status !== 'delivered') {
      throw new ForbiddenException('Waiter can only mark served');
    }
    return this.leos.updateFulfilmentStatus(id, body.status);
  }

  @Get('station/:stationId')
  async listByStation(@Param('stationId') stationId: string) {
    const rows = await this.prisma.fulfilment.findMany({
      where: { stationId, status: { not: 'delivered' } },
      include: {
        lines: true,
        transaction: { include: { lines: true } },
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
