/**
 * Kitchen pace: menu hours, pausing new orders, busy minutes, and holding a round to fire together.
 * Pure rules. The venue's clock decides what is on the menu right now.
 */
export interface CategoryHours {
  /** 24-hour "HH:MM". */
  from: string;
  to: string;
}

/** A whole day the venue does not serve (a holiday, a private event). */
export interface ClosedDate {
  /** "YYYY-MM-DD" on the venue's clock. */
  date: string;
  note: string;
}

export interface KitchenPace {
  /** New orders stop. Seated guests can still see their bill and pay. */
  paused: boolean;
  /** When a pause ends by itself (ISO time). Null = until someone reopens. */
  pausedUntil: string | null;
  /** Why it was paused — for managers, never shown to guests. */
  pauseReason: string;
  /** New rounds wait until a waiter fires them together. */
  holdRounds: boolean;
  categoryHours: Record<string, CategoryHours>;
  /** Minutes the kitchen is running for a category right now. */
  busyMinutes: Record<string, number>;
  /** When busy minutes stop applying (ISO time). Null = until cleared. */
  busyUntil: string | null;
  /** Days the venue is closed. */
  closedDates: ClosedDate[];
  /** Item id → the venue day it is sold out for. It is back the next day by itself. */
  soldOutToday: Record<string, string>;
}

export const DEFAULT_PACE: KitchenPace = {
  paused: false,
  pausedUntil: null,
  pauseReason: '',
  holdRounds: false,
  categoryHours: {},
  busyMinutes: {},
  busyUntil: null,
  closedDates: [],
  soldOutToday: {},
};

const DAY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
const MAX_CLOSED_DATES = 60;
const MAX_SOLD_OUT = 500;

