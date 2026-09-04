import type { EqualShareGuest } from '@lekki/domain';
import { equalShareState } from '@lekki/domain';

export type EqualShareParticipant = EqualShareGuest & {
  role?: string;
  departedAt?: Date | null;
  equalSplitOptIn?: boolean;
};

export type EqualShareLine = {
  participantId?: string | null;
};

export type EqualShareTransaction = {
  lines?: EqualShareLine[];
};

/**
 * Guests who belong in the equal-share divisor: opted in, or they ordered.
 * A guest who only scanned does not dilute the share.
 */
export function participantsForEqualShare(
  participants: EqualShareParticipant[],
  committed: EqualShareTransaction[],
): EqualShareParticipant[] {
  return participants.filter((p) => {
    if (p.role && p.role !== 'guest') return false;
    if (p.departedAt) return false;
    if (p.equalSplitOptIn) return true;
    return committed.some((t) =>
      (t.lines ?? []).some((l) => l.participantId === p.id),
    );
  });
}

export function equalShareForParticipant(
  participants: EqualShareParticipant[],
  committed: EqualShareTransaction[],
  paidEqualParticipantIds: Set<string>,
  myParticipantId: string,
) {
  const candidates = participantsForEqualShare(participants, committed);
  return equalShareState(candidates, paidEqualParticipantIds, myParticipantId);
}
