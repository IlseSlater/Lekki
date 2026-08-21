import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAllowTip } from './tip-continuity';

test('workspace tipStaff false hides tips for matching token', () => {
  assert.equal(
    resolveAllowTip('qr-demo-restaurant', [
      {
        token: 'qr-demo-restaurant',
        typeId: 'restaurant',
        guestDesign: { tipStaff: false },
      },
    ]),
    false,
  );
});

test('workspace tipStaff true shows tips for matching token', () => {
  assert.equal(
    resolveAllowTip('qr-demo-restaurant', [
      {
        token: 'qr-demo-restaurant',
        typeId: 'restaurant',
        guestDesign: { tipStaff: true },
      },
    ]),
    true,
  );
});

test('festival demo token defaults tips off without workspace', () => {
  assert.equal(resolveAllowTip('qr-demo-festival'), false);
});

test('healthcare demo token defaults tips off without workspace', () => {
  assert.equal(resolveAllowTip('qr-demo-healthcare'), false);
});

test('restaurant demo token defaults tips on without workspace', () => {
  assert.equal(resolveAllowTip('qr-demo-restaurant'), true);
});

test('unknown token falls back to restaurant default (tips on)', () => {
  assert.equal(resolveAllowTip('custom-token-xyz'), true);
});
