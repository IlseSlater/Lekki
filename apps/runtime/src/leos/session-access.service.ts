import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffTokenService } from '../staff-auth/staff-token.service';
import {
  assertCallerIsParticipant,
  resolveParticipantBySecret,
  type ClaimParticipant,
} from './participant-auth';

export type SessionAccessHeaders = Record<string, string | undefined>;

@Injectable()
export class SessionAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffTokens: StaffTokenService,
  ) {}

  /** Guest participant secret or staff token whose org matches the session. */
  async assertReadAccess(sessionId: string, headers: SessionAccessHeaders) {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        organisationId: true,
        venueId: true,
        participants: {
          select: {
            id: true,
            participantSecret: true,
            departedAt: true,
            role: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');

    const staffHeader =
      headers['x-staff-token'] ||
      headers['authorization'] ||
      headers['Authorization'];
    if (staffHeader) {
      const claims = this.staffTokens.verify(staffHeader);
      await this.staffTokens.assertActive(claims);
      if (claims.org !== session.organisationId) {
        throw new ForbiddenException('Staff token does not match this visit');
      }
      return session;
    }

    const secret = headers['x-participant-secret']?.trim();
    const guest = resolveParticipantBySecret(session.participants, secret);
    if (!guest) {
      throw new UnauthorizedException('Participant authentication required');
    }
    return session;
  }

  /** Verify participantId belongs to the holder of participantSecret on this session. */
  async assertGuestParticipant(
    sessionId: string,
    participantId: string,
    participantSecret: string,
  ): Promise<ClaimParticipant> {
    const session = await this.prisma.experienceSession.findUnique({
      where: { id: sessionId },
      select: {
        participants: {
          select: {
            id: true,
            participantSecret: true,
            departedAt: true,
            role: true,
          },
        },
      },
    });
    if (!session) throw new NotFoundException('Session not found');
    try {
      return assertCallerIsParticipant(
        session.participants,
        participantId,
        participantSecret,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid participant credentials';
      throw new UnauthorizedException(message);
    }
  }
}
