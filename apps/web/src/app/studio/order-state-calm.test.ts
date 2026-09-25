import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calmOrderLineLabel,
  draftOrderWhisper,
  hasOrderHistory,
  orderFilterTone,
} from './order-state-calm';

test('draft whisper stays quiet when cart empty', () => {
  assert.equal(draftOrderWhisper(0, 'order'), '');
});

test('draft whisper names Your order', () => {
  assert.equal(draftOrderWhisper(1, 'order'), '1 item in Your order');
  assert.equal(draftOrderWhisper(3, 'order'), '3 items in Your order');
});

test('history toggle only when terminal orders exist', () => {
  assert.equal(hasOrderHistory(['preparing', 'ready']), false);
  assert.equal(hasOrderHistory(['preparing', 'served']), true);
  assert.equal(hasOrderHistory(['completed']), true);
});

test('Active filter tone is never gold — ink vs quiet', () => {
  assert.equal(orderFilterTone('active'), 'ink');
  assert.equal(orderFilterTone('history'), 'quiet');
});

test('calm line label drops status chips from the string', () => {
  assert.equal(calmOrderLineLabel('Burger', 1), 'Burger');
  assert.equal(calmOrderLineLabel('Fries', 2), 'Fries × 2');
});
