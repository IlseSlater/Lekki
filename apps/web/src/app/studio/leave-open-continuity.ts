/**
 * Continuity — Leave while visit still open.
 * One question: Can I leave if others still owe?
 */

export type LeaveOpenCopy = {
  title: string;
  lead: string;
  body: string;
  showVisitOpen: boolean;
  primary: string;
};

const PRIMARY = 'I’m finished';

/**
 * Leave confirm copy.
 * @param visitRemaining open visit balance after this guest’s share (null/0 = cleared)
 * @param clearedTitle pack leaveConfirmTitle when visit is settled
 * @param placeLabel physical context for cleared body (e.g. Table 12 / this place)
 */
export function composeLeaveOpenCopy(
  visitRemaining: number | null | undefined,
  clearedTitle: string,
  placeLabel: string,
): LeaveOpenCopy {
  const open = (visitRemaining ?? 0) > 0.001;
  const place = placeLabel.trim() || 'this place';

  if (open) {
    return {
      title: 'You’re free to leave',
      lead: 'Others can still settle what’s left — your session ends here.',
      body: '',
      showVisitOpen: true,
      primary: PRIMARY,
    };
  }

  return {
    title: clearedTitle.trim() || 'All done here?',
    lead: 'Stay if you still need anything.',
    body: `This ends your session at ${place} and returns you to the welcome screen.`,
    showVisitOpen: false,
    primary: PRIMARY,
  };
}
