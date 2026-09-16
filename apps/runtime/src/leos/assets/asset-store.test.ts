import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import {
  assertSafeAssetUrl,
  maxBytesForKind,
  parseAssetKind,
} from './asset-store';
import { LocalDiskAssetStore } from './local-disk-asset-store';

test('assertSafeAssetUrl rejects data URIs', () => {
  assert.throws(
    () => assertSafeAssetUrl('data:image/png;base64,abc', 'logoUrl'),
    /data URI/i,
  );
});

test('assertSafeAssetUrl allows /assets and https', () => {
  assert.equal(assertSafeAssetUrl('/assets/v1/logo.png', 'logoUrl'), '/assets/v1/logo.png');
  assert.equal(
    assertSafeAssetUrl('https://cdn.example/logo.png', 'logoUrl'),
    'https://cdn.example/logo.png',
  );
  assert.equal(assertSafeAssetUrl('  ', 'logoUrl'), '');
});

test('parseAssetKind and size limits', () => {
  assert.equal(parseAssetKind('logo'), 'logo');
  assert.equal(maxBytesForKind('logo'), 2 * 1024 * 1024);
  assert.equal(maxBytesForKind('cover'), 5 * 1024 * 1024);
  assert.throws(() => parseAssetKind('svg'), /kind must be/);
});

test('LocalDiskAssetStore writes file and returns /assets URL', async () => {
  const root = await mkdtemp(join(tmpdir(), 'leos-assets-'));
  try {
    const store = new LocalDiskAssetStore(root, '');
    const buf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const result = await store.upload({
      organisationId: 'org_1',
      venueId: 'ven_demo',
      kind: 'logo',
      buffer: buf,
      contentType: 'image/png',
      originalName: 'mark.png',
    });
    assert.match(result.url, /^\/assets\/ven_demo\/logo-/);
    assert.match(result.storageKey, /^ven_demo\/logo-/);
    const written = await readFile(join(root, result.storageKey));
    assert.equal(written.equals(buf), true);

    await assert.rejects(
      () =>
        store.upload({
          organisationId: 'org_1',
          venueId: 'ven_demo',
          kind: 'logo',
          buffer: buf,
          contentType: 'image/svg+xml',
        }),
      /SVG/i,
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('guestDesign shallow merge keeps unspecified keys', () => {
  const existing = { payAtTable: true, tipStaff: true, specials: false };
  const patch = { tipStaff: false };
  const merged = { ...existing, ...patch };
  assert.equal(merged.payAtTable, true);
  assert.equal(merged.tipStaff, false);
  assert.equal(merged.specials, false);
});
