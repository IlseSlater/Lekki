import { fromMinor, toMinor } from './money';

/** Matches the runtime floor. A smaller bill can still be paid in full. */
export const MIN_CUSTOM_AMOUNT_MINOR = 500;

export interface CustomAmountView {
  /** The amount the guest will pay, in major units. 0 when it is not payable yet. */
  amount: number;
  /** What stays open on the table after this payment. */
  left: number;
  ok: boolean;
  /** One calm line under the field. */
  hint: string;
}

/** What the guest sees as they type. The server enforces the same rule. */
export function viewCustomAmount(entered: unknown, remaining: number): CustomAmountView {
  const remainingMinor = Math.max(0, toMinor(remaining));
  const raw = typeof entered === 'number' ? entered : Number(entered);
  if (!Number.isFinite(raw) || raw <= 0) {
    return { amount: 0, left: fromMinor(remainingMinor), ok: false, hint: 'Enter what you would like to pay.' };
  }
  const minor = toMinor(raw);
  if (minor > remainingMinor) {
    return {
      amount: 0,
      left: fromMinor(remainingMinor),
      ok: false,
      hint: `That is more than what is left (${fromMinor(remainingMinor).toFixed(2)}).`,
    };
  }
  const floor = Math.min(MIN_CUSTOM_AMOUNT_MINOR, remainingMinor);
  if (minor < floor) {
    return {
      amount: 0,
      left: fromMinor(remainingMinor),
      ok: false,
      hint: `The smallest amount is ${fromMinor(floor).toFixed(2)}.`,
    };
  }
  const left = fromMinor(remainingMinor - minor);
  return {
    amount: fromMinor(minor),
    left,
    ok: true,
    hint: left > 0 ? `${left.toFixed(2)} will be left for the table.` : 'That settles the table.',
  };
}
