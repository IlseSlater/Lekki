/**
 * Studio Grow — Answers (S-17).
 * One tap, one calm confirmation. Never a report picker, never an in-app table.
 */

export function answersDoorLabel(period: 'week' | 'month'): string {
  return period === 'month' ? "Email this month's orders →" : "Email last week's orders →";
}

export function composeAnswersConfirm(toEmail: string): string {
  return `On its way to ${toEmail}.`;
}

export const ANSWERS_ERROR = "Couldn't send that — try again shortly.";
