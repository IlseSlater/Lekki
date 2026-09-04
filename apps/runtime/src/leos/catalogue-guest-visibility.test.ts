import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyCatalogueItemChange,
  formatAllergenLine,
  formatDietaryLine,
  guestVisibleCatalogueItems,
} from './catalogue-guest-visibility';

test('Batch 5: 86’d items are hidden from guest browse', () => {
  const rows = [
    { id: '1', label: 'Pasta', available: true },
    { id: '2', label: 'Soup', available: false },
  ];
  assert.deepEqual(
    guestVisibleCatalogueItems(rows).map((r) => r.id),
    ['1'],
  );
});

test('Batch 5: live 86 removes an item without a full reload', () => {
  const rows = [
    { id: '1', label: 'Pasta', available: true },
    { id: '2', label: 'Soup', available: true },
  ];
  const next = applyCatalogueItemChange(rows, {
    id: '2',
    label: 'Soup',
    available: false,
  });
  assert.deepEqual(
    next.map((r) => r.id),
    ['1'],
  );
});

test('Batch 5: allergen line is guest-facing, not admin jargon', () => {
  assert.equal(formatAllergenLine(['gluten', 'dairy']), 'Contains gluten, dairy');
  assert.equal(formatAllergenLine([]), '');
});

test('Batch 5: dietary tags read as hospitality, not CMS chips', () => {
  assert.equal(formatDietaryLine(['vegan', 'vegetarian']), 'vegan · vegetarian');
  assert.equal(formatDietaryLine([]), '');
});
