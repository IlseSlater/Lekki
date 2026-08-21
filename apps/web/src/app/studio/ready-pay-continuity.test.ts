import assert from 'node:assert/strict';
import test from 'node:test';
import { livePayCtaLabel, liveReadyLead } from './ready-pay-continuity';

test('ready + balance due CTA says Pay now — never finish', () => {
  const label = livePayCtaLabel(true);
  assert.equal(label, 'Pay now');
  assert.doesNotMatch(label, /finish|leave|end/i);
});

test('not ready CTA stays Pay when ready', () => {
  assert.equal(livePayCtaLabel(false), 'Pay when ready');
});

test('ready lead with balance bridges settle without leave language', () => {
  const lead = liveReadyLead('Your waiter is on the way with your order.', true);
  assert.match(lead, /Settle when you’re ready/);
  assert.doesNotMatch(lead, /finish|leave|end visit/i);
});

test('ready lead without balance is fulfilment cue only', () => {
  assert.equal(
    liveReadyLead('Head to the counter when you’re called.', false),
    'Head to the counter when you’re called.',
  );
});

test('café pack ready hint still bridges settle when balance due', () => {
  const lead = liveReadyLead('Head to the counter when you’re called.', true);
  assert.match(lead, /counter/);
  assert.match(lead, /Settle/);
});
