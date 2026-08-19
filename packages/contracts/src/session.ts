export type SessionStatus =
  | 'created'
  | 'active'
  | 'settling'
  | 'completed'
  | 'archived';

export type ParticipantRole = 'guest' | 'staff' | 'system';

export interface SessionParticipantView {
  id: string;
  identityId?: string;
  displayName: string;
  role: ParticipantRole;
  joinedAt: string;
}

export interface ExperienceSessionView {
  id: string;
  organisationId: string;
  venueId: string;
  physicalContextId: string;
  profileId: string;
  profileVersion: string;
  status: SessionStatus;
  participants: SessionParticipantView[];
  correlationId: string;
  startedAt: string;
  completedAt?: string;
}
