/**
 * Menu brand Continuity — Studio half-moon must match Guest menu.
 * Prefer session/venue from Entry; else workspace by entry token.
 */

export type MenuBrandContinuityExperience = {
  token: string;
  menuBrandEnabled?: boolean;
  brandColour?: string;
  logoUrl?: string;
  menuCoverUrl?: string;
};

export type MenuBrandResolved = {
  enabled: boolean;
  brandColour: string;
  logoUrl: string;
  coverUrl: string;
};

const DEFAULT_COLOUR = '#d7a14a';

export function resolveMenuBrand(
  token: string | null | undefined,
  experiences: MenuBrandContinuityExperience[] = [],
  sessionHint?: Partial<MenuBrandResolved> | null,
): MenuBrandResolved {
  const t = (token ?? '').trim();
  const match = t ? experiences.find((e) => (e.token || '').trim() === t) : undefined;

  const enabled = !!(sessionHint?.enabled || match?.menuBrandEnabled);
  if (!enabled) {
    return {
      enabled: false,
      brandColour: sessionHint?.brandColour || match?.brandColour || DEFAULT_COLOUR,
      logoUrl: '',
      coverUrl: '',
    };
  }

  return {
    enabled: true,
    brandColour:
      sessionHint?.brandColour || match?.brandColour || DEFAULT_COLOUR,
    logoUrl: sessionHint?.logoUrl || match?.logoUrl || '',
    coverUrl: sessionHint?.coverUrl || match?.menuCoverUrl || '',
  };
}
