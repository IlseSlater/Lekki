import { STUDIO_PERMISSIONS, grants } from './studio-roles';

/**
 * Who runs the floor: a Manager or an Admin (see studio-roles.ts). They may cancel or delay
 * any order, move tables and take a table from someone else.
 * A place always keeps at least one Admin.
 */
export const MANAGE_PERMISSION = 'organisation.manage';

export function canManage(permissions: readonly string[] | null | undefined): boolean {
  return grants(permissions, STUDIO_PERMISSIONS.team);
}

export function isAdmin(permissions: readonly string[] | null | undefined): boolean {
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

/** True when applying this change would leave the place with no Admin. */
export function wouldLeaveNoManager(
  members: readonly StaffAdminRow[],
  change: { staffId: string; nextPermissions: readonly string[] },
): boolean {
  const target = members.find((m) => m.id === change.staffId);
  if (!target || !isAdmin(target.permissions)) return false;
  if (isAdmin(change.nextPermissions)) return false;
  return !members.some((m) => m.id !== change.staffId && isAdmin(m.permissions));
}
