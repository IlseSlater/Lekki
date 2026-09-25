/**
 * Continuity — Open-tab Pay confidence sentence.
 * One calm line removes pay uncertainty — never a second trust paragraph.
 */

export type PayConfidenceInput = {
  mineRemaining?: number | null;
  visitRemaining?: number | null;
  equalRemaining?: number | null;
  /** Share just settled; visit may still be open. */
  shareSettled?: boolean;
  visitHasOpenBalance?: boolean;
};

function open(n: number | null | undefined): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n > 0;
}

function cleared(n: number | null | undefined): boolean {
  return typeof n === 'number' && Number.isFinite(n) && n <= 0;
}

/**
 * Single Guest/Live confidence sentence for Bill.
 * Prefer this as the screen lead — do not also print under the total.
 */
export function payConfidenceSentence(input: PayConfidenceInput): string {
  if (input.shareSettled) {
    return input.visitHasOpenBalance
      ? 'You’re settled — you can still cover the visit.'
      : 'You’re all set for this visit.';
  }

  const mine = input.mineRemaining;
  const visit = input.visitRemaining;
  const equal = input.equalRemaining;

  if (cleared(equal) && open(visit)) {
    return 'You’re settled — you can still cover the visit.';
  }
  if (cleared(mine) && open(visit)) {
    return 'You’re settled — you can still cover the visit.';
  }
  if (open(equal) && open(visit) && (visit as number) > (equal as number)) {
    return 'Pay an equal share, your items, or the visit — nothing until you confirm.';
  }
  if (open(mine) && open(visit) && (visit as number) > (mine as number)) {
    return 'Pay your items or the visit — nothing until you confirm.';
  }
  return 'Nothing is charged until you confirm.';
}

/** Live Bill / pay phone — default open-tab confidence (no split maths on desk). */
export function livePayConfidenceSentence(payOpen: boolean): string {
  if (!payOpen) return '';
  return 'Nothing is charged until you confirm.';
}
