import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCatalogueItemChange,
  formatAllergenLine,
  formatDietaryLine,
  guestVisibleCatalogueItems,
} from './catalogue-guest-visibility';

test('Batch 5 web: 86’d items stay off guest browse', () => {
  assert.deepEqual(
    guestVisibleCatalogueItems([
      { id: '1', available: true },
      { id: '2', available: false },
    ]).map((r) => r.id),
    ['1'],
  );
});

test('Batch 5 web: live CatalogueItemChanged removes 86 without reload', () => {
  const next = applyCatalogueItemChange(
    [
      { id: '1', available: true },
      { id: '2', available: true },
    ],
    { id: '2', available: false },
  );
  assert.deepEqual(
    next.map((r) => r.id),
    ['1'],
  );
});

test('Batch 5 web: allergen + dietary copy is guest-facing', () => {
  assert.equal(formatAllergenLine(['gluten']), 'Contains gluten');
  assert.equal(formatDietaryLine(['vegan', 'GF']), 'vegan · GF');
});
