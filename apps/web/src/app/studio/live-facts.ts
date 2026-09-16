/**
 * One resolver for Go Live + Live Experience.
 * Session is source of record. Workspace is optimistic only — never resolved:true.
 * No registry defaults. No name-shaped placeholders.
 *
 * Catalogue: at least one priced item (priceMinor > 0) is required to resolve.
 * Free items may sit beside priced ones; a zero-only list is missing.
 */

export type LiveFactsInput = {
  /** Server truth for the minted token. Absent until it loads. */
  session: {
    venueName?: string | null;
    placeCode?: string | null;
    catalogue?: Array<{ label: string; priceMinor: number }> | null;
  } | null;
  /** Studio's local workspace copy. Never a source of record. */
  workspace: {
    venueName?: string | null;
    placeCode?: string | null;
    placeCodes?: string[] | null;
  } | null;
};

export type LiveFactsField = 'venueName' | 'placeCode' | 'catalogue';

export type LiveFacts = {
  venueName: string;
  placeCode: string;
  catalogue: Array<{ label: string; priceMinor: number }>;
};

export type LiveFactsResult =
  | { resolved: true; facts: LiveFacts; source: 'session' }
  | { resolved: false; missing: LiveFactsField[]; partial: Partial<LiveFacts> };

function trim(value?: string | null): string {
  return (value ?? '').trim();
}

function sessionCatalogue(
  items: Array<{ label: string; priceMinor: number }> | null | undefined,
): Array<{ label: string; priceMinor: number }> | null {
  if (!items || items.length === 0) return null;
  if (!items.some((item) => item.priceMinor > 0)) return null;
  return items;
}

export function resolveLiveFacts(input: LiveFactsInput): LiveFactsResult {
  const sessionVenue = trim(input.session?.venueName);
  const sessionPlace = trim(input.session?.placeCode);
  const sessionCat = sessionCatalogue(input.session?.catalogue);

  const workspaceVenue = trim(input.workspace?.venueName);
  const workspacePlace = trim(input.workspace?.placeCode) || trim(input.workspace?.placeCodes?.[0]);

  const missing: LiveFactsField[] = [];
  const partial: Partial<LiveFacts> = {};

  if (sessionVenue) {
    partial.venueName = sessionVenue;
  } else {
    missing.push('venueName');
    if (workspaceVenue) partial.venueName = workspaceVenue;
  }

  if (sessionPlace) {
    partial.placeCode = sessionPlace;
  } else {
    missing.push('placeCode');
    if (workspacePlace) partial.placeCode = workspacePlace;
  }

  if (sessionCat) {
    partial.catalogue = sessionCat;
  } else {
    missing.push('catalogue');
  }

  if (sessionVenue && sessionPlace && sessionCat && missing.length === 0) {
    return {
      resolved: true,
      facts: {
        venueName: sessionVenue,
        placeCode: sessionPlace,
        catalogue: sessionCat,
      },
      source: 'session',
    };
  }

  return { resolved: false, missing, partial };
}

/** Bar 4b: character-identical only when both sides resolved. Unresolved is 4c. */
export function bar4bDeskPublicParity(
  desk: { resolved: boolean; venueName?: string; placeCode?: string; firstCatalogueLine?: string },
  pub: { resolved: boolean; venueName?: string; placeCode?: string; firstCatalogueLine?: string },
): { id: '4b' | '4c'; pass: boolean } {
  if (!desk.resolved || !pub.resolved) return { id: '4c', pass: false };
  const pass =
    !!desk.firstCatalogueLine &&
    desk.venueName === pub.venueName &&
    desk.placeCode === pub.placeCode &&
    desk.firstCatalogueLine === pub.firstCatalogueLine;
  return { id: '4b', pass };
}

/** One join, one separator, one order — used by the card and the phone. */
export function spokenPlaceLine(facts: Pick<LiveFacts, 'venueName' | 'placeCode'>): string {
  const venue = trim(facts.venueName);
  const place = trim(facts.placeCode);
  if (venue && place) return `${venue} · ${place}`;
  return venue || place;
}

export function missingFactCopy(field: LiveFactsField): string {
  switch (field) {
    case 'venueName':
      return 'No venue name yet · Add it in Your venue';
    case 'placeCode':
      return 'No place yet · Add it in Where guests join';
    case 'catalogue':
      return 'No priced menu yet · Add an item guests can order';
  }
}
