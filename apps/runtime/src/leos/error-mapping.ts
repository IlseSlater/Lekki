import {
  InvalidParticipantError,
  MissingFieldError,
  PaymentConflictError,
  SessionNotActiveError,
} from './domain-errors';
import { ClaimLockedError, ShareNotAllowedError } from './line-shares';
import { TableMoveRefusedError, moveRefusalStatus } from './table-move';
import { OrderRefusedError } from './kitchen-pace';
import { CustomAmountError, NothingLeftToPayError } from './payment-invariants';

export interface MappedError {
  status: number;
  code: string;
  message: string;
}

/**
 * Anything we did not recognise. Deliberately fixed text: an unrecognised error
 * may carry a Prisma message, a SQL fragment or a stack, and none of that
 * belongs on the wire. The correlationId on the response is how it gets traced.
 */
const INTERNAL: MappedError = {
  status: 500,
  code: 'internal_error',
  message: 'Something went wrong on our side.',
};

/**
 * Pure: no Nest, no Prisma, no request. That is what makes it testable without
 * a database, and it is why the filter is a thin shell over this function.
 */
export function mapDomainError(err: unknown): MappedError {
  if (err instanceof MissingFieldError) {
    return {
      status: 400,
      code: 'missing_field',
      message: `${err.field} is required.`,
    };
  }

  if (err instanceof InvalidParticipantError) {
    return {
      status: 401,
      code: 'invalid_participant',
      message: 'Invalid participant credentials.',
    };
  }

  if (err instanceof NothingLeftToPayError) {
    return {
      status: 409,
      code: 'nothing_left_to_pay',
      message: 'Nothing left to pay.',
    };
  }

  if (err instanceof ClaimLockedError) {
    return {
      status: 409,
      code: 'line_locked',
      message: 'Someone is paying for this item right now. Try again in a moment.',
    };
  }

  if (err instanceof ShareNotAllowedError) {
    return { status: 409, code: 'share_not_allowed', message: err.message };
  }

  if (err instanceof OrderRefusedError) {
    return {
      status: 409,
      code: err.refusal.reason === 'paused' ? 'orders_paused' : 'out_of_hours',
      message: err.message,
    };
  }

  if (err instanceof TableMoveRefusedError) {
    return { status: moveRefusalStatus(err.reason), code: 'table_move_refused', message: err.message };
  }

  if (err instanceof CustomAmountError) {
    // Message is authored in customAmountBaseMinor and safe to show a guest.
    return { status: 400, code: 'invalid_amount', message: err.message };
  }

  if (err instanceof PaymentConflictError) {
    // Fixed text on purpose. The hospitable version of this line is a
    // brand-architect call and is explicitly out of scope for this batch.
    return {
      status: 409,
      code: 'payment_conflict',
      message: 'This visit changed while you were paying.',
    };
  }

  if (err instanceof SessionNotActiveError) {
    return {
      status: 409,
      code: 'session_not_active',
      message: 'This visit is no longer open.',
    };
  }

  return INTERNAL;
}
