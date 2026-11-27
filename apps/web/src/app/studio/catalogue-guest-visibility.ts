/**
 * Guest catalogue visibility — mirrors runtime catalogue-guest-visibility.
 */

/**
 * Sold-out dishes stay on the guest menu, dimmed, "Sold out today". Hiding them makes the menu look wrong.
 * The menu card blocks adding them; carousels list only what can be ordered.
 */
export function guestVisibleCatalogueItems<T extends { available?: boolean }>(
  rows: T[],
): T[] {
  return rows;
}

export function applyCatalogueItemChange<
  T extends { id: string; available?: boolean },
>(rows: T[], change: T): T[] {
  const without = rows.filter((r) => r.id !== change.id);
  return [...without, change];
}

/** Dishes a guest can order right now. */
export function orderableCatalogueItems<T extends { available?: boolean }>(rows: T[]): T[] {
  return rows.filter((r) => r.available !== false);
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
