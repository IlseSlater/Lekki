import assert from 'node:assert/strict';
import test from 'node:test';
import { viewCustomAmount } from './custom-amount';

test('an amount inside the bill shows what is left', () => {
  const v = viewCustomAmount(150, 400);
  assert.equal(v.ok, true);
  assert.equal(v.amount, 150);
  assert.equal(v.left, 250);
});

test('the amount that equals what is left settles the table', () => {
  const v = viewCustomAmount(400, 400);
  assert.equal(v.ok, true);
  assert.equal(v.left, 0);
  assert.match(v.hint, /settles/);
});

test('more than what is left is not payable', () => {
  const v = viewCustomAmount(400.01, 400);
  assert.equal(v.ok, false);
  assert.equal(v.amount, 0);
});

test('empty, zero, and text are not payable', () => {
  for (const bad of ['', 0, -1, 'abc', null, undefined]) {
    assert.equal(viewCustomAmount(bad, 100).ok, false);
  }
});

test('below the floor is not payable, unless it is all that is left', () => {
  assert.equal(viewCustomAmount(2, 100).ok, false);
  assert.equal(viewCustomAmount(3.5, 3.5).ok, true);
});
