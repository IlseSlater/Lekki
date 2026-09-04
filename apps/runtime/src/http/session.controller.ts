import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LeosService } from '../leos/leos.service';
import { PrismaService } from '../prisma/prisma.service';
import { SessionAccessService } from '../leos/session-access.service';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import { MissingFieldError } from '../leos/domain-errors';

@Controller('sessions')
export class SessionController {
  constructor(
    private readonly leos: LeosService,
    private readonly prisma: PrismaService,
    private readonly sessionAccess: SessionAccessService,
  ) {}

  @Get(':id')
  async get(
    @Param('id') id: string,
    @Req() req: { headers: Record<string, string | undefined> },
  ) {
    await this.sessionAccess.assertReadAccess(id, req.headers);

    const session = await this.prisma.experienceSession.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            id: true,
            displayName: true,
            role: true,
            joinedAt: true,
            departedAt: true,
            equalSplitOptIn: true,
          },
        },
        physicalContext: true,
        transactions: { include: { lines: true } },
        fulfilments: { include: { lines: true } },
        payments: true,
        assistanceRequests: { where: { status: 'open' } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    const venue = await this.prisma.venue.findUnique({
      where: { id: session.venueId },
      select: {
        name: true,
        menuBrandEnabled: true,
        brandColour: true,
        guestDesignJson: true,
      },
    });

    const guestDesign =
      venue?.guestDesignJson && typeof venue.guestDesignJson === 'object'
        ? venue.guestDesignJson
        : null;

    const labelByTxLine = new Map(
      session.transactions.flatMap((t) =>
        (t.lines ?? []).map((l) => [l.id, l.label] as const),
      ),
    );
    const notesByTxLine = new Map(
      session.transactions.flatMap((t) =>
        (t.lines ?? []).map((l) => [l.id, l.notes] as const),
      ),
    );

    return {
      ...session,
      placeCode: session.physicalContext?.code ?? null,
      venueName: venue?.name ?? null,
      menuBrandEnabled: !!venue?.menuBrandEnabled,
      brandColour: venue?.brandColour || '#d7a14a',
      guestDesign,
      fulfilments: session.fulfilments.map((f) => ({
        id: f.id,
        status: f.status,
        stationId: f.stationId,
        sessionId: f.sessionId,
        createdAt: f.createdAt,
        lines: f.lines.map((line) => ({
          quantity: line.quantity,
          label: labelByTxLine.get(line.transactionLineId) ?? 'Item',
          notes: notesByTxLine.get(line.transactionLineId) ?? null,
          transactionLineId: line.transactionLineId,
        })),
      })),
    };
  }

  /** Guest leaves their seat — does not close the table unless last guest. */
  @Post(':id/leave')
  leave(
    @Param('id') id: string,
    @Body() body: { participantId?: string; participantSecret?: string },
  ) {
    const participantId = body?.participantId?.trim();
    const participantSecret = body?.participantSecret?.trim();
    if (!participantId) throw new MissingFieldError('participantId');
    if (!participantSecret) throw new MissingFieldError('participantSecret');
    return this.leos.leaveSession({ sessionId: id, participantId, participantSecret });
  }

  /** Staff force-clear table. */
  @Post(':id/close')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('session.close')
  close(@Param('id') id: string) {
    return this.leos.closeSession(id);
  }

  @Post(':id/claim-lines')
  claimLines(
    @Param('id') id: string,
    @Body() body: { participantId?: string | null; lineIds?: string[]; participantSecret?: string },
  ) {
    const participantSecret = body?.participantSecret?.trim();
    if (!participantSecret) throw new MissingFieldError('participantSecret');
    return this.leos.claimLines({
      sessionId: id,
      participantId: body?.participantId ?? null,
      lineIds: body?.lineIds ?? [],
      participantSecret,
    });
  }
}
