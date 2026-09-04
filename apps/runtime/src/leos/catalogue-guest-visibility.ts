/**
 * Guest-facing catalogue rules — pure, no Nest / Angular.
 * 86'd items (available === false) never appear on browse.
 */

export type GuestCatalogueRow = {
  id: string;
  label: string;
  available?: boolean;
  allergens?: string[];
  dietaryTags?: string[];
  ageRestricted?: boolean;
};

export function guestVisibleCatalogueItems<T extends GuestCatalogueRow>(
  rows: T[],
): T[] {
  return rows.filter((r) => r.available !== false);
}

export function applyCatalogueItemChange<T extends GuestCatalogueRow>(
  rows: T[],
  change: T & { available?: boolean },
): T[] {
  const without = rows.filter((r) => r.id !== change.id);
  if (change.available === false) return without;
  return [...without, change];
}

export function formatAllergenLine(allergens: string[] | undefined): string {
  const list = (allergens ?? []).map((a) => a.trim()).filter(Boolean);
  if (!list.length) return '';
  return `Contains ${list.join(', ')}`;
}

export function formatDietaryLine(tags: string[] | undefined): string {
  const list = (tags ?? []).map((t) => t.trim()).filter(Boolean);
  if (!list.length) return '';
  return list.join(' · ');
}
