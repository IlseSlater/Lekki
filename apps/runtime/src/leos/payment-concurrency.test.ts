import assert from 'node:assert/strict';
import test from 'node:test';
import { PaymentConflictError } from './domain-errors';
import { mapDomainError } from './error-mapping';
import {
  canReservePayment,
  isPendingReservationExpired,
  paidMinorAfterExpiryRelease,
  paidMinorAfterRetake,
  paymentBaseMinor,
  paymentExpiresAt,
  PENDING_PAYMENT_TTL_MS,
  sessionRemainingMinor,
  settlementCapacityAction,
} from './payment-session-cap';

test('row 5: remaining is session-wide bill minus paid', () => {
  assert.equal(sessionRemainingMinor(35000, 0), 35000);
  assert.equal(sessionRemainingMinor(35000, 20000), 15000);
  assert.equal(sessionRemainingMinor(35000, 35000), 0);
});

test('row 5: predicate allows a reserve within cap at matching version', () => {
  assert.equal(
    canReservePayment({
      billMinor: 35000,
      paidMinor: 0,
      version: 3,
      versionRead: 3,
      baseMinor: 35000,
    }),
    true,
  );
});

test('row 5: predicate refuses overpayment', () => {
  assert.equal(
    canReservePayment({
      billMinor: 35000,
      paidMinor: 20000,
      version: 1,
      versionRead: 1,
      baseMinor: 20000,
    }),
    false,
  );
});

test('row 5: predicate refuses stale version (lost update)', () => {
  assert.equal(
    canReservePayment({
      billMinor: 35000,
      paidMinor: 0,
      version: 4,
      versionRead: 3,
      baseMinor: 35000,
    }),
    false,
  );
});

test('row 5: zero rows from the predicate maps to PaymentConflictError → 409', () => {
  const mapped = mapDomainError(new PaymentConflictError());
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'payment_conflict');
});

test('row 5: tip is excluded from the reserved base', () => {
  assert.equal(paymentBaseMinor(40250, 5250), 35000);
});

test('row 5: abandoned pending past expiresAt is expired', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const expiredAt = new Date('2026-09-04T11:59:00.000Z');
  assert.equal(
    isPendingReservationExpired({
      status: 'pending',
      expiresAt: expiredAt,
      now,
    }),
    true,
  );
});

test('row 5: pending inside the window is not expired', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const expiresAt = new Date(now.getTime() + 60_000);
  assert.equal(
    isPendingReservationExpired({ status: 'pending', expiresAt, now }),
    false,
  );
});

test('row 5: completed payment is never treated as an expired reservation', () => {
  assert.equal(
    isPendingReservationExpired({
      status: 'completed',
      expiresAt: new Date(0),
      now: new Date(),
    }),
    false,
  );
});

test('row 5: expiry release drops reserved base from paidMinor and frees capacity', () => {
  const after = paidMinorAfterExpiryRelease(35000, 35000);
  assert.equal(after, 0);
  assert.equal(sessionRemainingMinor(35000, after), 35000);
  assert.equal(
    canReservePayment({
      billMinor: 35000,
      paidMinor: after,
      version: 2,
      versionRead: 2,
      baseMinor: 35000,
    }),
    true,
  );
});

test('row 5: paymentExpiresAt is the gateway TTL from now', () => {
  const from = new Date('2026-09-04T12:00:00.000Z');
  assert.equal(
    paymentExpiresAt(from).getTime() - from.getTime(),
    PENDING_PAYMENT_TTL_MS,
  );
});

test('row 5: settle while pending uses the held reservation (no re-take)', () => {
  assert.equal(
    settlementCapacityAction({
      priorStatus: 'pending',
      billMinor: 35000,
      paidMinor: 35000,
      baseMinor: 35000,
    }),
    'use_held',
  );
});

test('row 5: settle after expiry re-takes capacity', () => {
  const afterRelease = paidMinorAfterExpiryRelease(35000, 35000);
  assert.equal(
    settlementCapacityAction({
      priorStatus: 'expired',
      billMinor: 35000,
      paidMinor: afterRelease,
      baseMinor: 35000,
    }),
    'retake',
  );
  const afterRetake = paidMinorAfterRetake(afterRelease, 35000);
  assert.equal(afterRetake, 35000);
  assert.equal(sessionRemainingMinor(35000, afterRetake), 0);
});

test('row 5: settle after expiry against a settled session is overpayment', () => {
  assert.equal(
    settlementCapacityAction({
      priorStatus: 'expired',
      billMinor: 35000,
      paidMinor: 35000,
      baseMinor: 35000,
    }),
    'overpayment',
  );
});

test('row 5: already-settled settle is idempotent', () => {
  assert.equal(
    settlementCapacityAction({
      priorStatus: 'completed',
      billMinor: 35000,
      paidMinor: 35000,
      baseMinor: 35000,
    }),
    'idempotent',
  );
  assert.equal(
    settlementCapacityAction({
      priorStatus: 'needs_refund',
      billMinor: 35000,
      paidMinor: 35000,
      baseMinor: 35000,
    }),
    'idempotent',
  );
});
