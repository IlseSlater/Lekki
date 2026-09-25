/**
 * Continuity — First-impression craft.
 * Landing hero light must be dusk + gold from the mark — never teal/cyan SaaS glow.
 */

/** Forbidden marketing glow signatures (teal/cyan nebula). */
export const FIRST_IMPRESSION_FORBIDDEN_GLOW = [
  'rgba(180, 220, 230',
  'rgba(90, 140, 160',
  '#1a2830',
] as const;

/** Required gold lamp signature on marketing glow. */
export const FIRST_IMPRESSION_GOLD_LAMP = 'rgba(215, 161, 74' as const;

/** True when a CSS background string is first-impression on-spec. */
export function isFirstImpressionGlowOnSpec(cssBackground: string): boolean {
  const bg = (cssBackground || '').toLowerCase();
  if (!bg.includes(FIRST_IMPRESSION_GOLD_LAMP.toLowerCase())) return false;
  return !FIRST_IMPRESSION_FORBIDDEN_GLOW.some((bad) => bg.includes(bad.toLowerCase()));
}
