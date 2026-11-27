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

/**
 * Azure Blob AssetStore — durable venue images for Container Apps.
 * Uses the Blob REST API with a connection string (no SDK required at compile time
 * when AZURE_STORAGE_CONNECTION_STRING is unset — LocalDisk is the default).
 *
 * Env:
 * - AZURE_STORAGE_CONNECTION_STRING
 * - AZURE_STORAGE_CONTAINER (default: lekki-assets)
 * - PUBLIC_ASSET_BASE_URL (optional CDN / public container URL prefix)
 */
export class AzureBlobAssetStore implements AssetStore {
  constructor(
    private readonly connectionString = (process.env.AZURE_STORAGE_CONNECTION_STRING ?? '').trim(),
    private readonly container = (process.env.AZURE_STORAGE_CONTAINER ?? 'lekki-assets').trim(),
    private readonly publicBase = (process.env.PUBLIC_ASSET_BASE_URL ?? '').trim().replace(/\/$/, ''),
  ) {
    if (!this.connectionString) {
      throw new Error('AZURE_STORAGE_CONNECTION_STRING is required for AzureBlobAssetStore');
    }
  }

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

    const { accountName, accountKey, blobEndpoint } = parseConnectionString(this.connectionString);
    await putBlockBlob({
      accountName,
      accountKey,
      blobEndpoint,
      container: this.container,
      blobName: storageKey,
      body: input.buffer,
      contentType,
    });

    const pathUrl = `${blobEndpoint}/${this.container}/${storageKey}`;
    const url = this.publicBase ? `${this.publicBase}/${storageKey}` : pathUrl;

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
    const { accountName, accountKey, blobEndpoint } = parseConnectionString(this.connectionString);
    await deleteBlob({
      accountName,
      accountKey,
      blobEndpoint,
      container: this.container,
      blobName: key,
    });
  }
}

function parseConnectionString(cs: string): {
  accountName: string;
  accountKey: string;
  blobEndpoint: string;
} {
  const parts = Object.fromEntries(
    cs
      .split(';')
      .map((p) => p.trim())
      .filter(Boolean)
      .map((p) => {
        const i = p.indexOf('=');
        return i < 0 ? [p, ''] : [p.slice(0, i), p.slice(i + 1)];
      }),
  ) as Record<string, string>;
  const accountName = parts['AccountName'] ?? '';
  const accountKey = parts['AccountKey'] ?? '';
  const blobEndpoint =
    (parts['BlobEndpoint'] ?? '').replace(/\/$/, '') ||
    (accountName ? `https://${accountName}.blob.core.windows.net` : '');
  if (!accountName || !accountKey || !blobEndpoint) {
    throw new Error('Invalid AZURE_STORAGE_CONNECTION_STRING');
  }
  return { accountName, accountKey, blobEndpoint };
}

async function putBlockBlob(input: {
  accountName: string;
  accountKey: string;
  blobEndpoint: string;
  container: string;
  blobName: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const url = `${input.blobEndpoint}/${input.container}/${input.blobName}`;
  const headers = await signedHeaders({
    method: 'PUT',
    accountName: input.accountName,
    accountKey: input.accountKey,
    url,
    contentLength: input.body.length,
    contentType: input.contentType,
    xMsBlobType: 'BlockBlob',
  });
  const res = await fetch(url, { method: 'PUT', headers, body: input.body });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Azure Blob upload failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function deleteBlob(input: {
  accountName: string;
  accountKey: string;
  blobEndpoint: string;
  container: string;
  blobName: string;
}): Promise<void> {
  const url = `${input.blobEndpoint}/${input.container}/${input.blobName}`;
  const headers = await signedHeaders({
    method: 'DELETE',
    accountName: input.accountName,
    accountKey: input.accountKey,
    url,
    contentLength: 0,
  });
  const res = await fetch(url, { method: 'DELETE', headers });
  if (!res.ok && res.status !== 404) {
    const text = await res.text().catch(() => '');
    throw new Error(`Azure Blob delete failed (${res.status}): ${text.slice(0, 200)}`);
  }
}

async function signedHeaders(input: {
  method: string;
  accountName: string;
  accountKey: string;
  url: string;
  contentLength: number;
  contentType?: string;
  xMsBlobType?: string;
}): Promise<Record<string, string>> {
  const { createHmac } = await import('node:crypto');
  const date = new Date().toUTCString();
  const u = new URL(input.url);
  const path = u.pathname; // /container/blob
  const contentType = input.contentType ?? '';
  const headers: Record<string, string> = {
    'x-ms-date': date,
    'x-ms-version': '2021-08-06',
    'Content-Length': String(input.contentLength),
  };
  if (contentType) headers['Content-Type'] = contentType;
  if (input.xMsBlobType) headers['x-ms-blob-type'] = input.xMsBlobType;

  const canonicalHeaders = Object.keys(headers)
    .filter((k) => k.startsWith('x-ms-'))
    .sort()
    .map((k) => `${k}:${headers[k]}`)
    .join('\n');

  const canonicalResource = `/${input.accountName}${path}`;
  const stringToSign = [
    input.method,
    '', // Content-Encoding
    '', // Content-Language
    input.contentLength ? String(input.contentLength) : '',
    '', // Content-MD5
    contentType,
    '', // Date (using x-ms-date)
    '', // If-Modified-Since
    '', // If-Match
    '', // If-None-Match
    '', // If-Unmodified-Since
    '', // Range
    canonicalHeaders,
    canonicalResource,
  ].join('\n');

  const key = Buffer.from(input.accountKey, 'base64');
  const sig = createHmac('sha256', key).update(stringToSign, 'utf8').digest('base64');
  headers['Authorization'] = `SharedKey ${input.accountName}:${sig}`;
  return headers;
}
