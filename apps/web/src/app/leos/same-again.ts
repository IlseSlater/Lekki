/**
 * Same again. One tap puts the guest's last round straight back on order.
 * Only plain lines come back (no required choices), only dishes still available today,
 * and prices are today's menu prices.
 */
export interface PastLine {
  catalogueItemId?: string | null;
  label: string;
  quantity: number;
  participantId?: string | null;
  selectionsJson?: unknown;
}

export interface PastTransaction {
  id: string;
  createdAt?: string | null;
  lines: PastLine[];
}

export interface MenuEntry {
  id: string;
  label: string;
  unitPrice: number;
  available?: boolean;
  routingTags: string[];
  imageUrl?: string;
  /** Items that need choices cannot repeat in one tap. */
  needsChoices?: boolean;
}

export interface SameAgainLine {
  catalogueItemId: string;
  label: string;
  quantity: number;
  unitPrice: number;
  routingTags: string[];
  imageUrl?: string;
}

function hasSelections(value: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === 'object') return Object.keys(value as object).length > 0;
  return false;
}

function newestFirst(a: PastTransaction, b: PastTransaction): number {
  const ta = a.createdAt ? Date.parse(a.createdAt) : NaN;
  const tb = b.createdAt ? Date.parse(b.createdAt) : NaN;
  if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) return tb - ta;
  return 0;
}

export function sameAgainLines(
  transactions: readonly PastTransaction[],
  participantId: string | null | undefined,
  menu: readonly MenuEntry[],
  /** True when the table has more than one guest, so lines are attributed. */
  multiGuest: boolean,
): SameAgainLine[] {
  if (!transactions.length) return [];
  const ordered = transactions.length > 1 && transactions.some((t) => t.createdAt)
    ? [...transactions].sort(newestFirst)
    : [...transactions].reverse();

  for (const tx of ordered) {
    const mine = tx.lines.filter(
      (l) => !multiGuest || !participantId || l.participantId === participantId,
    );
    if (!mine.length) continue;
    const byId = new Map<string, SameAgainLine>();
    for (const line of mine) {
      if (!line.catalogueItemId || hasSelections(line.selectionsJson)) continue;
      const entry = menu.find((m) => m.id === line.catalogueItemId);
      if (!entry || entry.available === false || entry.needsChoices) continue;
      const existing = byId.get(entry.id);
      if (existing) existing.quantity += Math.max(1, line.quantity);
      else
        byId.set(entry.id, {
          catalogueItemId: entry.id,
          label: entry.label,
          quantity: Math.max(1, line.quantity),
          unitPrice: entry.unitPrice,
          routingTags: entry.routingTags,
          imageUrl: entry.imageUrl,
        });
    }
    if (byId.size) return [...byId.values()];
    return [];
  }
  return [];
}

/** "2 Cola, Lager" — the words on the button. */
export function sameAgainSummary(lines: readonly SameAgainLine[], max = 3): string {
  const parts = lines.map((l) => (l.quantity > 1 ? `${l.quantity} ${l.label}` : l.label));
  if (parts.length <= max) return parts.join(', ');
  return `${parts.slice(0, max).join(', ')} and ${parts.length - max} more`;
}
