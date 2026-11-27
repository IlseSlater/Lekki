import type { SetupStepSlug } from './experience-registry';

/**
 * Setup is a guided first pass over the everyday Studio pages — pure, no Angular.
 * Each step slug (kept for readiness) is one of those pages.
 */
export const EVERYDAY_PATH_FOR_STEP: Record<SetupStepSlug, string | null> = {
  identity: '/studio/place',
  experience: '/studio/menu',
  places: '/studio/tables',
  payments: '/studio/payments',
  // Go live stays: after go-live it is where the QR codes are printed.
  golive: null,
};

/** Where a /studio/setup/... URL belongs once the place is live (null: stay). */
export function everydayPathForSetupUrl(url: string): string | null {
  const path = url.split(/[?#]/)[0];
  if (/^\/studio\/setup\/payments\/connect\/?$/.test(path)) return '/studio/payments/connect';
  const m = /^\/studio\/setup\/([^/]+)\/?$/.exec(path);
  if (!m) return null;
  const slug = m[1] as SetupStepSlug;
  return slug in EVERYDAY_PATH_FOR_STEP ? EVERYDAY_PATH_FOR_STEP[slug] : null;
}
