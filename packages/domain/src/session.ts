import type { SessionStatus } from '@lekki/contracts';
import { newCorrelationId } from '@lekki/shared';

export interface SessionParticipant {
  id: string;
  identityId?: string;
  displayName: string;
  role: 'guest' | 'staff' | 'system';
  joinedAt: Date;
}

export class ExperienceSessionAggregate {
  readonly correlationId: string;

  private constructor(
    readonly id: string,
    readonly organisationId: string,
    readonly venueId: string,
    readonly physicalContextId: string,
    readonly profileId: string,
    readonly profileVersion: string,
    private _status: SessionStatus,
    readonly participants: SessionParticipant[],
    readonly startedAt: Date,
    private _completedAt?: Date,
    correlationId?: string,
  ) {
    this.correlationId = correlationId ?? newCorrelationId();
  }

  static create(input: {
    id: string;
    organisationId: string;
    venueId: string;
    physicalContextId: string;
    profileId: string;
    profileVersion: string;
    correlationId?: string;
  }): ExperienceSessionAggregate {
    return new ExperienceSessionAggregate(
      input.id,
      input.organisationId,
      input.venueId,
      input.physicalContextId,
      input.profileId,
      input.profileVersion,
      'active',
      [],
      new Date(),
      undefined,
      input.correlationId,
    );
  }

  get status(): SessionStatus {
    return this._status;
  }

  get completedAt(): Date | undefined {
    return this._completedAt;
  }

  addParticipant(participant: SessionParticipant): void {
    if (this._status === 'completed' || this._status === 'archived') {
      throw new Error('Cannot join a completed session');
    }
    this.participants.push(participant);
  }

  beginSettlement(): void {
    this._status = 'settling';
  }

  complete(): void {
    this._status = 'completed';
    this._completedAt = new Date();
  }
}

/** Guest used for Equal share — identity first, else the name they joined with. */
export type EqualShareGuest = {
  id: string;
  identityId?: string | null;
  displayName: string;
  role?: string;
};

export function guestShareKey(guest: EqualShareGuest): string {
  const identity = guest.identityId?.trim();
  if (identity) return `id:${identity}`;
  const name = guest.displayName.trim().toLowerCase();
  return name ? `name:${name}` : `row:${guest.id}`;
}

function isGuestRole(role?: string): boolean {
  return !role || role === 'guest';
}

/**
 * Equal share slots are distinct people, not QR re-entries.
 * Duplicate joins of the same name/identity count as one guest.
 */
export function equalShareState(
  participants: EqualShareGuest[],
  paidEqualParticipantIds: Set<string>,
  myParticipantId?: string | null,
): { distinct: number; unpaid: number; minePaid: boolean } {
  const keys = new Set<string>();
  const paidKeys = new Set<string>();
  let myKey = '';
  for (const guest of participants) {
    if (!isGuestRole(guest.role)) continue;
    const key = guestShareKey(guest);
    keys.add(key);
    if (paidEqualParticipantIds.has(guest.id)) paidKeys.add(key);
    if (myParticipantId && guest.id === myParticipantId) myKey = key;
  }
  return {
    distinct: keys.size,
    unpaid: Math.max(0, keys.size - paidKeys.size),
    minePaid: !!myKey && paidKeys.has(myKey),
  };
}
