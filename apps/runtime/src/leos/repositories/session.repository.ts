import { Injectable } from '@nestjs/common';
import type {
  PhysicalContextSessionBinding,
  SessionRecord,
  SessionRepository,
} from '@lekki/runtime-experience';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private map(row: Awaited<ReturnType<PrismaService['experienceSession']['findFirst']>> & object): SessionRecord {
    const session = row as {
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
      }>;
    };
    return {
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
      participants: session.participants.map((p) => ({
        id: p.id,
        identityId: p.identityId,
        displayName: p.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
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
          })),
        },
      },
      update: {
        status: session.status,
        completedAt: session.completedAt,
        participants: {
          deleteMany: {},
          create: session.participants.map((p) => ({
            id: p.id,
            identityId: p.identityId ?? undefined,
            displayName: p.displayName,
            role: p.role,
            joinedAt: p.joinedAt,
          })),
        },
      },
    });
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
