/**
 * Guest-side money — integer minor units only.
 * Matches runtime `apps/runtime/src/leos/money.ts` (exact cents, no float epsilon).
 */

export function toMinor(amount: number | string | null | undefined): number {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromMinor(minor: number): number {
  return Math.round(minor) / 100;
}

/** True when major-unit balance has at least one cent remaining. */
export function hasOpenBalance(amount: number | string | null | undefined): boolean {
  return toMinor(amount) > 0;
}

/** True when major-unit balance is fully cleared (0 cents or less). */
export function isCleared(amount: number | string | null | undefined): boolean {
  return toMinor(amount) <= 0;
}

/** Strict greater-than in cents. */
export function isGreaterMinor(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  return toMinor(left) > toMinor(right);
}
