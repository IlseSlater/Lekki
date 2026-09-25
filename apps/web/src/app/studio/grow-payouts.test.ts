import assert from 'node:assert/strict';
import test from 'node:test';
import { composePayoutCopy } from './grow-payouts';

const DAY_NAMES = /\b(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i;
const DATE_LIKE = /\b\d{1,2}[/-]\d{1,2}\b|\b\d{4}-\d{2}-\d{2}\b/;

test('never names a specific day or date — payout timing is not known', () => {
  const copy = composePayoutCopy({ amount: 18200, currency: 'ZAR', period: 'week' });
  assert.doesNotMatch(copy.totalLine, DAY_NAMES);
  assert.doesNotMatch(copy.totalLine, DATE_LIKE);
  assert.doesNotMatch(copy.cadenceLine, DAY_NAMES);
  assert.doesNotMatch(copy.cadenceLine, DATE_LIKE);
});

test('week total reads as one calm prose line', () => {
  const copy = composePayoutCopy({ amount: 18200, currency: 'ZAR', period: 'week' });
  assert.match(copy.totalLine, /You've taken R.?18.?200 this week\./);
});

test('month total uses month framing', () => {
  const copy = composePayoutCopy({ amount: 64000, currency: 'ZAR', period: 'month' });
  assert.match(copy.totalLine, /this month/);
});

test('zero taken reads calm, not a blank/zero stat', () => {
  const copy = composePayoutCopy({ amount: 0, currency: 'ZAR', period: 'week' });
  assert.match(copy.totalLine, /Nothing taken this week yet\./);
  assert.doesNotMatch(copy.totalLine, /R0|0\.00/);
});

test('cadence line is general — grounded in a documented card-settlement cycle', () => {
  const copy = composePayoutCopy({ amount: 100, currency: 'ZAR', period: 'week' });
  assert.match(copy.cadenceLine, /within a few working days/);
});

test('capabilities before vendors — never names the payment connector', () => {
  const copy = composePayoutCopy({ amount: 100, currency: 'ZAR', period: 'week' });
  assert.doesNotMatch(copy.totalLine, /PayFast|Stripe|Yoco|Peach/i);
  assert.doesNotMatch(copy.cadenceLine, /PayFast|Stripe|Yoco|Peach/i);
});
