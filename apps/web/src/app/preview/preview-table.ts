/**
 * A sample table for Studio's preview phone — pure, no Angular.
 *
 * Built from the venue's real menu so the owner sees their own dishes and prices.
 * Everything the guest does in the preview (order, claim, share, pay, ask for help)
 * changes only this sample. Nothing reaches the kitchen, the till or a gateway.
 */

export const PREVIEW_SESSION_ID = 'preview';
export const PREVIEW_ME = 'preview-you';
export const PREVIEW_SECRET = 'preview';
/** Lekki gold — the brand colour a venue starts with. */
export const DEFAULT_BRAND_COLOUR = '#d7a14a';

export type PreviewMenuItem = {
  id: string;
  label: string;
  unitPrice: number;
  category?: string;
  available?: boolean;
  routingTags?: string[];
};

export type PreviewVenue = {
  venueId: string;
  organisationId: string;
  venueName: string;
  brandColour: string;
  logoUrl: string;
  location: string;
  guestDesign: Record<string, unknown> | null;
  paymentsActive: boolean;
  currency: string;
};

export type PreviewLine = {
  id: string;
  label: string;
  quantity: number;
  unitPrice: number;
  catalogueItemId: string | null;
  participantId: string | null;
  sharedWith: string[];
  selectionsJson?: unknown;
  notes?: string | null;
};

export type PreviewTransaction = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  lines: PreviewLine[];
};

export type PreviewPayment = {
  id: string;
  status: string;
  amount: number;
  tipAmount: number;
  scope: string;
  participantId: string | null;
};

export type PreviewHelp = {
  id: string;
  kind: string;
  message?: string;
  status: string;
  sessionId: string;
  createdAt: string;
};

export type PreviewTable = {
  venue: PreviewVenue;
  placeCode: string;
  menu: PreviewMenuItem[];
  participants: Array<{ id: string; displayName: string; role: string }>;
  transactions: PreviewTransaction[];
  fulfilments: Array<{
    id: string;
    status: string;
    stationId: string;
    sessionId: string;
    createdAt: string;
    lines: Array<{ label: string; quantity: number; transactionLineId: string }>;
  }>;
  payments: PreviewPayment[];
  help: PreviewHelp[];
  seq: number;
};

