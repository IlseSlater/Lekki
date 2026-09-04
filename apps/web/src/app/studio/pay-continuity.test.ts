import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAllowPay } from './pay-continuity';

test('workspace Pay off → Guest may not pay', () => {
  assert.equal(
    resolveAllowPay('qr-demo-restaurant', [
      { token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { payAtTable: false } },
    ]),
    false,
  );
});

test('workspace Pay on → Guest may pay', () => {
  assert.equal(
    resolveAllowPay('qr-demo-restaurant', [
      { token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { payAtTable: true } },
    ]),
    true,
  );
});

test('hotel / healthcare pack defaults Pay off', () => {
  assert.equal(resolveAllowPay('qr-demo-hotel'), false);
  assert.equal(resolveAllowPay('qr-demo-healthcare'), false);
});

test('restaurant pack default Pay on', () => {
  assert.equal(resolveAllowPay('qr-demo-restaurant'), true);
});
