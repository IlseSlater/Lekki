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
    participantSecret?: string;
    departedAt?: Date | null;
    equalSplitOptIn?: boolean;
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
  participantSecret: string;
};

function findResumableParticipant(
  participants: SessionRecord['participants'],
  incoming: {
    displayName: string;
    identityId?: string;
    resumeParticipantId?: string;
    participantSecret?: string;
  },
): SessionRecord['participants'][number] | undefined {
  const secret = incoming.participantSecret?.trim();
  if (secret) {
    const bySecret = participants.find(
      (p) => p.participantSecret === secret && !p.departedAt,
    );
    if (bySecret) return bySecret;
  }
  if (incoming.resumeParticipantId) {
    const byId = participants.find(
      (p) => p.id === incoming.resumeParticipantId && !p.departedAt,
    );
    if (byId) return byId;
  }
  const identity = incoming.identityId?.trim();
  if (identity) {
    const byIdentity = participants.find(
      (p) => (p.identityId ?? '').trim() === identity && !p.departedAt,
    );
    if (byIdentity) return byIdentity;
  }
  // Never resume by display name — prevents session hijacking.
  return undefined;
}

export class ExperienceRuntime {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly contextBinding: PhysicalContextSessionBinding,
    private readonly profiles: ProfileEngine,
  ) {}

  async startOrResume(
    context: ResolvedContext,
    participant: {
      displayName: string;
      identityId?: string;
      resumeParticipantId?: string;
      participantSecret?: string;
    },
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
        return ok({
          session: existing,
          joined: false,
          participantId: resumed.id,
          participantSecret: resumed.participantSecret ?? '',
        });
      }
      const participantId = newId('part');
      const participantSecret = newId('sec');
      existing.participants.push({
        id: participantId,
        identityId: participant.identityId ?? null,
        displayName: participant.displayName,
        role: 'guest',
        joinedAt: new Date(),
        participantSecret,
        departedAt: null,
        equalSplitOptIn: false,
      });
      await this.sessions.save(existing);
      return ok({
        session: existing,
        joined: true,
        participantId,
        participantSecret,
      });
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
    const participantSecret = newId('sec');
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
        participantSecret: p.id === participantId ? participantSecret : undefined,
        departedAt: null,
        equalSplitOptIn: false,
      })),
    };

    await this.sessions.save(record);
    await this.contextBinding.bindSession(context.physicalContextId, sessionId);
    return ok({
      session: record,
      joined: true,
      participantId,
      participantSecret,
    });
  }

  async departParticipant(
    sessionId: string,
    participantId: string,
  ): Promise<Result<{ closed: boolean; session: SessionRecord }>> {
    const session = await this.sessions.findById(sessionId);
    if (!session) return err('Session not found');

    const participant = session.participants.find((p) => p.id === participantId);
    if (!participant) return err('Participant not on this visit');
    participant.departedAt = new Date();
    await this.sessions.save(session);

    const activeGuests = session.participants.filter(
      (p) => p.role === 'guest' && !p.departedAt,
    );
    if (activeGuests.length > 0) {
      return ok({ closed: false, session });
    }

    const completed = await this.completeSession(sessionId);
    if (!completed.ok) return completed;
    return ok({ closed: true, session: completed.value });
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
