/**
 * Studio Grow — one breath of truth.
 * One dominant fact · ≤1 suggestion · no BI · no pack leftover “floor”.
 */

export type GrowNouns = {
  placePlural: string;
  station: string;
  participant: string;
  transaction: string;
};

export type GrowMemory = {
  guestsToday: number | null;
  guestsYesterday: number | null;
  takingsToday: number;
  takingsYesterday: number;
  currency: string;
  popularLabel: string | null;
  waitToday: number | null;
  waitYesterday: number | null;
  paymentsStatus: 'healthy' | 'setup' | null;
  hasMemory: boolean;
  hour: number;
  venue: string;
  nouns: GrowNouns;
};

export type GrowBreath = {
  usesToday: boolean;
  welcomeLine: string;
  tradingLine: string;
  favouriteLine: string;
  waitLine: string;
  showWait: boolean;
  healthLine: string;
  delightLine: string;
  delighted: boolean;
  suggestion: string;
};

export function growUsesToday(m: {
  guestsToday: number | null;
  guestsYesterday: number | null;
  takingsToday: number;
}): boolean {
  return (
    (m.guestsToday != null && m.guestsToday > 0) ||
    (m.takingsToday > 0 && !(m.guestsYesterday != null && m.guestsYesterday > 0))
  );
}

export function composeGrowBreath(m: GrowMemory): GrowBreath {
  const people = m.nouns.participant.toLowerCase();
  const peoplePlural = people.endsWith('s') ? people : `${people}s`;
  const txnVerb = transactionVerb(m.nouns.transaction);
  const places = m.nouns.placePlural;
  const station = m.nouns.station.toLowerCase();
  const usesToday = growUsesToday(m);

  const count = usesToday
    ? m.guestsToday != null && m.guestsToday > 0
      ? m.guestsToday
      : null
    : m.guestsYesterday != null && m.guestsYesterday > 0
      ? m.guestsYesterday
      : null;

  const when = usesToday ? 'today' : 'yesterday';
  const takings = usesToday
    ? m.takingsToday
    : m.takingsYesterday > 0
      ? m.takingsYesterday
      : m.takingsToday;
  const takingsWhen = usesToday ? (m.hour >= 17 ? 'Tonight' : 'Today') : 'Yesterday';

  const wait = usesToday ? m.waitToday : m.waitYesterday;
  const waitSlow = wait != null && wait >= 10;

  let welcomeLine: string;
  let favouriteLine: string;
  if (count != null) {
    welcomeLine = `You welcomed ${count} ${count === 1 ? people : peoplePlural} ${when}.`;
    favouriteLine = m.popularLabel
      ? `Most ${peoplePlural} ${txnVerb} the ${m.popularLabel}.`
      : '';
  } else {
    welcomeLine = `${m.venue} is live — quiet so far.`;
    favouriteLine = '';
  }

  const tradingLine =
    takings > 0
      ? `${takingsWhen} you took ${formatTakings(takings, m.currency)}.`
      : '';

  let waitLine = '';
  if (wait == null) {
    waitLine = '';
  } else if (wait < 1) {
    waitLine = 'Under a minute';
  } else {
    waitLine = `${wait} minute${wait === 1 ? '' : 's'}`;
  }

  const healthLine = m.paymentsStatus === 'setup' ? 'Payments still to finish.' : '';

  let delightLine: string;
  let delighted: boolean;
  if (count == null) {
    delightLine = `You’re ready when ${peoplePlural} arrive.`;
    delighted = false;
  } else if (waitSlow) {
    delightLine = `${capitalize(peoplePlural)} waited a little longer.`;
    delighted = false;
  } else {
    delightLine = `${capitalize(peoplePlural)} were delighted.`;
    delighted = true;
  }

  let suggestion: string;
  if (waitSlow) {
    suggestion = `Give the ${station} more hands when it gets busy.`;
  } else if (count != null && count >= 30) {
    suggestion = `Busy ${when} — keep another ${station} ready for the rush.`;
  } else if (takings > 0 && (wait ?? 0) < 8) {
    suggestion = `${places} moved calmly — keep this pace.`;
  } else if (!m.hasMemory) {
    suggestion = `Welcome a few more ${peoplePlural} — memory gets clearer with each night.`;
  } else if (m.paymentsStatus === 'setup') {
    suggestion = 'Finish payments when you have a quiet moment.';
  } else {
    suggestion = usesToday
      ? 'Keep the pace as calm as it felt today.'
      : 'Keep the pace as calm as yesterday felt.';
  }

  return {
    usesToday,
    welcomeLine,
    tradingLine,
    favouriteLine,
    waitLine,
    showWait: wait != null,
    healthLine,
    delightLine,
    delighted,
    suggestion,
  };
}

function formatTakings(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: currency || 'ZAR',
    maximumFractionDigits: 0,
  }).format(amount);
}

function transactionVerb(transactionNoun: string): string {
  const t = transactionNoun.toLowerCase();
  if (t.includes('request')) return 'requested';
  if (t.includes('order')) return 'ordered';
  return 'chose';
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}
