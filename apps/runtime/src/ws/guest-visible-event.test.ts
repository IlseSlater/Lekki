import assert from 'node:assert/strict';
import test from 'node:test';
import { guestVisibleEvent } from './guest-visible-event';

test('3b: INTERNAL PaymentOverpayment does not reach the guest room', () => {
  assert.equal(
    guestVisibleEvent({
      eventName: 'PaymentOverpayment',
      privacy: { classification: 'INTERNAL' },
    }),
    false,
  );
});

test('3b: PUBLIC classification reaches the guest room', () => {
  assert.equal(
    guestVisibleEvent({
      eventName: 'AnythingCustom',
      privacy: { classification: 'PUBLIC' },
    }),
    true,
  );
});

test('3b: allowlisted journey events still reach the guest room', () => {
  assert.equal(
    guestVisibleEvent({
      eventName: 'PaymentCompleted',
      privacy: { classification: 'INTERNAL' },
    }),
    true,
  );
});
