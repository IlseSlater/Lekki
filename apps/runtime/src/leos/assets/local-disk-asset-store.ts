import { mkdir, unlink, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { newId } from '@lekki/shared';
import {
  ALLOWED_IMAGE_TYPES,
  REJECTED_IMAGE_TYPES,
  extensionForContentType,
  maxBytesForKind,
  type AssetStore,
  type AssetUploadInput,
  type AssetUploadResult,
} from './asset-store';

function resolveAssetRoot(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.LEOS_ASSET_ROOT?.trim();
  if (configured) return resolve(configured);
  return resolve(process.cwd(), '.data', 'assets');
}

/**
 * Public base for asset URLs (no trailing slash).
 * Empty → relative /assets/... paths (works when web proxies runtime).
 */
function publicAssetBase(env: NodeJS.ProcessEnv = process.env): string {
  return (env.PUBLIC_ASSET_BASE_URL ?? '').trim().replace(/\/$/, '');
}

export class LocalDiskAssetStore implements AssetStore {
  constructor(
    private readonly root = resolveAssetRoot(),
    private readonly publicBase = publicAssetBase(),
  ) {}

  async upload(input: AssetUploadInput): Promise<AssetUploadResult> {
    const contentType = input.contentType.trim().toLowerCase();
    if (REJECTED_IMAGE_TYPES.has(contentType) || contentType.includes('svg')) {
      throw new Error('SVG and HTML uploads are not allowed');
    }
    if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
      throw new Error('Only JPEG, PNG, WebP, or GIF images are allowed');
    }
    const max = maxBytesForKind(input.kind);
    if (!input.buffer?.length) throw new Error('Empty file');
    if (input.buffer.length > max) {
      throw new Error(`File exceeds ${Math.floor(max / (1024 * 1024))}MB limit`);
    }

    const venueId = input.venueId.trim();
    if (!venueId || venueId.includes('..') || venueId.includes('/') || venueId.includes('\\')) {
      throw new Error('Invalid venueId');
    }

    const filename = `${input.kind}-${newId('ast')}.${extensionForContentType(contentType)}`;
    const storageKey = `${venueId}/${filename}`;
    const absPath = join(this.root, storageKey);
    await mkdir(dirname(absPath), { recursive: true });
    await writeFile(absPath, input.buffer);

    const pathUrl = `/assets/${storageKey.replace(/\\/g, '/')}`;
    const url = this.publicBase ? `${this.publicBase}${pathUrl}` : pathUrl;

    return {
      url,
      storageKey,
      byteSize: input.buffer.length,
      contentType,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const key = storageKey.trim().replace(/\\/g, '/');
    if (!key || key.includes('..') || key.startsWith('/')) {
      throw new Error('Invalid storageKey');
    }
    const absPath = join(this.root, key);
    try {
      await unlink(absPath);
    } catch (err) {
      const code = (err as NodeJS.ErrnoException)?.code;
      if (code !== 'ENOENT') throw err;
    }
  }
}

export function getAssetRoot(): string {
  return resolveAssetRoot();
}
