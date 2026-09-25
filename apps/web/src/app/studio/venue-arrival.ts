import { safeBrandImageUrl } from '../leos/catalogue-parity';

export type VenueArrivalConfig = {
  headline?: string;
  line?: string;
  cta?: string;
  blend?: boolean;
  colourTo?: string;
  marks?: string[];
};

export type VenueArrivalLook = {
  headline: string;
  place: string;
  line: string;
  cta: string;
  background: string;
  ink: string;
  muted: string;
  ctaFill: string;
  ctaInk: string;
  logos: string[];
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isHexColour(v: unknown): v is string {
  return typeof v === 'string' && HEX.test(v.trim());
}

export function arrivalFromGuestDesign(design: unknown): VenueArrivalConfig {
  if (!design || typeof design !== 'object' || Array.isArray(design)) return {};
  const raw = (design as { arrival?: unknown }).arrival;
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const o = raw as {
    headline?: unknown;
    line?: unknown;
    cta?: unknown;
    blend?: unknown;
    colourTo?: unknown;
    marks?: unknown;
  };
  const marks = Array.isArray(o.marks)
    ? o.marks.filter((u): u is string => typeof u === 'string' && !!u.trim()).slice(0, 3)
    : [];
  return {
    headline: typeof o.headline === 'string' ? o.headline.slice(0, 80) : undefined,
    line: typeof o.line === 'string' ? o.line.slice(0, 140) : undefined,
    cta: typeof o.cta === 'string' ? o.cta.slice(0, 32) : undefined,
    blend: o.blend === true,
    colourTo: isHexColour(o.colourTo) ? o.colourTo.trim() : undefined,
    marks,
  };
}

export function withArrival(
  design: Record<string, unknown> | null | undefined,
  arrival: VenueArrivalConfig,
): Record<string, unknown> {
  const base = design && typeof design === 'object' ? { ...design } : {};
  return { ...base, arrival };
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = Number.parseInt(h.slice(0, 2), 16) / 255;
  const g = Number.parseInt(h.slice(2, 4), 16) / 255;
  const b = Number.parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function inkOnWash(hex: string): { ink: string; muted: string; ctaFill: string; ctaInk: string } {
  const light = luminance(hex) > 0.45;
  if (light) {
    return {
      ink: '#1b2230',
      muted: 'rgba(27, 34, 48, 0.72)',
      ctaFill: '#1b2230',
      ctaInk: '#f8f6f2',
    };
  }
  return {
    ink: '#f8f6f2',
    muted: 'rgba(248, 246, 242, 0.78)',
    ctaFill: '#f8f6f2',
    ctaInk: '#1b2230',
  };
}

export function parseVenueArrival(input: {
  venueName?: string;
  location?: string;
  placeSpoken?: string;
  brandColour?: string;
  logoUrl?: string;
  guestDesign?: unknown;
}): VenueArrivalLook {
  const arrival = arrivalFromGuestDesign(input.guestDesign);
  const from = isHexColour(input.brandColour) ? input.brandColour.trim() : '#d7a14a';
  const to = arrival.blend && isHexColour(arrival.colourTo) ? arrival.colourTo : from;
  const name = (input.venueName || '').trim() || 'Welcome';
  const location = (input.location || '').trim();
  const place = (input.placeSpoken || '').trim();
  const custom = (arrival.line || '').trim();
  const line = custom || (location && location.toLowerCase() !== place.toLowerCase() ? location : '');
  const primary = safeBrandImageUrl(input.logoUrl) ?? '';
  const extras = (arrival.marks ?? [])
    .map((u) => safeBrandImageUrl(u) ?? '')
    .filter((u) => u && u !== primary);
  const logos = [primary, ...extras].filter(Boolean).slice(0, 4);
  const tone = inkOnWash(from);
  return {
    headline: (arrival.headline || '').trim() || name,
    place,
    line,
    cta: (arrival.cta || '').trim() || 'Get started',
    background:
      arrival.blend && to.toLowerCase() !== from.toLowerCase()
        ? `linear-gradient(165deg, ${from} 0%, ${to} 100%)`
        : from,
    logos,
    ...tone,
  };
}
