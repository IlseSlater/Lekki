/**
 * A waiter took payment on the venue's own card machine — pure rules.
 * The whole of what is left by default, or an amount; never more than is left.
 */

export const CARD_MACHINE_CONNECTOR = 'card_machine';

export type CardMachinePlan =
  | { baseMinor: number; tipMinor: number }
  | { refusal: string };

export function cardMachinePlan(input: {
  billMinor: number;
  paidMinor: number;
  /** Major units toward the bill. Empty = everything that is left. */
  amount?: number | null;
  /** Major units of tip taken on the machine. */
  tipAmount?: number | null;
}): CardMachinePlan {
  const leftMinor = Math.max(0, input.billMinor - Math.max(0, input.paidMinor));
  if (leftMinor <= 0) return { refusal: 'This table has nothing left to pay.' };
  const wanted =
    input.amount == null || input.amount === ('' as unknown)
      ? leftMinor
      : Math.round(Number(input.amount) * 100);
  if (!Number.isFinite(wanted) || wanted <= 0) return { refusal: 'Enter the amount taken on the machine.' };
  if (wanted > leftMinor) {
    return { refusal: `Only R ${(leftMinor / 100).toFixed(2)} is left on this table.` };
  }
  const tip = input.tipAmount == null ? 0 : Math.round(Number(input.tipAmount) * 100);
  if (!Number.isFinite(tip) || tip < 0) return { refusal: 'The tip must be zero or more.' };
  return { baseMinor: wanted, tipMinor: tip };
}
