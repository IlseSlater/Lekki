/**
 * Studio roles — four levels, each adding to the one below. Pure rules.
 *
 * Analyst: sees takings, reports and guests' private notes.
 * Staff:   + edits the menu, hours, pause and busy minutes.
 * Manager: + replies to guests, manages the team (never above Manager).
 * Admin:   everything — payments setup, the till, the place itself, and Admins.
 *
 * Admin is the long-standing `organisation.manage` permission, so existing owners keep full access.
 * Floor permissions (session.read, fulfilment.*, staff.service, payment.complete) are separate
 * and left as they are.
 */

export const ADMIN_PERMISSION = 'organisation.manage';

export const STUDIO_PERMISSIONS = {
  reports: 'reports.read',
  feedbackRead: 'feedback.read',
  menu: 'menu.edit',
  hours: 'hours.edit',
  feedbackReply: 'feedback.reply',
  team: 'team.manage',
} as const;

export type StudioRole = 'none' | 'analyst' | 'staff' | 'manager' | 'admin';

export const STUDIO_ROLES: readonly StudioRole[] = ['none', 'analyst', 'staff', 'manager', 'admin'];

const P = STUDIO_PERMISSIONS;
const ANALYST = [P.reports, P.feedbackRead];
const STAFF = [...ANALYST, P.menu, P.hours];
const MANAGER = [...STAFF, P.feedbackReply, P.team];

export const ROLE_PERMISSIONS: Record<StudioRole, readonly string[]> = {
  none: [],
  analyst: ANALYST,
  staff: STAFF,
  manager: MANAGER,
  admin: [ADMIN_PERMISSION],
};

const ALL_STUDIO = new Set<string>([...MANAGER, ADMIN_PERMISSION]);

/**
 * Admin holds every Studio permission; anyone else only what they were given.
 * Floor permissions (staff.service, payment.complete…) are never implied: an owner who
 * takes payments on the floor is given that like anyone else.
 */
export function grants(permissions: readonly string[] | null | undefined, need: string): boolean {
  const list = permissions ?? [];
  if (list.includes(need)) return true;
  return list.includes(ADMIN_PERMISSION) && ALL_STUDIO.has(need);
}

/** The highest role whose permissions someone holds in full. */
export function studioRoleOf(permissions: readonly string[] | null | undefined): StudioRole {
  const list = permissions ?? [];
  if (list.includes(ADMIN_PERMISSION)) return 'admin';
  for (const role of ['manager', 'staff', 'analyst'] as const) {
    if (ROLE_PERMISSIONS[role].every((p) => list.includes(p))) return role;
  }
  return 'none';
}

/** Swap someone's Studio role; their floor permissions stay exactly as they were. */
export function withStudioRole(permissions: readonly string[] | null | undefined, role: StudioRole): string[] {
  const floor = (permissions ?? []).filter((p) => !ALL_STUDIO.has(p));
  return [...floor, ...ROLE_PERMISSIONS[role]];
}

const RANK: Record<StudioRole, number> = { none: 0, analyst: 1, staff: 2, manager: 3, admin: 4 };

/**
 * May this person give someone this set of permissions?
 * Admins may do anything. Managers may set None up to Manager, and never touch an Admin.
 * Nobody else manages the team.
 */
export function canAssign(
  caller: readonly string[] | null | undefined,
  target: { before: readonly string[] | null | undefined; after: readonly string[] },
): { ok: true } | { ok: false; reason: string } {
  const callerRole = studioRoleOf(caller);
  if (callerRole === 'admin') return { ok: true };
  if (!grants(caller, P.team)) return { ok: false, reason: 'Only a manager or admin can change the team.' };
  if (studioRoleOf(target.before) === 'admin') {
    return { ok: false, reason: 'Only an admin can change an admin.' };
  }
  const nextRole = studioRoleOf(target.after);
  if (RANK[nextRole] > RANK[callerRole]) {
    return { ok: false, reason: 'You can give people up to your own role.' };
  }
  // Adding stray Studio permissions outside a role is not a back door.
  // (Ones someone already had are left alone, so their name or PIN can still change.)
  const before = target.before ?? [];
  const loose = target.after.filter(
    (p) => ALL_STUDIO.has(p) && !ROLE_PERMISSIONS[nextRole].includes(p) && !before.includes(p),
  );
  if (loose.length) return { ok: false, reason: 'Pick one of the four roles.' };
  return { ok: true };
}
