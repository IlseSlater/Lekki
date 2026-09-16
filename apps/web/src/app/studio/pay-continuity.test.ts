import assert from 'node:assert/strict';
import test from 'node:test';
import {
  paymentsActiveFromStatus,
  paymentsCardState,
  resolveAllowPay,
  resolvePayIntent,
} from './pay-continuity';

test('workspace Pay off → Guest may not pay even if install is active', () => {
  assert.equal(
    resolveAllowPay(
      'qr-demo-restaurant',
      [{ token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { payAtTable: false } }],
      null,
      true,
    ),
    false,
  );
});

test('workspace Pay on without install → Guest may not pay', () => {
  assert.equal(
    resolveAllowPay(
      'qr-demo-restaurant',
      [{ token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { payAtTable: true } }],
    ),
    false,
  );
});

test('workspace Pay on and install active → Guest may pay', () => {
  assert.equal(
    resolveAllowPay(
      'qr-demo-restaurant',
      [{ token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { payAtTable: true } }],
      null,
      true,
    ),
    true,
  );
});

test('hotel / healthcare pack defaults Pay off', () => {
  assert.equal(resolveAllowPay('qr-demo-hotel', [], null, true), false);
  assert.equal(resolveAllowPay('qr-demo-healthcare', [], null, true), false);
});

test('restaurant pack default is intent-on but allowPay fails closed without install', () => {
  assert.equal(resolvePayIntent('qr-demo-restaurant'), true);
  assert.equal(resolveAllowPay('qr-demo-restaurant'), false);
  assert.equal(resolveAllowPay('qr-demo-restaurant', [], null, true), true);
});

test('only status active counts as paymentsActive', () => {
  assert.equal(paymentsActiveFromStatus('active'), true);
  assert.equal(paymentsActiveFromStatus('verified'), false);
  assert.equal(paymentsActiveFromStatus('draft'), false);
  assert.equal(paymentsActiveFromStatus(null), false);
});

test('Payments card copy matches the guest degrade', () => {
  assert.deepEqual(paymentsCardState(false), { value: 'Guests can pay in person', ok: false });
  assert.deepEqual(paymentsCardState(true), { value: 'Connected', ok: true });
});
