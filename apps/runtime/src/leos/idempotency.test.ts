import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanIdempotencyKey, paymentReplay } from './idempotency';

test('keys are plain, 8 to 80 characters', () => {
  assert.equal(cleanIdempotencyKey(' 3f2a9c1e-77aa-4c1b-9d02-1b2c3d4e5f60 '), '3f2a9c1e-77aa-4c1b-9d02-1b2c3d4e5f60');
  assert.equal(cleanIdempotencyKey('short'), undefined);
  assert.equal(cleanIdempotencyKey('has spaces in it!'), undefined);
  assert.equal(cleanIdempotencyKey('x'.repeat(81)), undefined);
  assert.equal(cleanIdempotencyKey(42), undefined);
  assert.equal(cleanIdempotencyKey(undefined), undefined);
});

test('a settled or open payment answers with itself', () => {
  const done = paymentReplay({ id: 'p1', status: 'completed', reference: 'r1' });
  assert.equal(done.kind, 'done');
  assert.equal(paymentReplay({ id: 'p1', status: 'settled', reference: 'r1' }).kind, 'done');
  const open = paymentReplay({ id: 'p2', status: 'pending', reference: 'r2' });
  assert.equal(open.kind, 'in_progress');
  assert.equal(open.kind === 'in_progress' && open.paymentId, 'p2');
});

test('a failed or expired payment lets the guest start again', () => {
  assert.equal(paymentReplay({ id: 'p3', status: 'failed', reference: 'r' }).kind, 'fresh');
  assert.equal(paymentReplay({ id: 'p4', status: 'expired', reference: 'r' }).kind, 'fresh');
  assert.equal(paymentReplay(null).kind, 'fresh');
});
