/** Go-live gate — venue, places, priced menu, staff station. Payments never block. */

export type GateConditionId = 'venue' | 'places' | 'menu' | 'orders';

export type GateCondition = {
  id: GateConditionId;
  label: string;
  value: string;
  ok: boolean;
  required: true;
};

export type GateExtra = {
  id: string;
  label: string;
  value: string;
  ok: boolean;
  required: false;
};

const KNOWN_IDS = new Set<GateConditionId>(['venue', 'places', 'menu', 'orders']);

export function canGoLive(rows: Array<GateCondition | GateExtra>): {
  ok: boolean;
  blocking: GateConditionId[];
} {
  if (!rows.length) return { ok: false, blocking: [] };
  const blocking: GateConditionId[] = [];
  let ok = true;
  for (const row of rows) {
    if (!row.required) continue;
    if (row.ok) continue;
    ok = false;
    if (KNOWN_IDS.has(row.id as GateConditionId)) {
      blocking.push(row.id as GateConditionId);
    }
  }
  return { ok, blocking };
}

/** A staff row counts when it has a station home — not floor / service only. */
export function staffHasStation(member: { role?: string | null; homePath?: string | null }): boolean {
  const path = (member.homePath ?? '').toLowerCase();
  if (path.includes('/station/')) return true;
  const role = (member.role ?? '').toLowerCase();
  return role === 'kitchen' || role === 'bar' || role === 'counter';
}

export function gateLabel(id: GateConditionId): string {
  switch (id) {
    case 'venue':
      return 'Your venue';
    case 'places':
      return 'Where guests join';
    case 'menu':
      return 'Your menu';
    case 'orders':
      return 'Who takes orders';
  }
}
