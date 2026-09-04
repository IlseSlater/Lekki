import assert from 'node:assert/strict';
import test from 'node:test';
import { addMinor, fromMinor, isFullyPaid, roundMoney, subtractMinor, toMinor } from './money';

test('toMinor and fromMinor round-trip', () => {
  assert.equal(toMinor(33.33), 3333);
  assert.equal(fromMinor(3333), 33.33);
  assert.equal(toMinor(100), 10000);
});

test('isFullyPaid without epsilon — exact cents', () => {
  assert.equal(isFullyPaid(10000, 10000), true);
  assert.equal(isFullyPaid(10000, 9999), false);
  assert.equal(isFullyPaid(3333, 3333), true);
  // Three-way split of R100: 33.33 × 3 = 99.99 — not fully paid until last cent
  assert.equal(isFullyPaid(10000, 9999), false);
});

test('addMinor avoids float drift', () => {
  assert.equal(addMinor(0.1, 0.2), 30);
  assert.equal(fromMinor(addMinor(33.33, 33.33, 33.34)), 100);
});

test('roundMoney', () => {
  assert.equal(roundMoney(62.505), 62.51);
  assert.equal(roundMoney(62.504), 62.5);
});

test('subtractMinor for remaining balance', () => {
  const total = toMinor(350);
  const paid = addMinor(150, 200);
  assert.equal(subtractMinor(total, paid), 0);
  assert.equal(isFullyPaid(total, paid), true);
});
