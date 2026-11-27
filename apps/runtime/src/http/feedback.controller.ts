import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { newId } from '@lekki/shared';
import { PrismaService } from '../prisma/prisma.service';
import { SessionAccessService } from '../leos/session-access.service';
import { GuestNoteError, normaliseGuestNote } from '../leos/guest-note';
import { MissingFieldError } from '../leos/domain-errors';
import { RequireStaffPermission, StaffAuthGuard } from '../staff-auth/staff-auth.guard';
import type { StaffTokenClaims } from '../staff-auth/staff-token.service';

/**
 * After the meal, every guest can tell the manager privately.
 * The manager reads these in Studio. Other guests never see them.
 */
@Controller('feedback')
export class FeedbackController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: SessionAccessService,
  ) {}

  @Post('sessions/:sessionId/note')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async leaveNote(
    @Param('sessionId') sessionId: string,
    @Body() body: { participantId?: string; participantSecret?: string; note?: unknown },
  ) {
    const participantId = body?.participantId?.trim();
    const participantSecret = body?.participantSecret?.trim();
    if (!participantId) throw new MissingFieldError('participantId');
    if (!participantSecret) throw new MissingFieldError('participantSecret');
    await this.access.assertGuestParticipant(sessionId, participantId, participantSecret);

    let text: string;
    try {
      text = normaliseGuestNote(body?.note);
    } catch (err) {
      if (err instanceof GuestNoteError) throw new BadRequestException(err.message);
      throw err;
    }

    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      select: {
        organisationId: true,
        venueId: true,
        physicalContext: { select: { code: true } },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    await this.prisma.guestNote.create({
      data: {
        id: newId('note'),
        organisationId: session.organisationId,
        venueId: session.venueId,
        sessionId,
        participantId,
        placeCode: session.physicalContext?.code ?? null,
        body: text,
      },
    });
    return { ok: true };
  }

  @Get('notes')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('organisation.manage')
  async listNotes(@Req() req: { staff?: StaffTokenClaims }) {
    const organisationId = req.staff?.org;
    if (!organisationId) throw new MissingFieldError('organisationId');
    const rows = await this.prisma.guestNote.findMany({
      where: { organisationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return rows.map((r) => ({
      id: r.id,
      placeCode: r.placeCode,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
    }));
  }
}
