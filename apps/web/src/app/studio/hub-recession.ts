/**
 * Day-two hub — gate recedes to one satisfied line.
 * Today’s Experience keeps the floor; Open Operate is the primary.
 */

export function recessedGateLine(input: {
  area: string;
  placeCount: number;
  placeNoun: string;
  station: string;
}): string | null {
  const area = (input.area ?? '').trim();
  const station = (input.station ?? '').trim();
  const noun = (input.placeNoun ?? '').trim().toLowerCase();
  const n = input.placeCount;
  if (!area || !station || !noun || n < 1) return null;
  const counted = n === 1 ? `1 ${noun}` : `${n} ${noun}s`;
  return `Open · ${area} · ${counted} · ${station}`;
}
