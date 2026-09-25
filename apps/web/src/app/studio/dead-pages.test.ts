import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

/** GAP-01 — unrouted leftovers. Do not revive as preview / hub / second Go Live. */
const DEAD_STUDIO_PAGES = [
  'studio-live.page.ts',
  'setup-golive.page.ts',
  'setup-hub.page.ts',
  'studio-configure.page.ts',
  'studio-choose.page.ts',
  'setup-organisation.page.ts',
  'setup-integrations.page.ts',
];

test('dead Studio pages stay deleted', () => {
  const dir = join(process.cwd(), 'apps/web/src/app/pages');
  for (const file of DEAD_STUDIO_PAGES) {
    assert.equal(existsSync(join(dir, file)), false, file);
  }
});
