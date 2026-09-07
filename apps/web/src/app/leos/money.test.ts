import assert from 'node:assert/strict';
import test from 'node:test';
import {
  fromMinor,
  hasOpenBalance,
  isCleared,
  isGreaterMinor,
  toMinor,
} from './money';

test('toMinor: exact cents, no float drift', () => {
  assert.equal(toMinor(28.5), 2850);
  assert.equal(toMinor(0.1 + 0.2), 30);
  assert.equal(fromMinor(5700), 57);
});

test('hasOpenBalance / isCleared replace 0.001 epsilon', () => {
  assert.equal(hasOpenBalance(0), false);
  assert.equal(hasOpenBalance(0.001), false); // sub-cent noise is not open
  assert.equal(hasOpenBalance(0.01), true);
  assert.equal(isCleared(0), true);
  assert.equal(isCleared(0.004), true);
  assert.equal(isCleared(0.01), false);
});

test('isGreaterMinor: visit vs share in cents', () => {
  assert.equal(isGreaterMinor(57, 28.5), true);
  assert.equal(isGreaterMinor(28.5, 28.5), false);
  assert.equal(isGreaterMinor(28.5, 28.501), false); // both round to 2850
});
