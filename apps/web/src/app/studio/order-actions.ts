/**
 * Staff choices for one order and one item — must match the runtime's order log
 * (apps/runtime/src/leos/order-log.ts); a test keeps them the same.
 */

export const DELAY_CHOICES = [5, 10, 20, 30] as const;

export const CANCEL_REASONS = [
  'Item ran out',
  'Kitchen too busy',
  'Guest changed their mind',
  'Ordered twice',
  'Other',
] as const;

export type CancelReason = (typeof CANCEL_REASONS)[number];

/** Can the cancel be sent? "Other" needs a few words. */
export function cancelReady(reason: CancelReason | '', note: string): boolean {
  if (!reason) return false;
  return reason !== 'Other' || note.trim().length > 0;
}

/** Pause lengths offered to a manager; null = until reopened. */
export const PAUSE_CHOICES: ReadonlyArray<{ label: string; minutes: number | null }> = [
  { label: '15 min', minutes: 15 },
  { label: '30 min', minutes: 30 },
  { label: '1 hour', minutes: 60 },
  { label: 'Until I reopen', minutes: null },
];

/** "Paused until 19:40" or "Paused until you reopen", on the venue's clock. */
export function pausedLine(
  pace: { paused: boolean; pausedUntil?: string | null },
  timeZone = 'Africa/Johannesburg',
): string {
  if (!pace.paused) return '';
  if (!pace.pausedUntil) return 'New orders paused until you reopen';
  const t = Date.parse(pace.pausedUntil);
  if (!Number.isFinite(t)) return 'New orders paused until you reopen';
  const hhmm = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(t));
  return `New orders paused until ${hhmm}`;
}

/** What the sold-out sheet says about an item. */
export function soldOutLabel(item: { available: boolean; soldOutUntil?: string | null }): string {
  if (item.available) return '';
  return item.soldOutUntil === 'tomorrow' ? 'Off today · back tomorrow' : 'Off until you turn it back on';
}
