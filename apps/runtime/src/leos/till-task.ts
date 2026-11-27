/**
 * When a table's bill came from the till (Pilot) and is settled in Lekki, the till still
 * shows it open until someone closes it there. Lekki cannot write to the till yet, so it
 * hands staff a task. Pure rules.
 */

export const TILL_TASK_PREFIX = 'Close on the till:';

/** Only bills that came from the till need closing there. */
export function needsTillClose(lines: ReadonlyArray<{ externalCheckId?: string | null }>): boolean {
  return lines.some((l) => !!l.externalCheckId?.trim());
}

export function tillTaskMessage(input: {
  placeCode: string | null | undefined;
  paidMinor: number;
  currency?: string;
  checkIds: readonly string[];
}): string {
  const place = input.placeCode?.trim() ? `table ${input.placeCode.trim()}` : 'this table';
  const amount = (Math.max(0, input.paidMinor) / 100).toFixed(2);
  const money = (input.currency || 'ZAR') === 'ZAR' ? `R ${amount}` : `${input.currency} ${amount}`;
  const checks = [...new Set(input.checkIds.map((c) => c.trim()).filter(Boolean))];
  const ref = checks.length ? ` (till bill ${checks.join(', ')})` : '';
  // Help messages are capped at 160 characters; the place and money come first so they survive.
  return `${TILL_TASK_PREFIX} ${place}. ${money} paid in Lekki${ref}.`.slice(0, 160);
}

export function isTillTask(message: string | null | undefined): boolean {
  return !!message?.startsWith(TILL_TASK_PREFIX);
}
