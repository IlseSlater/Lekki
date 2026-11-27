/**
 * The live payment feed staff watch: one row per payment, newest first. Pure rules.
 * A row says the table, the bill, what this payment covered, and what is still owed now.
 */

export type FeedPayment = {
  id: string;
  createdAt: Date;
  amountMinor: number;
  tipMinor: number;
  sessionId: string;
};

export type FeedSession = {
  id: string;
  placeCode: string | null;
  billMinor: number;
  paidMinor: number;
};

export type PaymentFeedRow = {
  paymentId: string;
  at: string;
  placeCode: string | null;
  billMinor: number;
  /** What this payment put toward the bill (tip excluded). */
  paidMinor: number;
  tipMinor: number;
  /** One payment covered the whole bill, or only part of it. */
  kind: 'full' | 'part';
  /** Still owed on the table right now. */
  leftMinor: number;
  settled: boolean;
};

export function paymentFeedRows(
  payments: readonly FeedPayment[],
  sessions: readonly FeedSession[],
): PaymentFeedRow[] {
  const byId = new Map(sessions.map((s) => [s.id, s] as const));
  return [...payments]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map((p) => {
      const s = byId.get(p.sessionId);
      const bill = Math.max(0, s?.billMinor ?? 0);
      const base = Math.max(0, p.amountMinor - p.tipMinor);
      const left = Math.max(0, bill - Math.max(0, s?.paidMinor ?? 0));
      return {
        paymentId: p.id,
        at: p.createdAt.toISOString(),
        placeCode: s?.placeCode ?? null,
        billMinor: bill,
        paidMinor: base,
        tipMinor: Math.max(0, p.tipMinor),
        kind: bill > 0 && base >= bill ? 'full' : 'part',
        leftMinor: left,
        settled: left === 0,
      };
    });
}
