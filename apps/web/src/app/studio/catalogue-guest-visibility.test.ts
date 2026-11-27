import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCatalogueItemChange,
  formatAllergenLine,
  formatDietaryLine,
  guestVisibleCatalogueItems,
  orderableCatalogueItems,
} from './catalogue-guest-visibility';

test('86’d items stay on the guest menu so it still looks right', () => {
  assert.deepEqual(
    guestVisibleCatalogueItems([
      { id: '1', available: true },
      { id: '2', available: false },
    ]).map((r) => r.id),
    ['1', '2'],
  );
});

test('only available dishes can be ordered', () => {
  assert.deepEqual(
    orderableCatalogueItems([
      { id: '1', available: true },
      { id: '2', available: false },
      { id: '3' },
    ]).map((r) => r.id),
    ['1', '3'],
  );
});

test('live CatalogueItemChanged marks a dish sold out without reload', () => {
  const next = applyCatalogueItemChange(
    [
      { id: '1', available: true },
      { id: '2', available: true },
    ],
    { id: '2', available: false },
  );
  assert.deepEqual(
    next.map((r) => [r.id, r.available]),
    [
      ['1', true],
      ['2', false],
    ],
  );
});

test('Batch 5 web: allergen + dietary copy is guest-facing', () => {
  assert.equal(formatAllergenLine(['gluten']), 'Contains gluten');
  assert.equal(formatDietaryLine(['vegan', 'GF']), 'vegan · GF');
});
