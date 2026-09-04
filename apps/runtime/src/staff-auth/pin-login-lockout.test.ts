import assert from 'node:assert/strict';
import test from 'node:test';
import {
  clearPinFailures,
  emptyPinAttemptState,
  isPinLocked,
  lockMsAfterFailures,
  PIN_LOCK_AFTER_FAILURES,
  recordPinFailure,
} from './pin-login-lockout';

test('Batch 2: under ten failures does not lock', () => {
  let state = emptyPinAttemptState();
  const now = 1_000_000;
  for (let i = 0; i < PIN_LOCK_AFTER_FAILURES - 1; i++) {
    state = recordPinFailure(state, now);
  }
  assert.equal(state.failures, 9);
  assert.equal(isPinLocked(state, now), false);
  assert.equal(lockMsAfterFailures(9), 0);
});

test('Batch 2: tenth failure locks the account', () => {
  let state = emptyPinAttemptState();
  const now = 1_000_000;
  for (let i = 0; i < PIN_LOCK_AFTER_FAILURES; i++) {
    state = recordPinFailure(state, now);
  }
  assert.equal(state.failures, 10);
  assert.equal(isPinLocked(state, now), true);
  assert.ok(lockMsAfterFailures(10) >= 2000);
});

test('Batch 2: further failures grow the lock window', () => {
  const tenth = lockMsAfterFailures(10);
  const eleventh = lockMsAfterFailures(11);
  assert.ok(eleventh > tenth);
});

test('Batch 2: successful login clears failures', () => {
  let state = emptyPinAttemptState();
  const now = 1_000_000;
  for (let i = 0; i < 5; i++) state = recordPinFailure(state, now);
  state = clearPinFailures();
  assert.deepEqual(state, emptyPinAttemptState());
  assert.equal(isPinLocked(state, now), false);
});
