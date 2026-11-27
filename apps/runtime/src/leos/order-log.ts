/**
 * The order log — pure rules. Every step of an order is kept with its time and who did it,
 * read back from the event log (no extra table).
 */

/** One delay per order, from these choices. */
export const DELAY_CHOICES = [5, 10, 20, 30] as const;
export type DelayMinutes = (typeof DELAY_CHOICES)[number];

/** A cancel always says why. "Other" needs a few words. */
export const CANCEL_REASONS = [
  'Item ran out',
  'Kitchen too busy',
  'Guest changed their mind',
  'Ordered twice',
  'Other',
] as const;

export function cleanDelay(raw: unknown): DelayMinutes | null {
  const n = Math.round(Number(raw));
  return (DELAY_CHOICES as readonly number[]).includes(n) ? (n as DelayMinutes) : null;
}

/** The reason as it is stored and shown, or null when it is missing. */
export function cleanCancelReason(reason: unknown, note?: unknown): string | null {
  const r = typeof reason === 'string' ? reason.trim() : '';
  const n = typeof note === 'string' ? note.trim().slice(0, 140) : '';
  if (!(CANCEL_REASONS as readonly string[]).includes(r)) return null;
  if (r === 'Other') return n ? `Other: ${n}` : null;
  return n ? `${r}: ${n}` : r;
}

export type LogActor = { id: string; name: string } | null;

export type LoggedEnvelope = {
  eventName: string;
  occurredAt?: string;
  payload?: Record<string, unknown>;
};

export type TimelineStep = {
  at: string;
  step: string;
  by: string | null;
  detail: string | null;
};

const STATUS_WORDS: Record<string, string> = {
  held: 'Held to fire with the table',
  pending: 'Sent to the station',
  preparing: 'Being prepared',
  ready: 'Ready to take',
  delivered: 'Served',
  cancelled: 'Cancelled',
};

function actorName(payload: Record<string, unknown> | undefined): string | null {
  const a = payload?.['actor'];
  if (a && typeof a === 'object') {
    const name = (a as Record<string, unknown>)['name'];
    if (typeof name === 'string' && name.trim()) return name.trim();
  }
  return null;
}

/** Oldest first. Unknown events are left out rather than guessed at. */
export function timelineFromEvents(events: readonly LoggedEnvelope[]): TimelineStep[] {
  const steps: TimelineStep[] = [];
  for (const e of events) {
    const at = e.occurredAt ?? '';
    const p = e.payload ?? {};
    if (e.eventName === 'FulfilmentCreated') {
      steps.push({ at, step: 'Order placed', by: actorName(p), detail: null });
    } else if (e.eventName === 'FulfilmentStatusChanged') {
      const status = String(p['status'] ?? '');
      const reason = typeof p['reason'] === 'string' && p['reason'] ? String(p['reason']) : null;
      steps.push({ at, step: STATUS_WORDS[status] ?? status, by: actorName(p), detail: reason });
    } else if (e.eventName === 'FulfilmentDelayed') {
      steps.push({ at, step: `Delayed ${Number(p['minutes'])} min`, by: actorName(p), detail: null });
    }
  }
  return steps.sort((a, b) => a.at.localeCompare(b.at));
}

/** What managers are told when someone pauses orders. */
export function pauseAlert(input: { by: string; minutes?: number | null; reason?: string | null }) {
  const mins = Math.round(Number(input.minutes));
  const howLong = Number.isFinite(mins) && mins > 0 ? `for ${mins} min` : 'until reopened';
  const why = input.reason?.trim() ? `: ${input.reason.trim()}` : '';
  return {
    title: 'New orders paused',
    body: `${input.by || 'Staff'} paused new orders ${howLong}${why}`.slice(0, 180),
    tag: 'store-paused',
  };
}

/** What managers are told when an order is cancelled. */
export function cancelAlert(input: { by: string; placeCode?: string | null; reason: string }) {
  const place = input.placeCode?.trim() ? ` at table ${input.placeCode.trim()}` : '';
  return {
    title: 'Order cancelled',
    body: `${input.by || 'Staff'} cancelled an order${place}: ${input.reason}`.slice(0, 180),
    tag: `order-cancelled-${Date.now()}`,
  };
}

/** An order can be delayed once. */
export function alreadyDelayed(events: readonly LoggedEnvelope[]): boolean {
  return events.some((e) => e.eventName === 'FulfilmentDelayed');
}

/** Total minutes an order was pushed back (0 or one delay). */
export function delayMinutes(events: readonly LoggedEnvelope[]): number {
  const d = events.find((e) => e.eventName === 'FulfilmentDelayed');
  return d ? Number(d.payload?.['minutes']) || 0 : 0;
}
