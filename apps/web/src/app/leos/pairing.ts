/**
 * One related add on the dish sheet. Not a tray of offers.
 * The suggestion is something from a different part of the menu (a drink for a dish, a side for a drink),
 * available today, not already in the cart, and the least expensive of those so it never feels like a push.
 */
export interface PairableItem {
  id: string;
  label: string;
  category: string;
  unitPrice: number;
  routingTags: string[];
  available?: boolean;
  ageRestricted?: boolean;
  /** Dishes with required choices need their own sheet, so they are not offered as a quick add. */
  needsChoices?: boolean;
}

function sameTags(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const set = new Set(a);
  return b.every((tag) => set.has(tag));
}

export function suggestPairing(
  item: PairableItem,
  catalogue: readonly PairableItem[],
  inCartIds: readonly string[],
): PairableItem | null {
  const inCart = new Set(inCartIds);
  const candidates = catalogue.filter(
    (other) =>
      other.id !== item.id &&
      other.available !== false &&
      !other.ageRestricted &&
      !other.needsChoices &&
      other.unitPrice > 0 &&
      !inCart.has(other.id) &&
      other.category !== item.category &&
      !sameTags(other.routingTags, item.routingTags),
  );
  if (!candidates.length) return null;
  return [...candidates].sort(
    (a, b) => a.unitPrice - b.unitPrice || a.label.localeCompare(b.label),
  )[0];
}
