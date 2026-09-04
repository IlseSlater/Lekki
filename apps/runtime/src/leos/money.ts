import { Decimal } from '@prisma/client/runtime/library';

/** Minor-unit money helpers — all settlement uses exact cents, no float epsilon. */
export function toMinor(amount: number | string | Decimal): number {
  const n = typeof amount === 'object' && amount !== null && 'toNumber' in amount
    ? (amount as Decimal).toNumber()
    : Number(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function fromMinor(minor: number): number {
  return Math.round(minor) / 100;
}

export function addMinor(...amounts: Array<number | string | Decimal>): number {
  return amounts.reduce<number>((sum, a) => sum + toMinor(a), 0);
}

export function subtractMinor(a: number | string | Decimal, b: number | string | Decimal): number {
  return toMinor(a) - toMinor(b);
}

/** True when paid minor units fully cover the transaction total. */
export function isFullyPaid(totalMinor: number, paidTowardMinor: number): boolean {
  return paidTowardMinor >= totalMinor;
}

export function roundMoney(amount: number): number {
  return fromMinor(toMinor(amount));
}
