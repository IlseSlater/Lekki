/**
 * Guest catalogue visibility — mirrors runtime catalogue-guest-visibility.
 */

export function guestVisibleCatalogueItems<T extends { available?: boolean }>(
  rows: T[],
): T[] {
  return rows.filter((r) => r.available !== false);
}

export function applyCatalogueItemChange<
  T extends { id: string; available?: boolean },
>(rows: T[], change: T): T[] {
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
