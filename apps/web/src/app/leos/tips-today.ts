export interface WaiterTipsRow {
  waiterId: string;
  name: string;
  tipMinor: number;
  count: number;
}

/** Rand and cents from minor units. 12345 reads R123.45. */
export function formatTipMinor(minor: number): string {
  const safe = Number.isFinite(minor) ? Math.max(0, Math.round(minor)) : 0;
  const rand = Math.floor(safe / 100);
  const cents = safe % 100;
  const withSpaces = String(rand).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return cents === 0 ? `R${withSpaces}` : `R${withSpaces}.${String(cents).padStart(2, '0')}`;
}

/** One calm line for the waiter phone. Empty until there is a tip. */
export function myTipsLine(tipMinor: number, count: number): string {
  if (tipMinor <= 0) return '';
  const word = count === 1 ? 'tip' : 'tips';
  return `${formatTipMinor(tipMinor)} in tips this shift · ${count} ${word}`;
}

/** The amount for one person in Team, or empty when they have none. */
export function teamTipFor(rows: readonly WaiterTipsRow[], staffId: string): string {
  const row = rows.find((r) => r.waiterId === staffId);
  return row && row.tipMinor > 0 ? `${formatTipMinor(row.tipMinor)} in tips` : '';
}
