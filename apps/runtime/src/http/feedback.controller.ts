import {
  BadRequestException,
  Body,
  ConflictException,
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
import {
  GuestNoteError,
  normaliseGuestNote,
  normaliseNoteReply,
  replyForGuest,
  replyRefusal,
} from '../leos/guest-note';
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
  @RequireStaffPermission('feedback.read')
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
      reply: r.replyBody,
      repliedAt: r.repliedAt?.toISOString() ?? null,
      repliedBy: r.repliedByName,
    }));
  }

  /** A Manager or Admin answers a private note once. The guest sees it while their table is open. */
  @Post('notes/:id/reply')
  @UseGuards(StaffAuthGuard)
  @RequireStaffPermission('feedback.reply')
  async reply(
    @Req() req: { staff?: StaffTokenClaims },
    @Param('id') id: string,
    @Body() body: { reply?: unknown },
  ) {
    const organisationId = req.staff?.org;
    if (!organisationId) throw new MissingFieldError('organisationId');
    let text: string;
    try {
      text = normaliseNoteReply(body?.reply);
    } catch (err) {
      if (err instanceof GuestNoteError) throw new BadRequestException(err.message);
      throw err;
    }
    const note = await this.prisma.guestNote.findFirst({ where: { id: id.trim(), organisationId } });
    const refusal = replyRefusal(note);
    if (refusal && !note) throw new NotFoundException(refusal);
    if (refusal) throw new ConflictException(refusal);
    const repliedAt = new Date();
    // Only a note still unanswered is updated, so two managers can't both reply.
    const { count } = await this.prisma.guestNote.updateMany({
      where: { id: note!.id, organisationId, repliedAt: null },
      data: { replyBody: text, repliedAt, repliedByName: req.staff?.name ?? null },
    });
    if (!count) throw new ConflictException('This note already has a reply.');
    return { id: note!.id, reply: text, repliedAt: repliedAt.toISOString(), repliedBy: req.staff?.name ?? null };
  }

  /**
   * The guest asks whether the manager has replied to them. POST so the participant secret
   * stays out of URLs and logs. Only their own notes count.
   */
  @Post('sessions/:sessionId/note/reply')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async myReply(
    @Param('sessionId') sessionId: string,
    @Body() body: { participantId?: string; participantSecret?: string },
  ) {
    const participantId = body?.participantId?.trim();
    const participantSecret = body?.participantSecret?.trim();
    if (!participantId) throw new MissingFieldError('participantId');
    if (!participantSecret) throw new MissingFieldError('participantSecret');
    await this.access.assertGuestParticipant(sessionId, participantId, participantSecret);
    const notes = await this.prisma.guestNote.findMany({
      where: { sessionId, participantId },
      select: { replyBody: true, repliedAt: true, repliedByName: true },
    });
    return { reply: replyForGuest(notes) };
  }
}
