/**
 * Continuity — Open-tab Order-state calm.
 * Cart/tab as living state — spoken status, never a Guest status dashboard.
 */

/** Quiet draft whisper for browse (optional lead) — chip remains the primary signal. */
export function draftOrderWhisper(
  count: number,
  orderNoun: string,
): string {
  const n = Math.max(0, Math.floor(count));
  if (n <= 0) return '';
  const noun = (orderNoun || 'order').trim() || 'order';
  if (n === 1) return `1 item in Your ${noun}`;
  return `${n} items in Your ${noun}`;
}

/** True when the visit has terminal (history) orders worth a quiet toggle. */
export function hasOrderHistory(
  statuses: Array<string | null | undefined>,
): boolean {
  const terminal = new Set(['served', 'delivered', 'completed', 'cancelled']);
  return statuses.some((s) => terminal.has((s || '').toLowerCase().trim()));
}

/**
 * Guest Orders filter chrome — never gold.
 * Active is ink; History is quiet when present.
 */
export function orderFilterTone(tab: 'active' | 'history'): 'ink' | 'quiet' {
  return tab === 'active' ? 'ink' : 'quiet';
}

/** Lines stay labels — status is spoken once on the order, not per line. */
export function calmOrderLineLabel(label: string, quantity: number): string {
  const name = (label || '').trim() || 'Item';
  const q = Math.max(1, Math.floor(quantity || 1));
  return q > 1 ? `${name} × ${q}` : name;
}
