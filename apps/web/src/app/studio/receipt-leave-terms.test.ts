import assert from 'node:assert/strict';
import test from 'node:test';
import {
  leavePrompt,
  leaveConfirmTitle,
  leaveLabelShort,
  receiptTitle,
} from './receipt-leave-terms';

// Real per-pack `close` values — packs/*/src/index.ts terminology.close.
const PACK_CLOSE = {
  restaurant: 'Clear & close',
  cafe: 'Complete visit',
  hotel: 'End stay session',
  festival: 'Leave zone',
  healthcare: 'Leave bay',
  airport: 'Board / leave',
} as const;

test('leavePrompt never falls back to hardcoded table language', () => {
  assert.equal(leavePrompt(PACK_CLOSE.restaurant), 'clear your table');
  assert.equal(leavePrompt(PACK_CLOSE.cafe), 'complete your visit');
  assert.equal(leavePrompt(PACK_CLOSE.hotel), 'end your stay session');
  assert.equal(leavePrompt(PACK_CLOSE.festival), 'leave your zone');
  assert.equal(leavePrompt(PACK_CLOSE.healthcare), 'leave the waiting bay');
  assert.equal(leavePrompt(PACK_CLOSE.airport), 'board or leave when you’re ready');
});

test('leaveConfirmTitle covers table / zone / bay / stay / board', () => {
  assert.equal(leaveConfirmTitle(PACK_CLOSE.restaurant), 'All done here?');
  assert.equal(leaveConfirmTitle(PACK_CLOSE.cafe), 'Visit complete?');
  assert.equal(leaveConfirmTitle(PACK_CLOSE.hotel), 'End your stay?');
  assert.equal(leaveConfirmTitle(PACK_CLOSE.festival), 'Leave this zone?');
  assert.equal(leaveConfirmTitle(PACK_CLOSE.healthcare), 'Leave the bay?');
  assert.equal(leaveConfirmTitle(PACK_CLOSE.airport), 'Ready to board?');
});

test('leaveLabelShort mirrors leaveConfirmTitle across every Pack', () => {
  assert.equal(leaveLabelShort(PACK_CLOSE.restaurant), 'Leave');
  assert.equal(leaveLabelShort(PACK_CLOSE.cafe), 'Complete');
  assert.equal(leaveLabelShort(PACK_CLOSE.hotel), 'End stay');
  assert.equal(leaveLabelShort(PACK_CLOSE.festival), 'Leave zone');
  assert.equal(leaveLabelShort(PACK_CLOSE.healthcare), 'Leave bay');
  assert.equal(leaveLabelShort(PACK_CLOSE.airport), 'Board');
});

test('receiptTitle is Pack-aware, not a hardcoded generic', () => {
  assert.equal(receiptTitle(PACK_CLOSE.restaurant), 'You’re finished');
  assert.equal(receiptTitle(PACK_CLOSE.cafe), 'Visit complete');
  assert.equal(receiptTitle(PACK_CLOSE.hotel), 'Your stay is complete');
  assert.equal(receiptTitle(PACK_CLOSE.festival), 'You’re clear to leave the zone');
  assert.equal(receiptTitle(PACK_CLOSE.healthcare), 'You’re clear to leave the bay');
  assert.equal(receiptTitle(PACK_CLOSE.airport), 'You’re ready to board');
});
