import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  FIRST_IMPRESSION_FORBIDDEN_GLOW,
  isFirstImpressionGlowOnSpec,
} from './first-impression';

const here = dirname(fileURLToPath(import.meta.url));
const homePage = join(here, '../pages/website-home.page.ts');

test('teal/cyan glow signatures are off-spec', () => {
  assert.equal(
    isFirstImpressionGlowOnSpec(
      'radial-gradient(ellipse at 50% 40%, rgba(180, 220, 230, 0.55), transparent 55%)',
    ),
    false,
  );
});

test('dusk + gold lamp is on-spec', () => {
  assert.equal(
    isFirstImpressionGlowOnSpec(
      'radial-gradient(ellipse 72% 58% at 50% 46%, rgba(215, 161, 74, 0.2), transparent 64%), #c2a184',
    ),
    true,
  );
});

test('website-home lk-glow is dusk + gold — not teal', () => {
  const src = readFileSync(homePage, 'utf8');
  const match = src.match(/\.lk-glow\s*\{([\s\S]*?)\n\s*\}/);
  assert.ok(match, 'expected .lk-glow block');
  const block = match[1];
  assert.equal(isFirstImpressionGlowOnSpec(block), true);
  for (const bad of FIRST_IMPRESSION_FORBIDDEN_GLOW) {
    assert.equal(block.includes(bad), false, `forbidden ${bad}`);
  }
});
