import { starterCatalogue, type StarterCatalogItem } from '@lekki/pack-restaurant';

/**
 * A venue with no menu starts from a short, priced list it can correct.
 * A venue that already has a dish is never touched.
 */
export function planStarterMenu(
  existingCount: number,
  typeId?: string | null,
): StarterCatalogItem[] {
  if (existingCount > 0) return [];
  return starterCatalogue(typeId);
}
