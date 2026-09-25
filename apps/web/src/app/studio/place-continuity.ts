/**
 * Continuity — Kitchen / Waiter / Guest place labels share one spoken form.
 * Never invent a table by hashing fulfilment id against Studio place lists.
 * Open-tab Place Identity: Guest and Live phone must speak the same place line.
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

/** Guest / Live place — empty when no code (header stays quiet). */
export function guestPlaceSpoken(
  placeNoun: string,
  placeCode: string | null | undefined,
): string {
  const code = (placeCode ?? '').trim();
  if (!code) return '';
  return staffPlaceLabel(placeNoun, code);
}

/** Open-tab identity facts — venue + spoken place for shell / Live parity. */
export function openTabIdentity(input: {
  venueName?: string | null;
  placeNoun: string;
  placeCode?: string | null;
}): { venueName: string; placeSpoken: string } {
  return {
    venueName: (input.venueName ?? '').trim(),
    placeSpoken: guestPlaceSpoken(input.placeNoun, input.placeCode),
  };
}

/** Live projection place must equal Guest spoken place (same noun + code). */
export function openTabPlaceParity(
  guestPlaceSpokenLine: string,
  livePlaceSpokenLine: string,
): boolean {
  return guestPlaceSpokenLine.trim() === livePlaceSpokenLine.trim();
}
