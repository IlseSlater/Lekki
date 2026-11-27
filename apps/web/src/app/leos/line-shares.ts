/**
 * One dish, shared. Mirrors apps/runtime/src/leos/line-shares.ts.
 * Whole cents; remainder cents go to the first people in sorted order so shares add up to the line.
 */
export interface SharedLineInput {
  participantId: string | null;
  sharedWith?: readonly string[] | null;
  totalMinor: number;
}

function members(sharedWith: readonly string[] | null | undefined): string[] {
  return [...new Set(sharedWith ?? [])].sort();
}

export function shareOfLineMinor(line: SharedLineInput, participantId: string): number {
  const pool = members(line.sharedWith);
  if (pool.length === 0) return line.participantId === participantId ? line.totalMinor : 0;
  const index = pool.indexOf(participantId);
  if (index < 0) return 0;
  const base = Math.floor(line.totalMinor / pool.length);
  const remainder = line.totalMinor - base * pool.length;
  return base + (index < remainder ? 1 : 0);
}

/** "Shared 3 ways · your third" — the words a guest sees on a shared line. */
export function shareCaption(count: number, mine: boolean): string {
  if (count <= 0) return '';
  const ways = count === 1 ? 'Shared · just you so far' : `Shared ${count} ways`;
  if (!mine) return ways;
  if (count === 1) return ways;
  const parts: Record<number, string> = { 2: 'your half', 3: 'your third', 4: 'your quarter' };
  return `${ways} · ${parts[count] ?? 'your share'}`;
}
