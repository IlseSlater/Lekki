/** Session participant row — enough to authenticate claim-lines. */
export type ClaimParticipant = {
  id: string;
  participantSecret: string | null;
  departedAt: Date | null;
  role: string;
};

export type ClaimLineRow = {
  id: string;
  participantId: string | null;
};

/**
 * Resolve the caller from their server-issued participant secret.
 * Secrets are unique per participant — never match by display name.
 */
export function resolveParticipantBySecret(
  participants: ClaimParticipant[],
  secret: string | undefined | null,
): ClaimParticipant | null {
  const trimmed = secret?.trim();
  if (!trimmed) return null;
  return (
    participants.find(
      (p) =>
        p.participantSecret === trimmed &&
        !p.departedAt &&
        p.role === 'guest',
    ) ?? null
  );
}

/** Caller must match participantId — secret alone is not enough when id is supplied. */
export function assertCallerIsParticipant(
  participants: ClaimParticipant[],
  participantId: string,
  participantSecret: string,
): ClaimParticipant {
  const caller = resolveParticipantBySecret(participants, participantSecret);
  if (!caller) throw new Error('Invalid participant credentials');
  if (caller.id !== participantId.trim()) {
    throw new Error('Participant credentials do not match');
  }
  return caller;
}

/**
 * Claim-lines authorization:
 * - Caller must be authenticated (secret).
 * - Target owner is null (unassign) or the caller — never another guest.
 * - Claim to self: line must be unassigned.
 * - Unassign: line must currently belong to caller.
 */
export function assertClaimLinesAllowed(
  caller: ClaimParticipant,
  targetParticipantId: string | null,
  lines: ClaimLineRow[],
): void {
  if (targetParticipantId && targetParticipantId !== caller.id) {
    throw new Error('You can only assign items to your own share');
  }

  for (const line of lines) {
    const owner = line.participantId;
    if (targetParticipantId === caller.id) {
      if (owner && owner !== caller.id) {
        throw new Error('That item belongs to someone else');
      }
    } else {
      if (owner !== caller.id) {
        throw new Error('You can only change items on your share');
      }
    }
  }
}
