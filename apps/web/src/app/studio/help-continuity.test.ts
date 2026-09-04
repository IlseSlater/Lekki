import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAllowHelp } from './help-continuity';

test('workspace Call Staff off → Guest may not Help', () => {
  assert.equal(
    resolveAllowHelp('qr-demo-restaurant', [
      { token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { callStaff: false } },
    ]),
    false,
  );
});

test('workspace Call Staff on → Guest may Help', () => {
  assert.equal(
    resolveAllowHelp('qr-demo-restaurant', [
      { token: 'qr-demo-restaurant', typeId: 'restaurant', guestDesign: { callStaff: true } },
    ]),
    true,
  );
});

test('restaurant pack default Call Staff on', () => {
  assert.equal(resolveAllowHelp('qr-demo-restaurant'), true);
});

test('healthcare pack default Call Staff on', () => {
  assert.equal(resolveAllowHelp('qr-demo-healthcare'), true);
});
