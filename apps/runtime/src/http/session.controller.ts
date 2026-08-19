import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { PrismaService } from '../prisma/prisma.service';
import { OptionalStaff, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import { StaffTokenService, type StaffTokenClaims } from '../staff-auth/staff-token.service';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly leos: LeosService,
    private readonly prisma: PrismaService,
    private readonly tokens: StaffTokenService,
  ) {}

  @Get(':id')
  async get(@Param('id') id: string) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id },
      include: {
        participants: true,
        physicalContext: true,
        transactions: { include: { lines: true } },
        fulfilments: { include: { lines: true } },
        payments: true,
        assistanceRequests: { where: { status: 'open' } },
      },
    });
    if (!session) return null;

    const labelByTxLine = new Map(
      session.transactions.flatMap((t) =>
        (t.lines ?? []).map((l) => [l.id, l.label] as const),
      ),
    );

    return {
      ...session,
      placeCode: session.physicalContext?.code ?? null,
      fulfilments: session.fulfilments.map((f) => ({
        id: f.id,
        status: f.status,
        stationId: f.stationId,
        sessionId: f.sessionId,
        createdAt: f.createdAt,
        lines: f.lines.map((line) => ({
          quantity: line.quantity,
          label: labelByTxLine.get(line.transactionLineId) ?? 'Item',
          transactionLineId: line.transactionLineId,
        })),
      })),
    };
  }

  /** Guest leave (no token) or Staff clear table (requires session.close). */
  @Post(':id/close')
  @UseGuards(StaffAuthGuard)
  @OptionalStaff()
  close(@Param('id') id: string, @Req() req: { staff?: StaffTokenClaims }) {
    if (req.staff) {
      this.tokens.requirePermission(req.staff, 'session.close');
    }
    return this.leos.closeSession(id);
  }

  /** Claim-from-table — stamp open lines as yours, then pay Mine as usual. */
  @Post(':id/claim-lines')
  claimLines(
    @Param('id') id: string,
    @Body() body: { participantId?: string | null; lineIds?: string[] },
  ) {
    return this.leos.claimLines({
      sessionId: id,
      participantId: body?.participantId ?? null,
      lineIds: body?.lineIds ?? [],
    });
  }
}
