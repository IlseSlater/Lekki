import type { ResolvedContext } from '@lekki/contracts';
import { ExperienceSessionAggregate } from '@lekki/domain';
import type { ProfileEngine } from '@lekki/profile-engine';
import { newCorrelationId, newId, err, ok, type Result } from '@lekki/shared';

export interface SessionRecord {
  id: string;
  organisationId: string;
  venueId: string;
  physicalContextId: string;
  profileId: string;
  profileVersion: string;
  status: string;
  correlationId: string;
  startedAt: Date;
  completedAt?: Date | null;
  participants: Array<{
    id: string;
    identityId?: string | null;
    displayName: string;
    role: string;
    joinedAt: Date;
  }>;
}

export interface SessionRepository {
  findActiveByPhysicalContext(physicalContextId: string): Promise<SessionRecord | null>;
  save(session: SessionRecord): Promise<void>;
  findById(id: string): Promise<SessionRecord | null>;
}

export interface PhysicalContextSessionBinding {
  bindSession(physicalContextId: string, sessionId: string): Promise<void>;
  clearSession(physicalContextId: string): Promise<void>;
}

export type StartOrResumeResult = {
  session: SessionRecord;
  joined: boolean;
  participantId: string;
};

function findResumableParticipant(
  participants: SessionRecord['participants'],
  incoming: { displayName: string; identityId?: string; resumeParticipantId?: string },
): SessionRecord['participants'][number] | undefined {
  if (incoming.resumeParticipantId) {
    const byId = participants.find((p) => p.id === incoming.resumeParticipantId);
    if (byId) return byId;
  }
  const identity = incoming.identityId?.trim();
  if (identity) {
    const byIdentity = participants.find((p) => (p.identityId ?? '').trim() === identity);
    if (byIdentity) return byIdentity;
  }
  const name = incoming.displayName.trim().toLowerCase();
  if (!name) return undefined;
  return participants.find((p) => p.displayName.trim().toLowerCase() === name);
}

export class ExperienceRuntime {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly contextBinding: PhysicalContextSessionBinding,
    private readonly profiles: ProfileEngine,
  ) {}

  async startOrResume(
    context: ResolvedContext,
    participant: { displayName: string; identityId?: string; resumeParticipantId?: string },
  ): Promise<Result<StartOrResumeResult>> {
    const surfaces = context.profile.surfaces;
    if (!surfaces.includes('guest')) {
      return err('Guest surface not enabled for profile');
    }

    const existing = await this.sessions.findActiveByPhysicalContext(
      context.physicalContextId,
    );
    if (existing && existing.status !== 'completed' && existing.status !== 'archived') {
      const resumed = findResumableParticipant(existing.participants, participant);
      if (resumed) {
        return ok({ session: existing, joined: false, participantId: resumed.id });
      }
      const participantId = newId('part');
      existing.participants.push({
        id: participantId,
        identityId: participant.identityId ?? null,
        displayName: participant.displayName,
        role: 'guest',
        joinedAt: new Date(),
      });
      await this.sessions.save(existing);
      return ok({ session: existing, joined: true, participantId });
    }

    const sessionId = newId('sess');
    const aggregate = ExperienceSessionAggregate.create({
      id: sessionId,
      organisationId: context.organisationId,
      venueId: context.venueId,
      physicalContextId: context.physicalContextId,
      profileId: context.profile.id,
      profileVersion: context.profile.version,
      correlationId: newCorrelationId(),
    });

    const participantId = newId('part');
    aggregate.addParticipant({
      id: participantId,
      identityId: participant.identityId,
      displayName: participant.displayName,
      role: 'guest',
      joinedAt: new Date(),
    });

    const record: SessionRecord = {
      id: aggregate.id,
      organisationId: aggregate.organisationId,
      venueId: aggregate.venueId,
      physicalContextId: aggregate.physicalContextId,
      profileId: aggregate.profileId,
      profileVersion: aggregate.profileVersion,
      status: aggregate.status,
      correlationId: aggregate.correlationId,
      startedAt: aggregate.startedAt,
      participants: aggregate.participants.map((p) => ({
        id: p.id,
        identityId: p.identityId ?? null,
        displayName: p.displayName,
        role: p.role,
        joinedAt: p.joinedAt,
      })),
    };

    await this.sessions.save(record);
    await this.contextBinding.bindSession(context.physicalContextId, sessionId);
    return ok({ session: record, joined: true, participantId });
  }

  async completeSession(sessionId: string): Promise<Result<SessionRecord>> {
    const session = await this.sessions.findById(sessionId);
    if (!session) {
      return err('Session not found');
    }

    session.status = 'completed';
    session.completedAt = new Date();
    await this.sessions.save(session);
    await this.contextBinding.clearSession(session.physicalContextId);
    return ok(session);
  }

  async getActiveSurfaces(profileId: string, version: string) {
    const profile = await this.profiles.load({ profileId, version });
    if (!profile.ok) {
      return profile;
    }
    return ok(profile.value.surfaces);
  }
}
