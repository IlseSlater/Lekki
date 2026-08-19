/**
 * Studio Operate glance meaning — one decision per row.
 * Overview only; Staff Experience does the work. No Neo. No charts.
 */

export type GlanceTone = 'calm' | 'prep' | 'ready' | 'attention';

export function rankEscalations<T extends { status: string; createdAt?: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const openA = a.status === 'acknowledged' ? 1 : 0;
    const openB = b.status === 'acknowledged' ? 1 : 0;
    if (openA !== openB) return openA - openB;
    const ta = Date.parse(a.createdAt || '') || 0;
    const tb = Date.parse(b.createdAt || '') || 0;
    return ta - tb;
  });
}

export function placeGlanceLine(tone: GlanceTone, prepWord = 'Preparing'): string {
  if (tone === 'attention') return 'Needs you';
  if (tone === 'ready') return 'Ready';
  if (tone === 'prep') return prepWord;
  return 'Calm';
}

export function stationGlanceLine(
  label: string,
  counts: { waiting: number; preparing: number; ready: number },
): { line: string; tone: GlanceTone } {
  if (counts.waiting) {
    return {
      tone: 'attention',
      line:
        counts.waiting === 1
          ? `${label} has a ticket waiting`
          : `${label} has ${counts.waiting} tickets waiting`,
    };
  }
  if (counts.preparing) {
    return {
      tone: 'prep',
      line:
        counts.preparing === 1
          ? `${label} is preparing now`
          : `${label} is preparing ${counts.preparing}`,
    };
  }
  if (counts.ready) {
    return {
      tone: 'ready',
      line:
        counts.ready === 1
          ? `${label} has one ready for the floor`
          : `${label} has ${counts.ready} ready for the floor`,
    };
  }
  return { tone: 'calm', line: `${label} is calm` };
}

export function pressureSentence(
  places: Array<{ placeCode: string; tone: GlanceTone }>,
  placeNoun: string,
): string | null {
  const hot = places.filter((p) => p.tone === 'attention' || p.tone === 'prep');
  if (hot.length < 2) return null;
  const names = hot.slice(0, 3).map((p) => `${placeNoun} ${p.placeCode}`);
  if (names.length === 2) return `Pressure rising at ${names[0]} and ${names[1]}.`;
  return `Pressure rising at ${names[0]}, ${names[1]}, and ${names[2]}.`;
}

export function operateHandoffLine(): string {
  return 'Overview only — the next tap continues in Staff Experience.';
}

export function nextOwnerHint(
  firstOpenPlace: string | null,
  hottestStation: string | null,
  hottestPlace: string | null,
): string {
  if (firstOpenPlace) return `Claim ${firstOpenPlace} first.`;
  if (hottestStation) return `Continue in Staff · ${hottestStation}.`;
  if (hottestPlace) return `Continue in Staff · ${hottestPlace}.`;
  return 'Nothing needs you — keep watching.';
}
