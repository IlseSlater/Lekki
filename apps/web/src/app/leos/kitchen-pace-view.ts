/** What the guest phone does with the kitchen's pace. */
export interface GuestPace {
  paused: boolean;
  holdRounds: boolean;
  hiddenCategories: string[];
  busyNotes: string[];
}

export const NO_PACE: GuestPace = {
  paused: false,
  holdRounds: false,
  hiddenCategories: [],
  busyNotes: [],
};

export function readGuestPace(raw: unknown): GuestPace {
  if (!raw || typeof raw !== 'object') return NO_PACE;
  const r = raw as Record<string, unknown>;
  const list = (v: unknown) =>
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  return {
    paused: r['paused'] === true,
    holdRounds: r['holdRounds'] === true,
    hiddenCategories: list(r['hiddenCategories']),
    busyNotes: list(r['busyNotes']),
  };
}

/** A category outside its hours leaves the menu. */
export function applyMenuHours<T extends { category: string }>(
  items: readonly T[],
  pace: GuestPace,
): T[] {
  if (!pace.hiddenCategories.length) return [...items];
  const hidden = new Set(pace.hiddenCategories);
  return items.filter((i) => !hidden.has(i.category));
}

export function canOrderNow(pace: GuestPace, category: string): boolean {
  return !pace.paused && !pace.hiddenCategories.includes(category);
}

/** One calm line above the menu when new orders are paused. */
export function pausedLine(pace: GuestPace): string {
  return pace.paused
    ? 'The kitchen is catching up and is not taking new orders for a moment. You can still see and pay your bill.'
    : '';
}

/** "Mains about 25 min · Starters about 10 min". Empty when nothing is being made. */
export function waitLine(pace: GuestPace): string {
  return pace.busyNotes.join(' · ');
}

/** A held round shows what is happening instead of a bare status. */
export function heldLabel(status: string, holdRounds: boolean): string | null {
  if (status.toLowerCase() !== 'held') return null;
  return holdRounds ? 'Held — sent together' : 'Held';
}

/** The manager's settings, edited one category at a time. */
export interface PaceSettings {
  paused: boolean;
  holdRounds: boolean;
  categoryHours: Record<string, { from: string; to: string }>;
  busyMinutes: Record<string, number>;
  /** Days the venue is closed ("YYYY-MM-DD"). */
  closedDates?: Array<{ date: string; note: string }>;
  /** When busy minutes stop applying (ISO). Null = until cleared. */
  busyUntil?: string | null;
}

const CLOCK = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Both times set puts the category on a window; either empty clears it. */
export function withHours(
  pace: PaceSettings,
  category: string,
  from: string,
  to: string,
): PaceSettings {
  const next = { ...pace.categoryHours };
  if (CLOCK.test(from) && CLOCK.test(to)) next[category] = { from, to };
  else delete next[category];
  return { ...pace, categoryHours: next };
}

/** A number of minutes sets the wait; empty or zero clears it. */
export function withBusy(pace: PaceSettings, category: string, minutes: number | null): PaceSettings {
  const next = { ...pace.busyMinutes };
  const m = Math.round(Number(minutes));
  if (Number.isFinite(m) && m > 0 && m <= 240) next[category] = m;
  else delete next[category];
  return { ...pace, busyMinutes: next };
}
