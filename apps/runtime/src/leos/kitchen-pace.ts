/**
 * Kitchen pace: menu hours, pausing new orders, busy minutes, and holding a round to fire together.
 * Pure rules. The venue's clock decides what is on the menu right now.
 */
export interface CategoryHours {
  /** 24-hour "HH:MM". */
  from: string;
  to: string;
}

export interface KitchenPace {
  /** New orders stop. Seated guests can still see their bill and pay. */
  paused: boolean;
  /** New rounds wait until a waiter fires them together. */
  holdRounds: boolean;
  categoryHours: Record<string, CategoryHours>;
  /** Minutes the kitchen is running for a category right now. */
  busyMinutes: Record<string, number>;
}

export const DEFAULT_PACE: KitchenPace = {
  paused: false,
  holdRounds: false,
  categoryHours: {},
  busyMinutes: {},
};

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

  return {
    paused: raw['paused'] === true,
    holdRounds: raw['holdRounds'] === true,
    categoryHours,
    busyMinutes,
  };
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
  | { reason: 'paused' }
  | { reason: 'out_of_hours'; category: string };

/** Why a new order is refused right now, or null when it can go ahead. */
export function orderRefusal(
  pace: KitchenPace,
  itemCategories: readonly string[],
  minutes: number,
): OrderRefusal | null {
  if (pace.paused) return { reason: 'paused' };
  const closed = hiddenCategories(pace, itemCategories, minutes)[0];
  return closed ? { reason: 'out_of_hours', category: closed } : null;
}

export function orderRefusalMessage(refusal: OrderRefusal): string {
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
  pace: KitchenPace,
  input: { allCategories: readonly string[]; openCategories: readonly string[]; minutes: number },
): GuestPaceView {
  return {
    paused: pace.paused,
    holdRounds: pace.holdRounds,
    hiddenCategories: hiddenCategories(pace, input.allCategories, input.minutes),
    busyNotes: busyNotes(pace, input.openCategories),
  };
}
