/**
 * Continuity — Entry wait beat (redirect / loading).
 * Mid-visit must not flash Welcome back.
 */

export type EntryWaitCopy = {
  reassure: string;
  muted: string;
};

export function composeEntryWaitCopy(opts: {
  stillIn: boolean;
  returning: boolean;
  findingPlace?: boolean;
}): EntryWaitCopy {
  if (opts.findingPlace) {
    return {
      reassure: 'Finding your place…',
      muted: opts.stillIn
        ? 'Your visit is right where you left it.'
        : opts.returning
          ? 'Good to see you again.'
          : 'You’re joining the right experience.',
    };
  }
  if (opts.stillIn) {
    return {
      reassure: 'You’re still in — one moment…',
      muted: 'Your visit is right where you left it.',
    };
  }
  if (opts.returning) {
    return {
      reassure: 'Welcome back — one moment…',
      muted: 'Good to see you again.',
    };
  }
  return {
    reassure: 'Welcome — one moment…',
    muted: 'You’re joining the right experience.',
  };
}
