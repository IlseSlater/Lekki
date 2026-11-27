/**
 * One calm sentence for the owner at the end of an evening.
 * It speaks only when the averages rest on enough finished visits, and every figure comes
 * from a recorded visit or payment. With too little to go on it says nothing.
 */

export const MIN_VISITS_FOR_AVERAGE = 5;

const MIN_STAY_MINUTES = 5;
const MAX_STAY_MINUTES = 8 * 60;

export interface EveningVisit {
  startedAt: Date;
  completedAt: Date | null;
}

export interface EveningInput {
  visits: readonly EveningVisit[];
  tipMinor: number;
  tipCount: number;
  currency: string;
}

/** Whole minutes spent, for finished visits of a believable length. */
export function stayMinutes(visits: readonly EveningVisit[]): number[] {
  const out: number[] = [];
  for (const v of visits) {
    if (!v.completedAt) continue;
    const minutes = (v.completedAt.getTime() - v.startedAt.getTime()) / 60000;
    if (minutes >= MIN_STAY_MINUTES && minutes <= MAX_STAY_MINUTES) out.push(minutes);
  }
  return out;
}

/** "About 50 minutes": rounded to the nearest five so the line reads as an estimate. */
export function roundedAverage(minutes: readonly number[]): number {
  if (!minutes.length) return 0;
  const mean = minutes.reduce((a, b) => a + b, 0) / minutes.length;
  return Math.max(5, Math.round(mean / 5) * 5);
}

function money(minor: number, currency: string): string {
  const amount = minor / 100;
  try {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    })
      .format(amount)
      .replace(/\u00a0/g, ' ');
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function eveningSentence(input: EveningInput): string | null {
  const stays = stayMinutes(input.visits);
  if (stays.length < MIN_VISITS_FOR_AVERAGE) return null;
  const parts = [
    `${stays.length} tables settled`,
    `about ${roundedAverage(stays)} minutes each`,
  ];
  if (input.tipCount > 0 && input.tipMinor > 0) {
    parts.push(`${money(input.tipMinor, input.currency)} in tips`);
  }
  const last = parts.pop() as string;
  return `Tonight: ${parts.length ? parts.join(', ') + ' and ' : ''}${last}.`;
}
