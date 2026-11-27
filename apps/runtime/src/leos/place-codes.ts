/** Place codes an owner asked for — cleaned once, before anything is written. */

export const MAX_PLACES_PER_VENUE = 200;
export const MAX_PLACE_CODE_LENGTH = 40;

export function normalisePlaceCodes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const entry of raw) {
    if (typeof entry !== 'string') continue;
    const code = entry.replace(/\s+/g, ' ').trim().slice(0, MAX_PLACE_CODE_LENGTH);
    if (!code) continue;
    const key = code.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(code);
    if (out.length >= MAX_PLACES_PER_VENUE) break;
  }
  return out;
}

/** Codes not yet stored for a venue (case-insensitive). */
export function missingPlaceCodes(wanted: string[], existing: string[]): string[] {
  const have = new Set(existing.map((c) => c.toLowerCase()));
  return wanted.filter((c) => !have.has(c.toLowerCase()));
}
