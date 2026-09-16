import assert from 'node:assert/strict';
import test from 'node:test';
import { parseMenuList } from './menu-list-import';

test('imports name, price, category and skips the header', () => {
  const rows = parseMenuList('Name,Price,Category\nCraft Lager,45,Drinks\nGarden Salad,0,Food');
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { label: 'Craft Lager', unitPrice: 45, category: 'Drinks' });
  assert.equal(rows[1].unitPrice, 0);
});

test('empty file is not a sample menu', () => {
  assert.deepEqual(parseMenuList(''), []);
  assert.deepEqual(parseMenuList('   \n  '), []);
});

test('accepts R-prefixed prices and tabs', () => {
  const rows = parseMenuList('Burger\tR89.50\tFood');
  assert.deepEqual(rows, [{ label: 'Burger', unitPrice: 89.5, category: 'Food' }]);
});
