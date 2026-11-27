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

test('a custom amount that is not allowed maps to 400 with the authored message', async () => {
  const { CustomAmountError } = await import('./payment-invariants');
  const mapped = mapDomainError(new CustomAmountError('Enter an amount to pay'));
  assert.equal(mapped.status, 400);
  assert.equal(mapped.code, 'invalid_amount');
  assert.equal(mapped.message, 'Enter an amount to pay');
});

test('a locked line maps to 409 line_locked', async () => {
  const { ClaimLockedError } = await import('./line-shares');
  const mapped = mapDomainError(new ClaimLockedError());
  assert.equal(mapped.status, 409);
  assert.equal(mapped.code, 'line_locked');
});

test('a refused table move maps to a clear status and the plain message', async () => {
  const { TableMoveRefusedError } = await import('./table-move');
  const busy = mapDomainError(new TableMoveRefusedError('target_busy', 'Table 9 already has guests.'));
  assert.equal(busy.status, 409);
  assert.equal(busy.code, 'table_move_refused');
  assert.equal(busy.message, 'Table 9 already has guests.');
  assert.equal(mapDomainError(new TableMoveRefusedError('not_manager', 'x')).status, 403);
  assert.equal(mapDomainError(new TableMoveRefusedError('target_missing', 'x')).status, 404);
});

test('a paused kitchen and closed hours map to 409 with their own codes', async () => {
  const { OrderRefusedError } = await import('./kitchen-pace');
  const paused = mapDomainError(new OrderRefusedError({ reason: 'paused' }));
  assert.equal(paused.status, 409);
  assert.equal(paused.code, 'orders_paused');
  const closed = mapDomainError(new OrderRefusedError({ reason: 'out_of_hours', category: 'Breakfast' }));
  assert.equal(closed.code, 'out_of_hours');
  assert.match(closed.message, /Breakfast/);
});
