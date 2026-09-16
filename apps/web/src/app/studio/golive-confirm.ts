/**
 * Go-live confirm sheet — four honest clauses, station never a person.
 * Partial facts never open the sheet.
 */

export type GoLiveConfirmInput = {
  venueName: string;
  placeCodes: string[];
  area: string;
  station: string;
  paymentsActive: boolean;
};

export type GoLiveConfirmCopy = {
  headline: string;
  scan: string;
  orders: string;
  pay: string;
  payConnected: boolean;
};

function trim(value?: string | null): string {
  return (value ?? '').trim();
}

function parseNumbered(label: string): { prefix: string; n: number } | null {
  const m = trim(label).match(/^(.*?)(\d+)\s*$/);
  if (!m) return null;
  return { prefix: m[1], n: Number(m[2]) };
}

/** First section, without a trailing room noun — Main Dining → Main. */
export function spokenArea(sectionName: string): string {
  return trim(sectionName).replace(/\s+(dining|room|seating|area)$/i, '');
}

/** Spoken scan span: "TBL-1 to TBL-12" or a single code. */
export function spokenScanRange(codes: string[]): string | null {
  const labels = codes.map(trim).filter(Boolean);
  if (!labels.length) return null;
  if (labels.length === 1) return labels[0];

  const parsed = labels.map(parseNumbered);
  const first = parsed[0];
  if (first && parsed.every((p) => p && p.prefix === first.prefix)) {
    const nums = parsed.map((p) => p!.n);
    const lo = Math.min(...nums);
    const hi = Math.max(...nums);
    return `${first.prefix}${lo} to ${first.prefix}${hi}`;
  }

  return `${labels[0]} to ${labels[labels.length - 1]}`;
}

export function canOpenGoLiveConfirm(input: GoLiveConfirmInput): boolean {
  return !!buildGoLiveConfirm(input);
}

export function buildGoLiveConfirm(input: GoLiveConfirmInput): GoLiveConfirmCopy | null {
  const venue = trim(input.venueName);
  const station = trim(input.station);
  const range = spokenScanRange(input.placeCodes);
  const area = trim(input.area);
  if (!venue || !station || !range) return null;

  const scan = area ? `Guests can scan ${range} in ${area}.` : `Guests can scan ${range}.`;

  return {
    headline: `${venue} is about to open.`,
    scan,
    orders: `Orders arrive at ${station}.`,
    pay: input.paymentsActive
      ? 'Payments are connected.'
      : 'Payments aren’t connected, so guests pay in person.',
    payConnected: input.paymentsActive,
  };
}
