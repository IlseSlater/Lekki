/**
 * One dish, shared. A bottle for the table splits between the people who say "my share".
 * Every share is a whole number of cents. Remainder cents go to the first people in a stable order,
 * so the shares always add up to the line.
 */
export interface ShareableLine {
  id: string;
  participantId: string | null;
  sharedWith?: readonly string[] | null;
  /** Line total in minor units (unit price × quantity). */
  totalMinor: number;
}

export class ClaimLockedError extends Error {
  constructor() {
    super('Someone is paying for this item right now');
    this.name = 'ClaimLockedError';
  }
}

export class ShareNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ShareNotAllowedError';
  }
}

function pool(line: Pick<ShareableLine, 'sharedWith'>): string[] {
  return [...new Set(line.sharedWith ?? [])].sort();
}

export function isSharedLine(line: Pick<ShareableLine, 'sharedWith'>): boolean {
  return pool(line).length > 0;
}

/** What one guest owes on one line, in minor units. */
export function shareOfLineMinor(line: ShareableLine, participantId: string): number {
  const members = pool(line);
  if (members.length === 0) {
    return line.participantId === participantId ? line.totalMinor : 0;
  }
  const index = members.indexOf(participantId);
  if (index < 0) return 0;
  const base = Math.floor(line.totalMinor / members.length);
  const remainder = line.totalMinor - base * members.length;
  return base + (index < remainder ? 1 : 0);
}

/** Sum of everything a guest owes across the open lines. */
export function mineOrderedMinor(lines: readonly ShareableLine[], participantId: string): number {
  return lines.reduce((sum, l) => sum + shareOfLineMinor(l, participantId), 0);
}

/** True when anyone has put a name on any line, whole or shared. */
export function anyLineAttributed(lines: readonly ShareableLine[]): boolean {
  return lines.some((l) => !!l.participantId || isSharedLine(l));
}

/** Everyone whose money is on this line. */
export function lineOwners(line: Pick<ShareableLine, 'participantId' | 'sharedWith'>): string[] {
  const members = pool(line);
  if (members.length) return members;
  return line.participantId ? [line.participantId] : [];
}

export type ShareAction = 'join' | 'leave';

/**
 * The next owners of a line after a guest joins or leaves its share.
 * Joining is open to an unowned line, the caller's own line, or a line that is already shared.
 */
export function nextShare(
  line: Pick<ShareableLine, 'participantId' | 'sharedWith'>,
  callerId: string,
  action: ShareAction,
): { participantId: string | null; sharedWith: string[] } {
  const members = pool(line);
  if (action === 'join') {
    if (members.length === 0 && line.participantId && line.participantId !== callerId) {
      throw new ShareNotAllowedError('That item belongs to someone else');
    }
    const next = new Set(members);
    if (members.length === 0 && line.participantId === callerId) next.add(callerId);
    next.add(callerId);
    return { participantId: null, sharedWith: [...next].sort() };
  }
  if (members.length === 0) {
    if (line.participantId === callerId) return { participantId: null, sharedWith: [] };
    throw new ShareNotAllowedError('You can only change items on your share');
  }
  if (!members.includes(callerId)) {
    throw new ShareNotAllowedError('You are not part of this share');
  }
  return { participantId: null, sharedWith: members.filter((m) => m !== callerId) };
}

export interface PaymentLockRow {
  status: string;
  participantId?: string | null;
  expiresAt?: Date | null;
}

/** Guests with a payment in flight. Expired reservations do not hold a lock. */
export function guestsPaying(payments: readonly PaymentLockRow[], now: Date = new Date()): Set<string> {
  const paying = new Set<string>();
  for (const p of payments) {
    if (p.status !== 'pending' || !p.participantId) continue;
    if (p.expiresAt && p.expiresAt.getTime() <= now.getTime()) continue;
    paying.add(p.participantId);
  }
  return paying;
}

/** A line is locked while any of its owners has a payment in flight. */
export function assertLinesNotLocked(
  lines: readonly Pick<ShareableLine, 'participantId' | 'sharedWith'>[],
  paying: ReadonlySet<string>,
): void {
  for (const line of lines) {
    if (lineOwners(line).some((owner) => paying.has(owner))) throw new ClaimLockedError();
  }
}
