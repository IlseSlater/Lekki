/**
 * CORS allowlist from WEB_ORIGIN (comma-separated). Never reflect arbitrary origins.
 */

export function resolveCorsOrigins(env: {
  WEB_ORIGIN?: string;
  NODE_ENV?: string;
}): string[] {
  const raw = env.WEB_ORIGIN?.trim() ?? '';
  const origins = raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    if (env.NODE_ENV === 'production') {
      throw new Error(
        'WEB_ORIGIN must list at least one allowed origin in production',
      );
    }
    return ['http://localhost:4200'];
  }
  return origins;
}

/** True when the request Origin is on the allowlist (or no Origin header). */
export function isOriginAllowed(
  origin: string | undefined,
  allowlist: string[],
): boolean {
  if (!origin) return true;
  return allowlist.includes(origin);
}
