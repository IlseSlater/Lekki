import assert from 'node:assert/strict';
import { test } from 'node:test';

/**
 * Pure rule: amount-mismatch ITN must release reservation only when the payment
 * was still `pending` (holding capacity). `expired` already released on expiry.
 */
function shouldReleaseOnAmountMismatch(status: string): boolean {
  return status === 'pending';
}

test('amount mismatch releases only from pending, not expired', () => {
  assert.equal(shouldReleaseOnAmountMismatch('pending'), true);
  assert.equal(shouldReleaseOnAmountMismatch('expired'), false);
  assert.equal(shouldReleaseOnAmountMismatch('amount_mismatch'), false);
  assert.equal(shouldReleaseOnAmountMismatch('completed'), false);
});
