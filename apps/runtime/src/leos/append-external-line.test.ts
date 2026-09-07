import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertExternalLineInput,
  externalLineBillMinorDelta,
  externalLineTotalMajor,
} from './append-external-line';
import { MissingFieldError } from './domain-errors';

test('POS ingress: Castle Lite 2 × R28.50 is R57.00 major and 5700 minor', () => {
  assert.equal(externalLineTotalMajor(2, 28.5), 57);
  assert.equal(externalLineBillMinorDelta(2, 28.5), 5700);
});

test('POS ingress: billMinor delta never uses major units as cents', () => {
  // Would have corrupted the session cap if we incremented billMinor by 57.
  assert.notEqual(externalLineBillMinorDelta(1, 57), 57);
  assert.equal(externalLineBillMinorDelta(1, 57), 5700);
});

test('POS ingress: required fields named for the boundary', () => {
  assert.throws(
    () =>
      assertExternalLineInput({
        sessionId: '',
        externalRef: 'PILOT-1',
        externalCheckId: 'CHK-1',
        labelFallback: 'Castle Lite',
        quantity: 1,
        unitPrice: 28.5,
      }),
    (err: unknown) => err instanceof MissingFieldError && err.field === 'sessionId',
  );
});
