/**
 * POS ingress helpers — pure, no Nest / Prisma.
 * Money: catalogue and Transaction.total stay Decimal major units;
 * session.billMinor is always incremented via toMinor().
 */

import { MissingFieldError } from './domain-errors';
import { roundMoney, toMinor } from './money';

export type ExternalLineOrigin = 'guest' | 'staff_pos' | 'staff_operate';

export function assertExternalLineInput(input: {
  sessionId: string;
  externalRef: string;
  externalCheckId: string;
  labelFallback: string;
  quantity: number;
  unitPrice: number;
}): void {
  if (!input.sessionId?.trim()) throw new MissingFieldError('sessionId');
  if (!input.externalRef?.trim()) throw new MissingFieldError('externalRef');
  if (!input.externalCheckId?.trim()) throw new MissingFieldError('externalCheckId');
  if (!input.labelFallback?.trim()) throw new MissingFieldError('labelFallback');
  if (!Number.isFinite(input.quantity) || input.quantity < 1) {
    throw new Error('Invalid quantity');
  }
  if (!Number.isFinite(input.unitPrice) || input.unitPrice < 0) {
    throw new Error('Invalid unitPrice');
  }
}

/** Line total in major units (ZAR), rounded like the rest of LEOS money. */
export function externalLineTotalMajor(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

/** Session bill cap delta for this line — always minor units. */
export function externalLineBillMinorDelta(quantity: number, unitPrice: number): number {
  return toMinor(externalLineTotalMajor(quantity, unitPrice));
}
