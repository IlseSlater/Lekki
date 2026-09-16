import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveCatalogueLock } from './catalogue-lock';
import {
  DEFAULT_GUEST_DESIGN,
  formatCataloguePriceMajor,
  formatCataloguePriceMinor,
  resolveProjectionItems,
} from './guest-experience-design';

test('zero unit price is Free, never R0.00', () => {
  assert.equal(formatCataloguePriceMajor(0), 'Free');
  assert.equal(formatCataloguePriceMinor(0), 'Free');
  assert.equal(formatCataloguePriceMajor(140), 'R140');
});

test('fail closed: unknown slug, golive, live, and payments stay locked', () => {
  for (const slug of ['golive', 'identity', 'places', 'payments', 'live', '']) {
    const r = resolveCatalogueLock({ live: false, slug });
    if (slug === 'experience') continue;
    assert.equal(r.lockCatalogue, true, slug);
    assert.equal(r.allowExampleCatalogue, false, slug);
  }
  const liveExp = resolveCatalogueLock({ live: true, slug: 'experience' });
  assert.equal(liveExp.lockCatalogue, true);
  assert.equal(liveExp.allowExampleCatalogue, false);
});

test('only pre-live Experience may opt into examples', () => {
  const r = resolveCatalogueLock({ live: false, slug: 'experience' });
  assert.equal(r.lockCatalogue, false);
  assert.equal(r.allowExampleCatalogue, true);
});

test('locked projection never reads Craft Lager / Classic Burger', () => {
  const { items, example } = resolveProjectionItems({
    lockCatalogue: true,
    venueCatalogue: [],
    design: DEFAULT_GUEST_DESIGN,
    typeId: 'restaurant',
  });
  assert.equal(example, false);
  assert.equal(items.length, 0);
  const dumped = JSON.stringify(items);
  assert.equal(dumped.includes('Classic Burger'), false);
  assert.equal(dumped.includes('Craft Lager'), false);
});

test('unlocked without allowExample still has no samples', () => {
  const { items, example } = resolveProjectionItems({
    lockCatalogue: false,
    allowExampleCatalogue: false,
    venueCatalogue: null,
    design: DEFAULT_GUEST_DESIGN,
    typeId: 'restaurant',
  });
  assert.equal(example, false);
  assert.equal(items.length, 0);
});

test('example opt-in uses projection samples and marks them', () => {
  const { items, example } = resolveProjectionItems({
    lockCatalogue: false,
    allowExampleCatalogue: true,
    venueCatalogue: null,
    design: DEFAULT_GUEST_DESIGN,
    typeId: 'restaurant',
  });
  assert.equal(example, true);
  assert.ok(items.some((i) => i.label === 'Craft Lager'));
});

test('venue catalogue wins over samples even when examples allowed', () => {
  const { items, example } = resolveProjectionItems({
    lockCatalogue: false,
    allowExampleCatalogue: true,
    venueCatalogue: [{ id: '1', label: 'Chef’s Bowl', category: 'Food', price: 'R140' }],
    design: DEFAULT_GUEST_DESIGN,
    typeId: 'restaurant',
  });
  assert.equal(example, false);
  assert.equal(items[0]?.label, 'Chef’s Bowl');
});
