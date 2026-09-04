/**
 * Typed errors the request boundary is allowed to throw.
 *
 * Controllers must not `throw new Error(...)`: Nest maps a bare Error to 500,
 * which tells a guest the server fell over when the real answer is usually
 * "you are missing a field" or "someone else is already paying".
 *
 * Nest's own HttpException subclasses (UnauthorizedException and friends, as
 * used by SessionAccessService) pass through the filter untouched — these are
 * for the domain errors that have no Nest equivalent.
 */

export class MissingFieldError extends Error {
  readonly field: string;

  constructor(field: string) {
    super(`${field} is required`);
    this.name = 'MissingFieldError';
    this.field = field;
  }
}

export class InvalidParticipantError extends Error {
  constructor(message = 'Invalid participant credentials') {
    super(message);
    this.name = 'InvalidParticipantError';
  }
}

/** Row 5 — the visit changed between reading the balance and writing the payment. */
export class PaymentConflictError extends Error {
  constructor(message = 'Payment conflict') {
    super(message);
    this.name = 'PaymentConflictError';
  }
}
