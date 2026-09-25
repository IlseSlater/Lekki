import assert from 'node:assert/strict';
import test from 'node:test';
import {
  GUEST_SPLASH_MAX_MS,
  canEnterWithToken,
  firstImpressionLand,
  isReturningByVisits,
  menuPhaseAfterGetStarted,
  splashWelcomeQuery,
} from './guest-entry-gate';

test('entry token alone is enough to start the visit', () => {
  assert.equal(canEnterWithToken('qr-demo-restaurant'), true);
  assert.equal(canEnterWithToken('  '), false);
  assert.equal(canEnterWithToken(''), false);
  assert.equal(canEnterWithToken(null), false);
});

test('returning is visit memory, not a completed signup wall', () => {
  assert.equal(isReturningByVisits(0), false);
  assert.equal(isReturningByVisits(1), true);
  assert.equal(isReturningByVisits(3), true);
});

test('splash budget is four seconds and skippable', () => {
  assert.equal(GUEST_SPLASH_MAX_MS, 4000);
});

test('first visit after splash lands on venue arrival', () => {
  assert.equal(
    firstImpressionLand({ hasSession: true, skipLanding: false }),
    'arrival',
  );
});

test('return and still-in skip venue arrival', () => {
  assert.equal(
    firstImpressionLand({ hasSession: true, skipLanding: true }),
    'skip',
  );
});

test('mid-visit persist keeps browse; persist on landing keeps arrival', () => {
  assert.equal(
    firstImpressionLand({
      hasSession: true,
      skipLanding: false,
      restoredPhase: 'browse',
    }),
    'keep',
  );
  assert.equal(
    firstImpressionLand({
      hasSession: true,
      skipLanding: false,
      restoredPhase: 'arrival',
    }),
    'arrival',
  );
});

test('payment return never opens landing', () => {
  assert.equal(
    firstImpressionLand({
      hasSession: true,
      skipLanding: false,
      paymentResult: 'return',
    }),
    'skip',
  );
});

test('splash query: first visit has no welcome; return and still-in do', () => {
  assert.equal(splashWelcomeQuery({ stillIn: false, returning: false }), undefined);
  assert.equal(splashWelcomeQuery({ stillIn: true, returning: false }), 'still');
  assert.equal(splashWelcomeQuery({ stillIn: false, returning: true }), 'back');
  assert.equal(splashWelcomeQuery({ stillIn: true, returning: true }), 'still');
});

test('Get started always opens the menu, never Specials', () => {
  assert.equal(menuPhaseAfterGetStarted(), 'browse');
});
