/** A retry carries the same key, so one order and one payment come out of many taps. */
export function cleanIdempotencyKey(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  const key = raw.trim();
  return /^[A-Za-z0-9_-]{8,80}$/.test(key) ? key : undefined;
}

export type PaymentReplay =
  | { kind: 'fresh' }
  | { kind: 'done'; paymentId: string; status: string; reference: string }
  | { kind: 'in_progress'; paymentId: string; status: string; reference: string };

/**
 * What a repeated payment request returns. A payment that settled or is still open answers
 * with itself. One that failed or expired lets the guest start a new one.
 */
export function paymentReplay(
  existing: { id: string; status: string; reference: string } | null | undefined,
): PaymentReplay {
  if (!existing) return { kind: 'fresh' };
  const base = { paymentId: existing.id, status: existing.status, reference: existing.reference };
  if (existing.status === 'completed' || existing.status === 'settled') {
    return { kind: 'done', ...base };
  }
  if (existing.status === 'pending') return { kind: 'in_progress', ...base };
  return { kind: 'fresh' };
}
