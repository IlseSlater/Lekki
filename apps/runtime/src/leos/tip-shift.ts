import { toMinor } from './money';

export interface TipPayment {
  status: string;
  tipAmount: Parameters<typeof toMinor>[0] | null;
  tipWaiterId: string | null;
  tipWaiterName: string | null;
  createdAt: Date;
}

export interface WaiterTips {
  waiterId: string;
  name: string;
  tipMinor: number;
  count: number;
}

const PAID = new Set(['completed', 'settled']);

/** Start of the shift day: tips count from 04:00 so a late night stays one shift. */
export function shiftStart(now: Date, startHour = 4): Date {
  const start = new Date(now);
  start.setHours(startHour, 0, 0, 0);
  if (now.getTime() < start.getTime()) start.setDate(start.getDate() - 1);
  return start;
}

/**
 * Each tip belongs to the waiter who had the table when it was paid.
 * Only paid tips count, and a tip with no waiter stays unattributed.
 */
export function tipsByWaiter(payments: readonly TipPayment[], since: Date): WaiterTips[] {
  const byWaiter = new Map<string, WaiterTips>();
  for (const p of payments) {
    if (!PAID.has(p.status)) continue;
    if (!p.tipWaiterId) continue;
    if (p.createdAt.getTime() < since.getTime()) continue;
    const tip = toMinor(p.tipAmount ?? 0);
    if (tip <= 0) continue;
    const row = byWaiter.get(p.tipWaiterId) ?? {
      waiterId: p.tipWaiterId,
      name: p.tipWaiterName || 'Waiter',
      tipMinor: 0,
      count: 0,
    };
    row.tipMinor += tip;
    row.count += 1;
    byWaiter.set(p.tipWaiterId, row);
  }
  return [...byWaiter.values()].sort((a, b) => b.tipMinor - a.tipMinor);
}
