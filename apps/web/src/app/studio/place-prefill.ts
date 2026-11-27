/**
 * Your place — fill what we already know so the owner confirms instead of typing.
 * A true value is never replaced. Registry placeholders count as unknown.
 */

export const DEFAULT_LOCATION = 'Johannesburg';
export const DEFAULT_BRAND_COLOUR = '#d7a14a';

const PLACEHOLDER_NAMES = new Set(['', 'your place', 'clinic café', 'your venue']);

export type PlacePrefillInput = {
  /** What the browser workspace holds now. */
  activeName?: string | null;
  activeLocation?: string | null;
  activeColour?: string | null;
  /** What the server already stores for this venue. */
  serverName?: string | null;
  serverLocation?: string | null;
  serverColour?: string | null;
};

export type PlacePrefill = {
  venueName: string;
  location: string;
  brandColour: string;
  /** Fields we filled so the page can say so. */
  filled: Array<'venueName' | 'location' | 'brandColour'>;
};

function clean(value: string | null | undefined): string {
  return (value ?? '').trim();
}

export function isPlaceholderName(value: string | null | undefined): boolean {
  return PLACEHOLDER_NAMES.has(clean(value).toLowerCase());
}

function isHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function prefillPlace(input: PlacePrefillInput): PlacePrefill {
  const filled: PlacePrefill['filled'] = [];

  let venueName = clean(input.activeName);
  if (isPlaceholderName(venueName)) {
    const server = clean(input.serverName);
    venueName = isPlaceholderName(server) ? '' : server;
    if (venueName) filled.push('venueName');
  }

  let location = clean(input.activeLocation);
  if (!location) {
    location = clean(input.serverLocation) || DEFAULT_LOCATION;
    filled.push('location');
  }

  let brandColour = clean(input.activeColour);
  if (!isHex(brandColour)) {
    const server = clean(input.serverColour);
    brandColour = isHex(server) ? server : DEFAULT_BRAND_COLOUR;
    filled.push('brandColour');
  }

  return { venueName, location, brandColour, filled };
}
