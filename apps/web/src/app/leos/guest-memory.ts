/**
 * What this phone remembers about the guest, with their say-so:
 * a name (already kept), allergies, and what they had last time at a place.
 */
export interface GuestMemory {
  allergies: string;
  lastVenueLabel: string;
  lastOrder: string[];
}

export const NO_MEMORY: GuestMemory = { allergies: '', lastVenueLabel: '', lastOrder: [] };

const MAX_ALLERGY_LENGTH = 80;
const MAX_REMEMBERED = 3;

export function readMemory(raw: unknown): GuestMemory {
  if (!raw || typeof raw !== 'object') return NO_MEMORY;
  const r = raw as Record<string, unknown>;
  return {
    allergies: cleanAllergies(r['allergies']),
    lastVenueLabel: typeof r['lastVenueLabel'] === 'string' ? r['lastVenueLabel'].trim() : '',
    lastOrder: Array.isArray(r['lastOrder'])
      ? r['lastOrder']
          .filter((x): x is string => typeof x === 'string' && !!x.trim())
          .slice(0, MAX_REMEMBERED)
      : [],
  };
}

/** One short line, tidy commas, no markup. */
export function cleanAllergies(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/[<>]/g, '')
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ')
    .slice(0, MAX_ALLERGY_LENGTH);
}

/** The dishes worth remembering: the first few different ones from the visit. */
export function rememberedDishes(lines: ReadonlyArray<{ label: string }>): string[] {
  const out: string[] = [];
  for (const l of lines) {
    const label = l.label.trim();
    if (label && !out.includes(label)) out.push(label);
    if (out.length >= MAX_REMEMBERED) break;
  }
  return out;
}

/** "Last time: Burger, Flat white" — only at the place they had it. */
export function lastTimeLine(memory: GuestMemory, venueLabel: string): string {
  if (!memory.lastOrder.length) return '';
  const here = venueLabel.trim().toLowerCase();
  if (!here || memory.lastVenueLabel.trim().toLowerCase() !== here) return '';
  return `Last time: ${memory.lastOrder.join(', ')}`;
}

/** The kitchen reads allergies on every line without the guest repeating them. */
export function notesWithAllergies(note: string | undefined, allergies: string): string | undefined {
  const own = (note ?? '').trim();
  const al = cleanAllergies(allergies);
  if (!al) return own || undefined;
  const tag = `Allergies: ${al}`;
  if (own.toLowerCase().includes(tag.toLowerCase())) return own;
  return own ? `${own} · ${tag}` : tag;
}
