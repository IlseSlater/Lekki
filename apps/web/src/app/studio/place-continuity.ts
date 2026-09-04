/**
 * Continuity — Kitchen / Waiter / Guest place labels share one spoken form.
 * Never invent a table by hashing fulfilment id against Studio place lists.
 */

export function staffPlaceLabel(
  placeNoun: string,
  placeCode: string | null | undefined,
): string {
  const noun = (placeNoun || 'Place').trim() || 'Place';
  const code = (placeCode ?? '').trim();
  if (!code) return noun;
  // Avoid "Table Table 1" if code already carries the noun.
  const lower = code.toLowerCase();
  const nounLower = noun.toLowerCase();
  if (lower.startsWith(nounLower)) return code;
  return `${noun} ${code}`;
}

/** Guest hero place — empty when no code (header stays quiet). */
export function guestPlaceSpoken(
  placeNoun: string,
  placeCode: string | null | undefined,
): string {
  const code = (placeCode ?? '').trim();
  if (!code) return '';
  return staffPlaceLabel(placeNoun, code);
}
