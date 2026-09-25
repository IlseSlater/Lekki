/**
 * Receipt + Leave — Pack-aware close terminology.
 * One input: the venue's `close` term (table / zone / bay / stay / board / …).
 * Never hardcode "table" — every Pack reads its own words here.
 */

export function leavePrompt(close: string): string {
  const c = close.toLowerCase();
  if (c.includes('complete')) return 'complete your visit';
  if (c.includes('clear')) return 'clear your table';
  if (c.includes('end') || c.includes('stay')) return 'end your stay session';
  if (c.includes('zone')) return 'leave your zone';
  if (c.includes('board')) return 'board or leave when you’re ready';
  if (c.includes('bay')) return 'leave the waiting bay';
  return c;
}

export function leaveConfirmTitle(close: string): string {
  const c = close.toLowerCase();
  if (c.includes('complete')) return 'Visit complete?';
  if (c.includes('end') || c.includes('stay')) return 'End your stay?';
  if (c.includes('zone')) return 'Leave this zone?';
  if (c.includes('board')) return 'Ready to board?';
  if (c.includes('bay')) return 'Leave the bay?';
  return 'All done here?';
}

export function leaveLabelShort(close: string): string {
  if (/complete/i.test(close)) return 'Complete';
  if (/end/i.test(close) && /stay/i.test(close)) return 'End stay';
  if (/zone/i.test(close)) return 'Leave zone';
  if (/board/i.test(close)) return 'Board';
  if (/bay/i.test(close)) return 'Leave bay';
  return 'Leave';
}

/** Receipt's finished-visit heading — same close term, statement not a question. */
export function receiptTitle(close: string): string {
  const c = close.toLowerCase();
  if (c.includes('complete')) return 'Visit complete';
  if (c.includes('end') || c.includes('stay')) return 'Your stay is complete';
  if (c.includes('zone')) return 'You’re clear to leave the zone';
  if (c.includes('board')) return 'You’re ready to board';
  if (c.includes('bay')) return 'You’re clear to leave the bay';
  return 'You’re finished';
}
