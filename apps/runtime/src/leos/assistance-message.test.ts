import assert from 'node:assert/strict';
import test from 'node:test';
import { MAX_ASSISTANCE_MESSAGE, cleanAssistanceMessage, isSameAsk } from './assistance-message';

test('messages are trimmed, single-spaced, and capped', () => {
  assert.equal(cleanAssistanceMessage('  Water   for the table '), 'Water for the table');
  assert.equal(cleanAssistanceMessage('   '), undefined);
  assert.equal(cleanAssistanceMessage(undefined), undefined);
  assert.equal(cleanAssistanceMessage('x'.repeat(1000))!.length, MAX_ASSISTANCE_MESSAGE);
});

test('water and cutlery can be open together, the same ask is not doubled', () => {
  const water = { kind: 'service', message: 'Water for the table' };
  assert.equal(isSameAsk(water, { kind: 'service', message: 'Water for the table' }), true);
  assert.equal(isSameAsk(water, { kind: 'service', message: 'Cutlery for the table' }), false);
  assert.equal(isSameAsk(water, { kind: 'manager', message: 'Water for the table' }), false);
});
