import assert from 'node:assert/strict';
import test from 'node:test';
import {
  livePayConfidenceSentence,
  payConfidenceSentence,
} from './pay-confidence';

test('default open bill — one confirm sentence', () => {
  assert.equal(
    payConfidenceSentence({}),
    'Nothing is charged until you confirm.',
  );
});

test('mine vs visit — one sentence, not a policy wall', () => {
  assert.equal(
    payConfidenceSentence({ mineRemaining: 4000, visitRemaining: 12000 }),
    'Pay your items or the visit — nothing until you confirm.',
  );
});

test('equal share offered — one sentence', () => {
  assert.equal(
    payConfidenceSentence({
      equalRemaining: 4000,
      visitRemaining: 12000,
      mineRemaining: 5000,
    }),
    'Pay an equal share, your items, or the visit — nothing until you confirm.',
  );
});

test('share settled · visit still open', () => {
  assert.equal(
    payConfidenceSentence({
      shareSettled: true,
      visitHasOpenBalance: true,
    }),
    'You’re settled — you can still cover the visit.',
  );
  assert.equal(
    payConfidenceSentence({
      mineRemaining: 0,
      visitRemaining: 8000,
    }),
    'You’re settled — you can still cover the visit.',
  );
});

test('share settled · visit clear', () => {
  assert.equal(
    payConfidenceSentence({
      shareSettled: true,
      visitHasOpenBalance: false,
    }),
    'You’re all set for this visit.',
  );
});

test('Live pay confidence only when pay is open', () => {
  assert.equal(livePayConfidenceSentence(false), '');
  assert.equal(
    livePayConfidenceSentence(true),
    'Nothing is charged until you confirm.',
  );
});
