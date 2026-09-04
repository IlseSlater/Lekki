import { Injectable } from '@nestjs/common';
import type {
  PhysicalContextSessionBinding,
  SessionRecord,
  SessionRepository,
} from '@lekki/runtime-experience';
import { newId } from '@lekki/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: {
    id: string;
    organisationId: string;
    venueId: string;
    physicalContextId: string;
    profileId: string;
    profileVersion: string;
    status: string;
    correlationId: string;
    startedAt: Date;
    completedAt: Date | null;
    participants: Array<{
      id: string;
      identityId: string | null;
      displayName: string;
      role: string;
      joinedAt: Date;
      participantSecret: string | null;
      departedAt: Date | null;
      equalSplitOptIn: boolean;
    }>;
  }): SessionRecord {
    return {
      id: row.id,
      organisationId: row.organisationId,
      venueId: row.venueId,
      physicalContextId: row.physicalContextId,
      profileId: row.profileId,
      profileVersion: row.profileVersion,
      status: row.status,
      correlationId: row.correlationId,
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      participants: row.participants.map((p) => ({
        id: p.id,
        identityId: p.identityId,
        displayName: p.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
        participantSecret: p.participantSecret ?? undefined,
        departedAt: p.departedAt,
        equalSplitOptIn: p.equalSplitOptIn,
      })),
    };
  }

  async findActiveByPhysicalContext(physicalContextId: string): Promise<SessionRecord | null> {
    const row = await this.prisma.experienceSession.findFirst({
      where: {
        physicalContextId,
        status: { in: ['created', 'active', 'settling'] },
      },
      include: { participants: true },
      orderBy: { startedAt: 'desc' },
    });
    return row ? this.map(row) : null;
  }

  async findById(id: string): Promise<SessionRecord | null> {
    const row = await this.prisma.experienceSession.findUnique({
      where: { id },
      include: { participants: true },
    });
    return row ? this.map(row) : null;
  }

  async save(session: SessionRecord): Promise<void> {
    await this.prisma.experienceSession.upsert({
      where: { id: session.id },
      create: {
        id: session.id,
        organisationId: session.organisationId,
        venueId: session.venueId,
        physicalContextId: session.physicalContextId,
        profileId: session.profileId,
        profileVersion: session.profileVersion,
        status: session.status,
        correlationId: session.correlationId,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        participants: {
          create: session.participants.map((p) => ({
            id: p.id,
            identityId: p.identityId ?? undefined,
            displayName: p.displayName,
            role: p.role,
            joinedAt: p.joinedAt,
            participantSecret: p.participantSecret ?? newId('sec'),
            departedAt: p.departedAt ?? undefined,
            equalSplitOptIn: p.equalSplitOptIn ?? false,
          })),
        },
      },
      update: {
        status: session.status,
        completedAt: session.completedAt,
      },
    });

    for (const p of session.participants) {
      await this.prisma.sessionParticipant.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          sessionId: session.id,
          identityId: p.identityId ?? undefined,
          displayName: p.displayName,
          role: p.role,
          joinedAt: p.joinedAt,
          participantSecret: p.participantSecret ?? newId('sec'),
          departedAt: p.departedAt ?? undefined,
          equalSplitOptIn: p.equalSplitOptIn ?? false,
        },
        update: {
          displayName: p.displayName,
          identityId: p.identityId ?? undefined,
          role: p.role,
          departedAt: p.departedAt ?? undefined,
          equalSplitOptIn: p.equalSplitOptIn ?? false,
        },
      });
    }
  }
}

@Injectable()
export class PrismaPhysicalContextBinding implements PhysicalContextSessionBinding {
  constructor(private readonly prisma: PrismaService) {}

  async bindSession(physicalContextId: string, sessionId: string): Promise<void> {
    await this.prisma.physicalContext.update({
      where: { id: physicalContextId },
      data: { activeSessionId: sessionId },
    });
  }

  async clearSession(physicalContextId: string): Promise<void> {
    await this.prisma.physicalContext.update({
      where: { id: physicalContextId },
      data: { activeSessionId: null },
    });
  }
}
