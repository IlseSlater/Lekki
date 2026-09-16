/**
 * AssetStore — capability boundary for durable venue images.
 * Local disk is v1; R2/S3 swap via DI without touching controllers.
 */

export type AssetKind = 'logo' | 'cover' | 'other';

export type AssetUploadInput = {
  organisationId: string;
  venueId: string;
  kind: AssetKind;
  buffer: Buffer;
  contentType: string;
  originalName?: string;
};

export type AssetUploadResult = {
  url: string;
  storageKey: string;
  byteSize: number;
  contentType: string;
};

export const ASSET_STORE = Symbol('ASSET_STORE');

export interface AssetStore {
  upload(input: AssetUploadInput): Promise<AssetUploadResult>;
  delete?(storageKey: string): Promise<void>;
}

export const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

/** SVG rejected — XSS surface when served as image/html ambiguity. */
export const REJECTED_IMAGE_TYPES = new Set([
  'image/svg+xml',
  'image/svg',
  'text/html',
]);

export function maxBytesForKind(kind: AssetKind): number {
  if (kind === 'logo') return 2 * 1024 * 1024;
  if (kind === 'cover') return 5 * 1024 * 1024;
  return 5 * 1024 * 1024;
}

export function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'bin';
  }
}

/**
 * Venue brand URLs must be https or same-origin /assets paths.
 * data: URIs are rejected so Base64 never becomes source of truth.
 */
export function assertSafeAssetUrl(url: string, field: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  const lower = trimmed.toLowerCase();
  if (lower.startsWith('data:')) {
    throw new Error(`${field} must not be a data URI — upload via /assets`);
  }
  if (trimmed.startsWith('/assets/')) return trimmed;
  if (/^https:\/\//i.test(trimmed)) return trimmed;
  throw new Error(`${field} must be an https or /assets/ URL`);
}

export function parseAssetKind(raw: string | undefined): AssetKind {
  const k = (raw ?? '').trim().toLowerCase();
  if (k === 'logo' || k === 'cover' || k === 'other') return k;
  throw new Error('kind must be logo, cover, or other');
}
