import assert from 'node:assert/strict';
import test from 'node:test';
import { composeEntryWaitCopy } from './entry-wait-continuity';

test('mid-visit redirect never says Welcome back', () => {
  const copy = composeEntryWaitCopy({ stillIn: true, returning: true });
  assert.equal(copy.reassure, 'You’re still in — one moment…');
  assert.doesNotMatch(copy.reassure, /Welcome back/i);
  assert.match(copy.muted, /where you left it/);
});

test('true return keeps Welcome back', () => {
  const copy = composeEntryWaitCopy({ stillIn: false, returning: true });
  assert.equal(copy.reassure, 'Welcome back — one moment…');
});

test('first visit welcome', () => {
  const copy = composeEntryWaitCopy({ stillIn: false, returning: false });
  assert.equal(copy.reassure, 'Welcome — one moment…');
});

test('loading mid-visit keeps still-in muted', () => {
  const copy = composeEntryWaitCopy({ stillIn: true, returning: false, findingPlace: true });
  assert.equal(copy.reassure, 'Finding your place…');
  assert.match(copy.muted, /where you left it/);
});
