import assert from 'node:assert/strict';
import test from 'node:test';
import { composeStillInBanner, isSameOpenSessionResume } from './mid-visit-resume';

test('banner prefers place over name', () => {
  const b = composeStillInBanner({
    firstName: 'Ada',
    placeTerm: 'Table',
    placeCode: '12',
  });
  assert.equal(b.message, 'You’re still in — Table 12.');
  assert.match(b.quiet, /where you left it/);
  assert.doesNotMatch(b.message, /Welcome back|browse when you’re ready/i);
});

test('banner uses first name when no place', () => {
  assert.equal(
    composeStillInBanner({ firstName: 'Ada Lovelace' }).message,
    'You’re still in, Ada.',
  );
});

test('banner fallback', () => {
  assert.equal(composeStillInBanner({}).message, 'You’re still in.');
});

test('same open session resume requires prior session + participant + match', () => {
  assert.equal(isSameOpenSessionResume('s1', 'p1', 's1'), true);
  assert.equal(isSameOpenSessionResume('s1', 'p1', 's2'), false);
  assert.equal(isSameOpenSessionResume('', 'p1', 's1'), false);
  assert.equal(isSameOpenSessionResume('s1', '', 's1'), false);
  assert.equal(isSameOpenSessionResume(null, 'p1', 's1'), false);
});
