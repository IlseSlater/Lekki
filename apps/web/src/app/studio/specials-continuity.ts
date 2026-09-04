/**
 * Specials Continuity — Studio `guestDesign.specials` opens a Guest Specials surface.
 * Carousel = Specials category / special tags · Featured = signature menu (no analytics product).
 */

import { experienceTypeIdForToken } from './experience-registry';
import {
  defaultDesignForType,
  type GuestExperienceDesign,
} from './guest-experience-design';

export type SpecialsContinuityExperience = {
  token: string;
  typeId: string;
  guestDesign?: Partial<GuestExperienceDesign> | null;
};

export type SpecialsCatalogueItem = {
  id: string;
  label: string;
  category: string;
  unitPrice: number;
  description?: string;
  routingTags?: string[];
  imageUrl?: string;
};

/** Studio Specials toggle → Guest may show the Specials tab/page. */
export function resolveShowSpecials(
  token: string | null | undefined,
  experiences: SpecialsContinuityExperience[] = [],
  sessionDesign?: Partial<GuestExperienceDesign> | null,
): boolean {
  if (sessionDesign && typeof sessionDesign.specials === 'boolean') {
    return sessionDesign.specials;
  }
  const t = (token ?? '').trim();
  if (!t) {
    return !!defaultDesignForType('restaurant').specials;
  }

  const match = experiences.find((e) => e.token.trim() === t);
  if (match) {
    const design = match.guestDesign
      ? { ...defaultDesignForType(match.typeId), ...match.guestDesign }
      : defaultDesignForType(match.typeId);
    return !!design.specials;
  }

  const typeId = experienceTypeIdForToken(t) ?? 'restaurant';
  return !!defaultDesignForType(typeId).specials;
}

function isSpecialItem(item: SpecialsCatalogueItem): boolean {
  const cat = (item.category || '').toLowerCase();
  if (cat === 'specials' || cat === 'special' || cat === 'featured') return true;
  const tags = (item.routingTags || []).map((t) => t.toLowerCase());
  return tags.includes('special') || tags.includes('specials') || tags.includes('featured');
}

/** Current specials for the horizontal carousel. */
export function specialsCarouselItems<T extends SpecialsCatalogueItem>(
  catalogue: T[],
  limit = 8,
): T[] {
  return catalogue.filter(isSpecialItem).slice(0, limit);
}

/**
 * “Most ordered / featured” without a BI product — signature food guests can add directly.
 * Prefer imaged mains; exclude carousel specials so the page doesn’t repeat.
 */
export function featuredMenuItems<T extends SpecialsCatalogueItem>(
  catalogue: T[],
  limit = 6,
): T[] {
  const specialIds = new Set(specialsCarouselItems(catalogue, 99).map((i) => i.id));
  const food = catalogue.filter((item) => {
    if (specialIds.has(item.id)) return false;
    if (isSpecialItem(item)) return false;
    const cat = (item.category || '').toLowerCase();
    if (cat.includes('drink') || cat.includes('beverage') || cat.includes('coffee')) {
      return false;
    }
    const tags = (item.routingTags || []).map((t) => t.toLowerCase());
    if (tags.includes('beverage') || tags.includes('drinks')) return false;
    return true;
  });

  const withImage = food.filter((i) => !!(i.imageUrl || '').trim());
  const pool = withImage.length ? withImage : food;
  return [...pool]
    .sort((a, b) => b.unitPrice - a.unitPrice || a.label.localeCompare(b.label))
    .slice(0, limit);
}

/** When Specials page is on, hide Specials rows from the full Menu (one home for them). */
export function menuWithoutSpecialsSurface<T extends SpecialsCatalogueItem>(
  catalogue: T[],
  showSpecialsPage: boolean,
): T[] {
  if (!showSpecialsPage) return catalogue;
  return catalogue.filter((item) => !isSpecialItem(item));
}
