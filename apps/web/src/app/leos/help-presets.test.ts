import assert from 'node:assert/strict';
import test from 'node:test';
import { HELP_PRESETS, MAX_NOTE_LENGTH, isSpecificAsk, noteMessage } from './help-presets';

test('the presets are water, cutlery, card machine, and cash bill', () => {
  assert.deepEqual(
    HELP_PRESETS.map((p) => p.label),
    ['Water', 'Cutlery', 'Card machine', 'Cash bill'],
  );
});

test('a note becomes a short message, empty notes are not sent', () => {
  assert.equal(noteMessage('  no   onions  '), 'Note: no onions');
  assert.equal(noteMessage('   '), null);
  assert.equal(noteMessage('x'.repeat(500))!.length, 'Note: '.length + MAX_NOTE_LENGTH);
});

test('waiters see the specific ask, not the generic one', () => {
  assert.equal(isSpecificAsk('Water for the table'), true);
  assert.equal(isSpecificAsk('Guest asked for help at the waiter'), false);
  assert.equal(isSpecificAsk('Guest asked to speak with the manager'), false);
  assert.equal(isSpecificAsk(undefined), false);
});
