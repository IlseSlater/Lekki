/**
 * Session-wide payment capacity — row 5 closed by constraint, not by a race test.
 * Remaining = billMinor − paidMinor. Reserve with an optimistic version check.
 * Abandoned gateway redirects expire so paidMinor and pending unique indexes release.
 * Late settle after expiry must re-take capacity or flag overpayment (row 10).
 */

/** Gateway / pending payment reservation window. */
export const PENDING_PAYMENT_TTL_MS = 15 * 60 * 1000;

export function sessionRemainingMinor(billMinor: number, paidMinor: number): number {
  return Math.max(0, billMinor - paidMinor);
}

/** True when a reserve of baseMinor would succeed under the DB predicate. */
export function canReservePayment(input: {
  billMinor: number;
  paidMinor: number;
  version: number;
  versionRead: number;
  baseMinor: number;
}): boolean {
  if (input.baseMinor <= 0) return false;
  if (input.version !== input.versionRead) return false;
  return input.paidMinor + input.baseMinor <= input.billMinor;
}

/** Base toward the bill (ex-tip) from a payment amount + tip. */
export function paymentBaseMinor(amountMinor: number, tipMinor: number): number {
  return Math.max(0, amountMinor - Math.max(0, tipMinor));
}

export function paymentExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + PENDING_PAYMENT_TTL_MS);
}

/**
 * A pending reservation past expiresAt must not hold capacity.
 * Null expiresAt is treated as not yet expired (legacy / in-flight create).
 */
export function isPendingReservationExpired(input: {
  status: string;
  expiresAt: Date | null | undefined;
  now?: Date;
}): boolean {
  if (input.status !== 'pending') return false;
  if (!input.expiresAt) return false;
  const now = input.now ?? new Date();
  return input.expiresAt.getTime() <= now.getTime();
}

/** After expiry, paidMinor must drop the reserved base (never below zero). */
export function paidMinorAfterExpiryRelease(
  paidMinor: number,
  reservedBaseMinor: number,
): number {
  return Math.max(0, paidMinor - Math.max(0, reservedBaseMinor));
}

const SETTLED_STATUSES = new Set([
  'completed',
  'settled',
  'needs_refund',
  'refunded',
]);

/**
 * Late ITN / complete after the expiry sweep released the reservation.
 * Pending still holds capacity; expired (and any other released status) must
 * re-take; if the session has no room left, that is a real overpayment (row 10).
 */
export function settlementCapacityAction(input: {
  priorStatus: string;
  billMinor: number;
  paidMinor: number;
  baseMinor: number;
}): 'idempotent' | 'use_held' | 'retake' | 'overpayment' {
  if (SETTLED_STATUSES.has(input.priorStatus)) return 'idempotent';
  if (input.priorStatus === 'pending') return 'use_held';
  if (input.baseMinor <= 0) return 'retake';
  if (input.paidMinor + input.baseMinor <= input.billMinor) return 'retake';
  return 'overpayment';
}

/** After a successful re-take, paidMinor includes the base again. */
export function paidMinorAfterRetake(
  paidMinor: number,
  baseMinor: number,
): number {
  return paidMinor + Math.max(0, baseMinor);
}
