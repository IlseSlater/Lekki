/**
 * Studio Grow — Payouts.
 * One trading total, one general cadence line. Never a promised date —
 * PayFast's payout schedule isn't known to this runtime (see grow.controller.ts).
 */

export type PayoutMemory = {
  amount: number;
  currency: string;
  period: 'week' | 'month';
};

export type PayoutCopy = {
  totalLine: string;
  cadenceLine: string;
};

export function composePayoutCopy(m: PayoutMemory): PayoutCopy {
  const when = m.period === 'month' ? 'this month' : 'this week';

  const totalLine =
    m.amount > 0
      ? `You've taken ${formatAmount(m.amount, m.currency)} ${when}.`
      : `Nothing taken ${when} yet.`;

  /** Capabilities before vendors — never name the connector in owner-facing copy. */
  const cadenceLine = 'Card payments usually reach your account within a few working days.';

  return { totalLine, cadenceLine };
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}
