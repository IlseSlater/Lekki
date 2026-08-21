/**
 * Continuity — Mid-visit session resume.
 * One question: Am I still in?
 */

export type StillInBannerInput = {
  firstName?: string | null;
  placeTerm?: string | null;
  placeCode?: string | null;
};

/** Banner + optional quiet line for mid-visit resume. */
export function composeStillInBanner(input: StillInBannerInput = {}): {
  message: string;
  quiet: string;
} {
  const first = (input.firstName ?? '').trim().split(/\s+/)[0] || '';
  const term = (input.placeTerm ?? '').trim() || 'Place';
  const code = (input.placeCode ?? '').trim();
  const quiet = 'Your visit is right where you left it.';

  if (code) {
    return {
      message: `You’re still in — ${term} ${code}.`,
      quiet,
    };
  }
  if (first) {
    return {
      message: `You’re still in, ${first}.`,
      quiet,
    };
  }
  return {
    message: 'You’re still in.',
    quiet,
  };
}

/**
 * Mid-visit when device already held this open session before resolve,
 * and resolve returned the same session id.
 */
export function isSameOpenSessionResume(
  priorSessionId: string | null | undefined,
  priorParticipantId: string | null | undefined,
  resolvedSessionId: string | null | undefined,
): boolean {
  const prior = (priorSessionId ?? '').trim();
  const part = (priorParticipantId ?? '').trim();
  const next = (resolvedSessionId ?? '').trim();
  return !!prior && !!part && !!next && prior === next;
}
