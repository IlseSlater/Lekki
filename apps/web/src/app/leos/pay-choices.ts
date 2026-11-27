/**
 * Guest pay choices — pure. Equal shares, tip chips with their money value,
 * and the stars a guest can add to a private note.
 */
import { fromMinor, toMinor } from './money';

// --- Equal shares (two inputs: people at the table, shares I'm covering) ---

export type EqualShares = {
  people: number;
  shares: number;
  /** One share of the whole bill. */
  perShare: number;
  /** What this guest pays: shares × one share, never more than is left. */
  amount: number;
  /** True when the amount was cut down to what is left. */
  capped: boolean;
};

const clampInt = (n: unknown, lo: number, hi: number) => {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo;
};

export function equalShares(input: {
  billTotal: number;
  remaining: number;
  people: number;
  shares: number;
}): EqualShares {
  const people = clampInt(input.people, 1, 50);
  const shares = clampInt(input.shares, 1, people);
  const totalMinor = Math.max(0, toMinor(input.billTotal));
  const leftMinor = Math.max(0, toMinor(input.remaining));
  // The last share takes any odd cent, so shares always add up to the bill.
  const perShareMinor = Math.floor(totalMinor / people);
  const wantMinor = shares === people ? totalMinor : perShareMinor * shares;
  const amountMinor = Math.min(wantMinor, leftMinor);
  return {
    people,
    shares,
    perShare: fromMinor(perShareMinor),
    amount: fromMinor(amountMinor),
    capped: amountMinor < wantMinor,
  };
}

// --- Tip chips the venue chooses ---

export const DEFAULT_TIP_PERCENTS = [10, 12.5, 15] as const;

/** The venue's tip percents (from the guest design), cleaned; the defaults when unset. */
export function tipPercentsFrom(design: Record<string, unknown> | null | undefined): number[] {
  const raw = design?.['tipPercents'];
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(/[,\s]+/)
      : null;
  if (!list) return [...DEFAULT_TIP_PERCENTS];
  const clean = [
    ...new Set(
      list
        .map((v) => Math.round(Number(v) * 10) / 10)
        .filter((v) => Number.isFinite(v) && v > 0 && v <= 30),
    ),
  ]
    .sort((a, b) => a - b)
    .slice(0, 5);
  return clean.length ? clean : [...DEFAULT_TIP_PERCENTS];
}

/** "10% · R 32.80" — the percent with what it adds on the guest's own amount. */
export function tipChipLabel(percent: number, base: number, currency = 'ZAR'): string {
  if (percent <= 0) return 'No tip';
  const minor = Math.round((Math.max(0, toMinor(base)) * percent) / 100);
  const value = (minor / 100).toFixed(2);
  const money = currency === 'ZAR' ? `R ${value}` : `${currency} ${value}`;
  return `${percent}% · ${money}`;
}

// --- Stars on a private note ---

export function cleanStars(n: unknown): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) && v >= 1 && v <= 5 ? v : 0;
}

/** "Food 4/5 · Service 5/5 — the words", or just the parts the guest gave. */
export function noteWithStars(food: unknown, service: unknown, text: string): string {
  const f = cleanStars(food);
  const s = cleanStars(service);
  const stars = [f ? `Food ${f}/5` : '', s ? `Service ${s}/5` : ''].filter(Boolean).join(' · ');
  const words = text.trim();
  if (stars && words) return `${stars} — ${words}`;
  return stars || words;
}