const PEOPLE = [
  { id: PREVIEW_ME, displayName: 'You', role: 'guest' },
  { id: 'preview-naledi', displayName: 'Naledi', role: 'guest' },
  { id: 'preview-pieter', displayName: 'Pieter', role: 'guest' },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

function stationFor(item: PreviewMenuItem | undefined): string {
  const tags = (item?.routingTags ?? []).join(' ').toLowerCase();
  if (tags.includes('bar') || tags.includes('drink')) return 'station-bar';
  return 'station-kitchen';
}

/** Ids shaped like real ones — the guest app shows the last 8 characters as the order number. */
function nextId(t: PreviewTable, prefix: string): string {
  t.seq += 1;
  const code = ((t.seq * 2654435761) >>> 0).toString(36).padStart(8, '0').slice(-8);
  return `preview-${prefix}-${code}`;
}

function lineTotal(l: PreviewLine): number {
  return l.quantity * l.unitPrice;
}

/** A table of three, two rounds in, one dish shared — from the venue's own menu. */
export function buildPreviewTable(input: {
  venue: PreviewVenue;
  menu: PreviewMenuItem[];
  placeCode?: string;
  now?: Date;
}): PreviewTable {
  const now = (input.now ?? new Date()).toISOString();
  const menu = input.menu.filter((m) => m.available !== false && m.unitPrice >= 0);
  const table: PreviewTable = {
    venue: input.venue,
    placeCode: input.placeCode?.trim() || 'T1',
    menu: input.menu,
    participants: PEOPLE.map((p) => ({ ...p })),
    transactions: [],
    fulfilments: [],
    payments: [],
    help: [],
    seq: 0,
  };
  if (!menu.length) return table;

  const picks: Array<{ item: PreviewMenuItem; qty: number; who: string | null; shared: boolean }> = [];
  const at = (i: number) => menu[i % menu.length];
  picks.push({ item: at(0), qty: 2, who: PREVIEW_ME, shared: false });
  if (menu.length > 1) picks.push({ item: at(1), qty: 1, who: 'preview-naledi', shared: false });
  if (menu.length > 2) picks.push({ item: at(2), qty: 1, who: 'preview-pieter', shared: false });
  if (menu.length > 3) picks.push({ item: at(3), qty: 1, who: PREVIEW_ME, shared: true });

  const rounds = [picks.slice(0, 2), picks.slice(2)].filter((r) => r.length);
  rounds.forEach((round, i) => {
    const txId = nextId(table, 'tx');
    const lines: PreviewLine[] = round.map((p) => ({
      id: nextId(table, 'line'),
      label: p.item.label,
      quantity: p.qty,
      unitPrice: p.item.unitPrice,
      catalogueItemId: p.item.id,
      participantId: p.who,
      sharedWith: p.shared ? PEOPLE.map((x) => x.id) : [],
      notes: null,
    }));
    table.transactions.push({
      id: txId,
      status: 'open',
      total: round2(lines.reduce((n, l) => n + lineTotal(l), 0)),
      createdAt: now,
      lines,
    });
    table.fulfilments.push({
      id: nextId(table, 'ful'),
      status: i === 0 ? 'delivered' : 'preparing',
      stationId: stationFor(round[0]?.item),
      sessionId: PREVIEW_SESSION_ID,
      createdAt: now,
      lines: lines.map((l) => ({ label: l.label, quantity: l.quantity, transactionLineId: l.id })),
    });
  });
  return table;
}

/** Same shape as GET /sessions/:id, so the guest app cannot tell the difference. */
export function previewSessionView(t: PreviewTable) {
  return {
    id: PREVIEW_SESSION_ID,
    status: 'active',
    correlationId: PREVIEW_SESSION_ID,
    placeCode: t.placeCode,
    venueName: t.venue.venueName,
    menuBrandEnabled: false,
    brandColour: t.venue.brandColour || '#d7a14a',
    logoUrl: t.venue.logoUrl || '',
    menuCoverUrl: '',
    location: t.venue.location || '',
    guestDesign: t.venue.guestDesign,
    paymentsActive: t.venue.paymentsActive,
    pace: { paused: false, holdRounds: false, hiddenCategories: [], busyNotes: [] },
    participants: t.participants.map((p) => ({ ...p, joinedAt: t.transactions[0]?.createdAt ?? null, departedAt: null, equalSplitOptIn: false })),
    transactions: t.transactions.map((tx) => ({ ...tx, lines: tx.lines.map((l) => ({ ...l, sharedWith: [...l.sharedWith] })) })),
    fulfilments: t.fulfilments.map((f) => ({ ...f, lines: f.lines.map((l) => ({ ...l })) })),
    payments: t.payments.map((p) => ({ ...p })),
    assistanceRequests: t.help.filter((h) => h.status === 'open').map((h) => ({ ...h })),
  };
}

export function openTotal(t: PreviewTable): number {
  return round2(
    t.transactions.filter((tx) => tx.status !== 'settled').reduce((n, tx) => n + tx.total, 0),
  );
}

export function paidToward(t: PreviewTable): number {
  return round2(
    t.payments
      .filter((p) => p.status === 'completed')
      .reduce((n, p) => n + Math.max(0, p.amount - p.tipAmount), 0),
  );
}

export function remaining(t: PreviewTable): number {
  return Math.max(0, round2(openTotal(t) - paidToward(t)));
}

/** What "mine" means: my own lines plus my share of shared ones. */
export function mineTotal(t: PreviewTable, me = PREVIEW_ME): number {
  let total = 0;
  for (const tx of t.transactions) {
    if (tx.status === 'settled') continue;
    for (const l of tx.lines) {
      if (l.sharedWith.length) {
        if (l.sharedWith.includes(me)) total += lineTotal(l) / l.sharedWith.length;
      } else if (l.participantId === me) {
        total += lineTotal(l);
      }
    }
  }
  const myPaid = t.payments
    .filter((p) => p.status === 'completed' && p.participantId === me && p.scope === 'mine')
    .reduce((n, p) => n + Math.max(0, p.amount - p.tipAmount), 0);
  return Math.max(0, round2(total - myPaid));
}

export function addOrder(
  t: PreviewTable,
  body: { participantId?: string; lines?: Array<{ catalogueItemId: string; quantity: number; notes?: string; selectionsJson?: unknown }> },
  now = new Date(),
) {
  const byId = new Map(t.menu.map((m) => [m.id, m] as const));
  const lines: PreviewLine[] = [];
  for (const raw of body.lines ?? []) {
    const item = byId.get(raw.catalogueItemId);
    const qty = Math.max(1, Math.floor(Number(raw.quantity) || 1));
    lines.push({
      id: nextId(t, 'line'),
      label: item?.label ?? 'Item',
      quantity: qty,
      unitPrice: item?.unitPrice ?? 0,
      catalogueItemId: raw.catalogueItemId ?? null,
      participantId: body.participantId ?? PREVIEW_ME,
      sharedWith: [],
      selectionsJson: raw.selectionsJson,
      notes: raw.notes ?? null,
    });
  }
  const txId = nextId(t, 'tx');
  const createdAt = now.toISOString();
  t.transactions.push({
    id: txId,
    status: 'open',
    total: round2(lines.reduce((n, l) => n + lineTotal(l), 0)),
    createdAt,
    lines,
  });
  const fulId = nextId(t, 'ful');
  const stationId = stationFor(byId.get(lines[0]?.catalogueItemId ?? ''));
  t.fulfilments.push({
    id: fulId,
    status: 'received',
    stationId,
    sessionId: PREVIEW_SESSION_ID,
    createdAt,
    lines: lines.map((l) => ({ label: l.label, quantity: l.quantity, transactionLineId: l.id })),
  });
  return {
    transactionId: txId,
    fulfilments: [{ fulfilmentId: fulId, stationId, status: 'received' }],
  };
}

function findLine(t: PreviewTable, lineId: string): PreviewLine | undefined {
  for (const tx of t.transactions) {
    const hit = tx.lines.find((l) => l.id === lineId);
    if (hit) return hit;
  }
  return undefined;
}

export function claimLines(t: PreviewTable, body: { participantId?: string | null; lineIds?: string[] }) {
  const undo: Array<{ lineId: string; previousParticipantId: string | null }> = [];
  const done: string[] = [];
  for (const id of body.lineIds ?? []) {
    const line = findLine(t, id);
    if (!line) continue;
    undo.push({ lineId: id, previousParticipantId: line.participantId });
    line.participantId = body.participantId ?? null;
    done.push(id);
  }
  return { ok: true, claimed: done.length, lineIds: done, undo };
}

export function shareLine(t: PreviewTable, body: { lineId?: string; action?: string }, me = PREVIEW_ME) {
  const line = findLine(t, body.lineId ?? '');
  if (!line) return { ok: false, lineId: body.lineId ?? '', sharedWith: [] as string[] };
  if (body.action === 'leave') {
    line.sharedWith = line.sharedWith.filter((p) => p !== me);
    if (line.sharedWith.length === 1) {
      line.participantId = line.sharedWith[0];
      line.sharedWith = [];
    }
  } else {
    const set = new Set(line.sharedWith.length ? line.sharedWith : [line.participantId ?? me]);
    set.add(me);
    line.sharedWith = [...set].filter(Boolean) as string[];
  }
  return { ok: true, lineId: line.id, sharedWith: [...line.sharedWith] };
}

export function pay(
  t: PreviewTable,
  body: { scope?: string; amount?: number; tipAmount?: number; tipPercent?: number; participantId?: string },
) {
  const scope = body.scope === 'mine' || body.scope === 'equal' || body.scope === 'amount' ? body.scope : 'visit';
  const left = remaining(t);
  const people = Math.max(1, t.participants.filter((p) => p.role === 'guest').length);
  let base =
    scope === 'mine'
      ? mineTotal(t, body.participantId ?? PREVIEW_ME)
      : scope === 'equal'
        ? round2(openTotal(t) / people)
        : scope === 'amount'
          ? round2(Number(body.amount) || 0)
          : left;
  base = Math.min(Math.max(0, base), left);
  const tip =
    typeof body.tipAmount === 'number'
      ? round2(Math.max(0, body.tipAmount))
      : typeof body.tipPercent === 'number'
        ? round2((base * Math.max(0, body.tipPercent)) / 100)
        : 0;
  const payment: PreviewPayment = {
    id: nextId(t, 'pay'),
    status: 'completed',
    amount: round2(base + tip),
    tipAmount: tip,
    scope,
    participantId: body.participantId ?? PREVIEW_ME,
  };
  t.payments.push(payment);
  if (remaining(t) <= 0) {
    for (const tx of t.transactions) tx.status = 'settled';
  }
  return { paymentId: payment.id, status: 'pending', reference: payment.id };
}

export function askForHelp(t: PreviewTable, body: { kind?: string; message?: string }, now = new Date()) {
  const help: PreviewHelp = {
    id: nextId(t, 'help'),
    kind: body.kind === 'manager' ? 'manager' : 'service',
    message: body.message,
    status: 'open',
    sessionId: PREVIEW_SESSION_ID,
    createdAt: now.toISOString(),
  };
  t.help.push(help);
  return { ...help };
}
