import assert from 'node:assert/strict';
import test from 'node:test';
import {
  InvalidParticipantError,
  MissingFieldError,
  PaymentConflictError,
  SessionNotActiveError,
} from './domain-errors';
import { mapDomainError } from './error-mapping';
import { NothingLeftToPayError } from './payment-invariants';

test('missing required field maps to 400 and names the field', () => {
  const mapped = mapDomainError(new MissingFieldError('participantSecret'));
  assert.equal(mapped.status, 400);
  assert.equal(mapped.code, 'missing_field');
  assert.match(mapped.message, /participantSecret/);
});

test('invalid participant credentials map to 401, not 500', () => {
  const mapped = mapDomainError(new InvalidParticipantError());
  assert.equal(mapped.status, 401);
  assert.equal(mapped.code, 'invalid_participant');
});

test('nothing left to pay maps to 409', () => {
  const mapped = mapDomainError(new NothingLeftToPayError());
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'nothing_left_to_pay');
});

test('row 5: a concurrent payment conflict maps to 409', () => {
  const mapped = mapDomainError(new PaymentConflictError());
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'payment_conflict');
});

test('POS ingress: inactive session maps to 409', () => {
  const mapped = mapDomainError(new SessionNotActiveError());
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'session_not_active');
});

test('an unknown error maps to 500 and leaks no internals', () => {
  const leaky = new Error(
    'Invalid `prisma.payment.create()` invocation: SELECT * FROM "Payment" WHERE "id" = $1',
  );
  const mapped = mapDomainError(leaky);
  assert.equal(mapped.status, 500);
  assert.equal(mapped.code, 'internal_error');
  for (const internal of ['prisma', 'SELECT', 'FROM', '$1', 'Payment', 'invocation']) {
    assert.ok(
      !mapped.message.includes(internal),
      `500 body leaked an internal detail: ${internal}`,
    );
  }
  assert.ok(!/\n\s+at /.test(mapped.message), '500 body leaked a stack frame');
});

test('a thrown non-Error does not crash the mapper', () => {
  assert.equal(mapDomainError('boom').status, 500);
  assert.equal(mapDomainError(undefined).status, 500);
  assert.equal(mapDomainError({ message: 'nope' }).status, 500);
});
