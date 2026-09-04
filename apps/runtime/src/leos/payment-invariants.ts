import { addMinor, fromMinor, isFullyPaid, toMinor } from './money';

export class NothingLeftToPayError extends Error {
  constructor() {
    super('Nothing left to pay');
    this.name = 'NothingLeftToPayError';
  }
}

/** Remaining visit base in minor units (excludes tips already paid). */
export function remainingVisitMinor(
  sessionTotalMinor: number,
  paidTowardSessionMinor: number,
): number {
  return Math.max(0, sessionTotalMinor - paidTowardSessionMinor);
}

export function assertRemainingToPay(remainingMinor: number): void {
  if (remainingMinor <= 0) throw new NothingLeftToPayError();
}

/** Tip in minor units on the server base — never on a client subtotal. */
export function tipMinorOnServerBase(baseMinor: number, tipPercent: number): number {
  if (!Number.isFinite(tipPercent) || tipPercent <= 0) return 0;
  if (!Number.isFinite(baseMinor) || baseMinor <= 0) return 0;
  return Math.round((baseMinor * tipPercent) / 100);
}

export function applyTipToBase(
  baseMinor: number,
  options: { tipPercent?: number; tipAmount?: number },
): { baseMinor: number; tipMinor: number; chargeMinor: number } {
  const fromPercent =
    options.tipPercent != null && options.tipPercent > 0
      ? tipMinorOnServerBase(baseMinor, options.tipPercent)
      : 0;
  const tipMinor =
    fromPercent > 0 ? fromPercent : Math.max(0, toMinor(options.tipAmount ?? 0));
  return {
    baseMinor,
    tipMinor,
    chargeMinor: baseMinor + tipMinor,
  };
}

export function chargeMajor(chargeMinor: number): number {
  return fromMinor(chargeMinor);
}

export function visitFullyPaid(
  sessionTotalMinor: number,
  paidTowardSessionMinor: number,
): boolean {
  return isFullyPaid(sessionTotalMinor, paidTowardSessionMinor);
}

export { addMinor, fromMinor, toMinor };
