/**
 * Guest first impression — QR token is enough. No account / OTP / birthday wall.
 * Walk: splash (Lekki, 4s, skip) → venue landing → Get started → menu.
 */

export function canEnterWithToken(entryToken: string | null | undefined): boolean {
  return !!(entryToken ?? '').trim();
}

/** Returning = completed at least one Leave — not a filled signup form. */
export function isReturningByVisits(visitCount: number | null | undefined): boolean {
  return (visitCount ?? 0) >= 1;
}

/** Brand splash: 4s hold, tap to skip. Logo motion is 3s inside that budget. */
export const GUEST_SPLASH_MAX_MS = 4000;

export type SplashWelcome = 'still' | 'back';

/** Query after splash resolve — first visit has no welcome param (landing owns the moment). */
export function splashWelcomeQuery(input: {
  stillIn: boolean;
  returning: boolean;
}): SplashWelcome | undefined {
  if (input.stillIn) return 'still';
  if (input.returning) return 'back';
  return undefined;
}

export type FirstImpressionLand = 'arrival' | 'keep' | 'skip';

/**
 * Where the Experience shell opens after splash/entry.
 * Arrival is first visit only. Return / still-in skip it. Get started is always menu, not Specials.
 */
export function firstImpressionLand(input: {
  hasSession: boolean;
  paymentResult?: string | null;
  restoredPhase?: string | null;
  skipLanding: boolean;
}): FirstImpressionLand {
  if (!input.hasSession) return 'skip';
  if (input.paymentResult) return 'skip';
  if (input.restoredPhase === 'arrival') return 'arrival';
  if (input.restoredPhase) return 'keep';
  if (input.skipLanding) return 'skip';
  return 'arrival';
}

export function menuPhaseAfterGetStarted(): 'browse' {
  return 'browse';
}
