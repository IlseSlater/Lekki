/**
 * Continuity — Ready → Pay next-step crispness.
 * Ready answers fulfilment; gold primary answers settle only — never “finish”.
 */

/** Live gold CTA when a balance is due. */
export function livePayCtaLabel(isReady: boolean): string {
  return isReady ? 'Pay now' : 'Pay when ready';
}

/**
 * Live lead when fulfilment is Ready.
 * Balance due → calm bridge to settle; cleared balance → fulfilment cue only.
 */
export function liveReadyLead(readyHint: string, balanceDue: boolean): string {
  const hint = readyHint.trim() || 'It’s ready for you.';
  if (!balanceDue) return hint;
  return `${hint} Settle when you’re ready.`;
}
