/**
 * Messages between Studio and its preview phone (same origin only).
 *
 * Studio → phone: { type: 'lekki-preview', screen?, venue?, refresh? }
 * Phone → Studio: { type: 'lekki-preview-ready' } once it can take messages.
 */

/** Window event: the guest's venue / table details changed (the top bar re-reads them). */
export const GUEST_STATE_CHANGED = 'leos-guest-state';

export const PREVIEW_SCREENS =['arrive', 'menu', 'bill', 'pay', 'help', 'done'] as const;
export type PreviewScreen = (typeof PREVIEW_SCREENS)[number];

export const PREVIEW_SCREEN_LABELS: Record<PreviewScreen, string> = {
  arrive: 'Arrive',
  menu: 'Menu',
  bill: 'Table',
  pay: 'Pay',
  help: 'Help',
  done: 'After paying',
};

/** What Studio knows about the venue while it is being edited. */
export type PreviewVenueSnapshot = {
  venueName?: string;
  brandColour?: string;
  logoUrl?: string;
  location?: string;
  guestDesign?: Record<string, unknown> | null;
  paymentsActive?: boolean;
  placeCode?: string;
};

export type PreviewMessage = {
  type: 'lekki-preview';
  screen?: PreviewScreen;
  venue?: PreviewVenueSnapshot;
  refresh?: boolean;
};

export function normalisePreviewScreen(raw: unknown): PreviewScreen {
  const s = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
  return (PREVIEW_SCREENS as readonly string[]).includes(s) ? (s as PreviewScreen) : 'arrive';
}

export function isPreviewMessage(data: unknown): data is PreviewMessage {
  return !!data && typeof data === 'object' && (data as { type?: unknown }).type === 'lekki-preview';
}

/** Which guest screen a Studio page is about. */
export function screenForStudioUrl(url: string): PreviewScreen {
  const path = url.split(/[?#]/)[0];
  if (/\/studio\/(menu|setup\/experience|create)/.test(path)) return 'menu';
  if (/\/studio\/(at-the-table)/.test(path)) return 'bill';
  if (/\/studio\/(payments|setup\/payments)/.test(path)) return 'pay';
  return 'arrive';
}

export function previewUrl(opts: {
  venueId: string;
  screen: PreviewScreen;
  placeCode?: string;
  /** For "Open on my phone": the phone isn't signed in, so it carries what guests see. */
  snapshot?: PreviewVenueSnapshot;
}): string {
  const params = new URLSearchParams({ venue: opts.venueId, screen: opts.screen });
  if (opts.placeCode) params.set('table', opts.placeCode);
  if (opts.snapshot) params.set('v', encodePreviewSnapshot(opts.snapshot));
  return `/preview?${params.toString()}`;
}

const MAX_SNAPSHOT_CHARS = 8000;

function toBase64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(raw: string): string {
  const b64 = raw.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodePreviewSnapshot(snap: PreviewVenueSnapshot): string {
  return toBase64Url(JSON.stringify(snap));
}

/** Read a snapshot from a link — only known fields, only the right types. */
export function decodePreviewSnapshot(raw: string | null | undefined): PreviewVenueSnapshot | null {
  if (!raw || raw.length > MAX_SNAPSHOT_CHARS) return null;
  let data: unknown;
  try {
    data = JSON.parse(fromBase64Url(raw));
  } catch {
    return null;
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const d = data as Record<string, unknown>;
  const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : undefined);
  const out: PreviewVenueSnapshot = {};
  const venueName = text(d['venueName']);
  if (venueName !== undefined) out.venueName = venueName;
  const colour = text(d['brandColour'], 16);
  if (colour && /^#[0-9a-f]{3,8}$/i.test(colour)) out.brandColour = colour;
  const logo = text(d['logoUrl'], 500);
  if (logo !== undefined && (logo === '' || /^(https:\/\/|\/assets\/)/.test(logo))) out.logoUrl = logo;
  const location = text(d['location']);
  if (location !== undefined) out.location = location;
  const place = text(d['placeCode'], 40);
  if (place) out.placeCode = place;
  if (typeof d['paymentsActive'] === 'boolean') out.paymentsActive = d['paymentsActive'];
  const design = d['guestDesign'];
  if (design && typeof design === 'object' && !Array.isArray(design)) {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(design as Record<string, unknown>)) {
      if (!/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(k)) continue;
      if (typeof v === 'boolean') clean[k] = v;
      else if (typeof v === 'string' && v.length <= 500) clean[k] = v;
    }
    out.guestDesign = clean;
  }
  return out;
}