function cleanIso(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const t = Date.parse(value);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

function cleanText(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;
const MAX_CATEGORIES = 40;
const MAX_BUSY_MINUTES = 180;

function clean(name: unknown): string | null {
  if (typeof name !== 'string') return null;
  const value = name.trim();
  return value && value.length <= 60 ? value : null;
}

/** Anything that is not a clean setting is dropped. */
export function normalisePace(input: unknown): KitchenPace {
  const raw = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const categoryHours: Record<string, CategoryHours> = {};
  const hours = (raw['categoryHours'] && typeof raw['categoryHours'] === 'object'
    ? raw['categoryHours']
    : {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(hours)) {
    const name = clean(key);
    const v = value as Partial<CategoryHours> | null;
    if (!name || !v || !HHMM.test(String(v.from)) || !HHMM.test(String(v.to))) continue;
    if (Object.keys(categoryHours).length >= MAX_CATEGORIES) break;
    categoryHours[name] = { from: String(v.from), to: String(v.to) };
  }

  const busyMinutes: Record<string, number> = {};
  const busy = (raw['busyMinutes'] && typeof raw['busyMinutes'] === 'object'
    ? raw['busyMinutes']
    : {}) as Record<string, unknown>;
  for (const [key, value] of Object.entries(busy)) {
    const name = clean(key);
    const minutes = Math.round(Number(value));
    if (!name || !Number.isFinite(minutes) || minutes <= 0) continue;
    if (Object.keys(busyMinutes).length >= MAX_CATEGORIES) break;
    busyMinutes[name] = Math.min(minutes, MAX_BUSY_MINUTES);
  }

  const closed = new Map<string, ClosedDate>();
  for (const entry of Array.isArray(raw['closedDates']) ? raw['closedDates'] : []) {
    const e = (entry && typeof entry === 'object' ? entry : {}) as Record<string, unknown>;
    const date = typeof e['date'] === 'string' ? e['date'].trim() : '';
    if (!DAY.test(date) || closed.size >= MAX_CLOSED_DATES) continue;
    closed.set(date, { date, note: cleanText(e['note'], 80) });
  }

  const soldOutToday: Record<string, string> = {};
  const sold = (raw['soldOutToday'] && typeof raw['soldOutToday'] === 'object'
    ? raw['soldOutToday']
    : {}) as Record<string, unknown>;
  for (const [itemId, day] of Object.entries(sold)) {
    if (!itemId || itemId.length > 80 || typeof day !== 'string' || !DAY.test(day)) continue;
    if (Object.keys(soldOutToday).length >= MAX_SOLD_OUT) break;
    soldOutToday[itemId] = day;
  }

  const paused = raw['paused'] === true;
  return {
    paused,
    pausedUntil: paused ? cleanIso(raw['pausedUntil']) : null,
    pauseReason: paused ? cleanText(raw['pauseReason'], 120) : '',
    holdRounds: raw['holdRounds'] === true,
    categoryHours,
    busyMinutes,
    busyUntil: Object.keys(busyMinutes).length ? cleanIso(raw['busyUntil']) : null,
    closedDates: [...closed.values()].sort((a, b) => a.date.localeCompare(b.date)),
    soldOutToday,
  };
}

/** "YYYY-MM-DD" on the venue's clock. */
export function venueDate(now: Date, timeZone = 'Africa/Johannesburg'): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export type LivePace = KitchenPace & {
  /** Today is one of the closed dates. */
  closedToday: boolean;
};

/**
 * The pace as it stands right now: a pause or busy spell whose time is up has ended,
 * and "sold out today" from an earlier day no longer counts.
 */
export function livePace(pace: KitchenPace, now: Date, timeZone = 'Africa/Johannesburg'): LivePace {
  const t = now.getTime();
  const pauseOver = pace.paused && !!pace.pausedUntil && t >= Date.parse(pace.pausedUntil);
  const busyOver = !!pace.busyUntil && t >= Date.parse(pace.busyUntil);
  const today = venueDate(now, timeZone);
  const soldOutToday: Record<string, string> = {};
  for (const [itemId, day] of Object.entries(pace.soldOutToday)) {
    if (day === today) soldOutToday[itemId] = day;
  }
  return {
    ...pace,
    paused: pace.paused && !pauseOver,
    pausedUntil: pauseOver ? null : pace.pausedUntil,
    pauseReason: pauseOver ? '' : pace.pauseReason,
    busyMinutes: busyOver ? {} : pace.busyMinutes,
    busyUntil: busyOver ? null : pace.busyUntil,
    soldOutToday,
    closedToday: pace.closedDates.some((d) => d.date === today),
  };
}

/** Pause new orders, for a while or until reopened. */
export function pausedPace(
  pace: KitchenPace,
  input: { paused: boolean; minutes?: number | null; reason?: string | null },
  now: Date,
): KitchenPace {
  if (!input.paused) return { ...pace, paused: false, pausedUntil: null, pauseReason: '' };
  const minutes = Math.round(Number(input.minutes));
  const until =
    Number.isFinite(minutes) && minutes > 0
      ? new Date(now.getTime() + Math.min(minutes, 24 * 60) * 60_000).toISOString()
      : null;
  return { ...pace, paused: true, pausedUntil: until, pauseReason: cleanText(input.reason, 120) };
}

/** Is an item sold out right now, either for today or until someone changes it back? */
export function itemSoldOut(
  pace: LivePace,
  item: { id: string; available?: boolean | null },
): boolean {
  return item.available === false || item.id in pace.soldOutToday;
}

/** Minutes since midnight on the venue's clock. */
export function minutesOnVenueClock(now: Date, timeZone = 'Africa/Johannesburg'): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0) % 24;
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return hour * 60 + minute;
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** A category with no hours is always on. A window that crosses midnight (22:00 to 02:00) works. */
export function categoryOpen(pace: KitchenPace, category: string, minutes: number): boolean {
  const window = pace.categoryHours[category];
  if (!window) return true;
  const from = toMinutes(window.from);
  const to = toMinutes(window.to);
  if (from === to) return true;
  return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to;
}

export function hiddenCategories(
  pace: KitchenPace,
  categories: readonly string[],
  minutes: number,
): string[] {
  return [...new Set(categories)].filter((c) => !categoryOpen(pace, c, minutes));
}

/** "Mains about 25 min" for categories still being made. */
export function busyNotes(pace: KitchenPace, openCategories: readonly string[]): string[] {
  return [...new Set(openCategories)]
    .filter((c) => (pace.busyMinutes[c] ?? 0) > 0)
    .sort((a, b) => a.localeCompare(b))
    .map((c) => `${c} about ${pace.busyMinutes[c]} min`);
}

export type OrderRefusal =
  | { reason: 'closed_today' }
  | { reason: 'paused' }
  | { reason: 'out_of_hours'; category: string };

/** Why a new order is refused right now, or null when it can go ahead. */
export function orderRefusal(
  pace: KitchenPace & { closedToday?: boolean },
  itemCategories: readonly string[],
  minutes: number,
): OrderRefusal | null {
  if (pace.closedToday) return { reason: 'closed_today' };
  if (pace.paused) return { reason: 'paused' };
  const closed = hiddenCategories(pace, itemCategories, minutes)[0];
  return closed ? { reason: 'out_of_hours', category: closed } : null;
}

export function orderRefusalMessage(refusal: OrderRefusal): string {
  if (refusal.reason === 'closed_today') return 'We are closed today, so new orders are off.';
  return refusal.reason === 'paused'
    ? 'The kitchen is catching up and is not taking new orders for a moment.'
    : `${refusal.category} is not being served right now.`;
}

export class OrderRefusedError extends Error {
  constructor(readonly refusal: OrderRefusal) {
    super(orderRefusalMessage(refusal));
    this.name = 'OrderRefusedError';
  }
}

/** A new round starts held when the venue fires rounds together. */
export function initialFulfilmentStatus(pace: KitchenPace, connectorStatus: string): string {
  return pace.holdRounds ? 'held' : connectorStatus;
}

export interface GuestPaceView {
  paused: boolean;
  holdRounds: boolean;
  /** Categories outside their window. The guest menu hides them. */
  hiddenCategories: string[];
  /** "Mains about 25 min", for what is being made now. */
  busyNotes: string[];
}

/** What the guest phone needs to know. Nothing about staff settings beyond this. */
export function guestPaceView(
  pace: KitchenPace & { closedToday?: boolean },
  input: { allCategories: readonly string[]; openCategories: readonly string[]; minutes: number },
): GuestPaceView {
  return {
    // A closed day reads to the guest like a pause: the bill still works, new orders do not.
    paused: pace.paused || !!pace.closedToday,
    holdRounds: pace.holdRounds,
    hiddenCategories: hiddenCategories(pace, input.allCategories, input.minutes),
    busyNotes: busyNotes(pace, input.openCategories),
  };
}
