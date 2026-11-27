/**
 * Who can manage this place. One permission, one switch in Team.
 * A place always keeps at least one person who can manage it.
 */
export const MANAGE_PERMISSION = 'organisation.manage';

export function canManage(permissions: readonly string[] | null | undefined): boolean {
  return !!permissions?.includes(MANAGE_PERMISSION);
}

/** Trimmed, unique, bounded. Anything that is not text is dropped. */
export function normalisePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const out: string[] = [];
  for (const raw of input) {
    if (typeof raw !== 'string') continue;
    const value = raw.trim();
    if (!value || value.length > 64 || out.includes(value)) continue;
    out.push(value);
    if (out.length >= 32) break;
  }
  return out;
}

export interface StaffAdminRow {
  id: string;
  permissions: readonly string[];
}

/** True when applying this change would leave nobody able to manage the place. */
export function wouldLeaveNoManager(
  members: readonly StaffAdminRow[],
  change: { staffId: string; nextPermissions: readonly string[] },
): boolean {
  const target = members.find((m) => m.id === change.staffId);
  if (!target || !canManage(target.permissions)) return false;
  if (canManage(change.nextPermissions)) return false;
  return !members.some((m) => m.id !== change.staffId && canManage(m.permissions));
}
