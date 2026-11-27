import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestPairing, type PairableItem } from './pairing';

const burger: PairableItem = {
  id: 'burger',
  label: 'Classic Burger',
  category: 'Food',
  unitPrice: 120,
  routingTags: ['hot'],
};
const cola: PairableItem = { id: 'cola', label: 'Cola', category: 'Drinks', unitPrice: 30, routingTags: ['cold'] };
const water: PairableItem = { id: 'water', label: 'Water', category: 'Drinks', unitPrice: 20, routingTags: ['cold'] };
const wine: PairableItem = { id: 'wine', label: 'Wine', category: 'Drinks', unitPrice: 95, routingTags: ['cold'], ageRestricted: true };
const fries: PairableItem = { id: 'fries', label: 'Fries', category: 'Food', unitPrice: 40, routingTags: ['hot'] };

test('a dish gets the least expensive drink, one only', () => {
  const pick = suggestPairing(burger, [burger, cola, water, wine, fries], []);
  assert.equal(pick?.id, 'water');
});

test('items already in the cart are not offered again', () => {
  const pick = suggestPairing(burger, [burger, cola, water], ['water']);
  assert.equal(pick?.id, 'cola');
});

test('sold-out, age-restricted, and choice-heavy items are skipped', () => {
  const soldOut = { ...water, available: false };
  const complex = { ...cola, needsChoices: true };
  assert.equal(suggestPairing(burger, [burger, soldOut, complex, wine], []), null);
});

test('same category and same routing are not a pairing', () => {
  assert.equal(suggestPairing(burger, [burger, fries], []), null);
});

test('nothing is offered when the menu has nothing complementary', () => {
  assert.equal(suggestPairing(burger, [burger], []), null);
});
