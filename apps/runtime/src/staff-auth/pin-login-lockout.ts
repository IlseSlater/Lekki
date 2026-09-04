/**
 * Staff PIN / password login lockout — pure predicates for Batch 2.
 * Ten failures lock the account; further failures grow the lock window.
 */

export const PIN_LOCK_AFTER_FAILURES = 10;
export const PIN_LOCK_CAP_MS = 60 * 60 * 1000;

export type PinAttemptState = {
  failures: number;
  lockedUntil: number;
};

export function emptyPinAttemptState(): PinAttemptState {
  return { failures: 0, lockedUntil: 0 };
}

/** Lock duration after `failures` consecutive wrong attempts (0 if under threshold). */
export function lockMsAfterFailures(failures: number): number {
  if (failures < PIN_LOCK_AFTER_FAILURES) return 0;
  const excess = failures - PIN_LOCK_AFTER_FAILURES + 1;
  return Math.min(PIN_LOCK_CAP_MS, 1000 * 2 ** excess);
}

export function isPinLocked(state: PinAttemptState, nowMs: number): boolean {
  return state.lockedUntil > nowMs;
}

export function recordPinFailure(
  state: PinAttemptState,
  nowMs: number,
): PinAttemptState {
  const failures = state.failures + 1;
  const lockMs = lockMsAfterFailures(failures);
  return {
    failures,
    lockedUntil: lockMs > 0 ? nowMs + lockMs : state.lockedUntil,
  };
}

export function clearPinFailures(): PinAttemptState {
  return emptyPinAttemptState();
}
