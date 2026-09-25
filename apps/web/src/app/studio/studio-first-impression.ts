/**
 * Continuity — Studio first impression (sign-in → welcome → create).
 * Craft within frozen motion — no new ADR patterns.
 */

/** Settle before Studio navigation (matches --studio-duration-settle). */
export const STUDIO_SIGNIN_SETTLE_MS = 360;

/** Stagger steps for Welcome peak reveal (ms delays). */
export const STUDIO_WELCOME_STAGGER_MS = [0, 60, 120, 180] as const;

export function studioWelcomeRevealOrder(): readonly string[] {
  return ['greeting', 'venue', 'readiness', 'remembered'] as const;
}
