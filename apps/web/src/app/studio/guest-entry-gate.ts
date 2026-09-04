/**
 * Batch 6 — Guest entry gate (pure).
 * Menu first: a QR token is enough. No account / OTP / birthday wall.
 */

export function canEnterWithToken(entryToken: string | null | undefined): boolean {
  return !!(entryToken ?? '').trim();
}

/** Returning = completed at least one Leave — not a filled signup form. */
export function isReturningByVisits(visitCount: number | null | undefined): boolean {
  return (visitCount ?? 0) >= 1;
}

/** Brand splash must stay under 1s and be skippable (Batch 6). */
export const GUEST_SPLASH_MAX_MS = 900;
