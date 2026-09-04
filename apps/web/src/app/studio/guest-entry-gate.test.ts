import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUEST_SPLASH_MAX_MS,
  canEnterWithToken,
  isReturningByVisits,
} from './guest-entry-gate';

test('Batch 6: entry token alone is enough to reach the menu', () => {
  assert.equal(canEnterWithToken('qr-demo-restaurant'), true);
  assert.equal(canEnterWithToken('  '), false);
  assert.equal(canEnterWithToken(''), false);
  assert.equal(canEnterWithToken(null), false);
});

test('Batch 6: returning is visit memory, not a completed signup wall', () => {
  assert.equal(isReturningByVisits(0), false);
  assert.equal(isReturningByVisits(1), true);
  assert.equal(isReturningByVisits(3), true);
});

test('Batch 6: splash budget stays under one second', () => {
  assert.ok(GUEST_SPLASH_MAX_MS < 1000);
});
