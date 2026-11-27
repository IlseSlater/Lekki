/**
 * Studio roles, as the web app shows them. Mirrors apps/runtime/src/leos/studio-roles.ts
 * (a runtime test fails if the two drift). The server enforces; this only decides what to show.
 *
 * Each role adds to the one below. Admin is organisation.manage, so existing owners keep everything.
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

/** The words a Team page uses. Lekki's own: plain, about what each person can do. */
export const ROLE_CHOICES: { role: StudioRole; label: string; detail: string }[] = [
  { role: 'none', label: 'No Studio', detail: 'Works the floor only.' },
  { role: 'analyst', label: 'Analyst', detail: 'Sees takings, Grow and guests’ private notes.' },
  { role: 'staff', label: 'Staff', detail: 'Also changes the menu, hours, pause and busy minutes.' },
  { role: 'manager', label: 'Manager', detail: 'Also replies to guests and runs the team, up to Manager.' },
  { role: 'admin', label: 'Admin', detail: 'Everything: your place, payments, the till, and other admins.' },
];

export function grants(permissions: readonly string[] | null | undefined, need: string): boolean {
  const list = permissions ?? [];
  if (list.includes(need)) return true;
  return list.includes(ADMIN_PERMISSION) && ALL_STUDIO.has(need);
}

export function studioRoleOf(permissions: readonly string[] | null | undefined): StudioRole {
  const list = permissions ?? [];
  if (list.includes(ADMIN_PERMISSION)) return 'admin';
  for (const role of ['manager', 'staff', 'analyst'] as const) {
    if (ROLE_PERMISSIONS[role].every((p) => list.includes(p))) return role;
  }
  return 'none';
}

export function withStudioRole(permissions: readonly string[] | null | undefined, role: StudioRole): string[] {
  const floor = (permissions ?? []).filter((p) => !ALL_STUDIO.has(p));
  return [...floor, ...ROLE_PERMISSIONS[role]];
}

const RANK: Record<StudioRole, number> = { none: 0, analyst: 1, staff: 2, manager: 3, admin: 4 };

/** The roles this person may hand out: Admin any; Manager up to Manager; others none. */
export function assignableRoles(caller: readonly string[] | null | undefined): StudioRole[] {
  const mine = studioRoleOf(caller);
  if (mine === 'admin') return ['none', 'analyst', 'staff', 'manager', 'admin'];
  if (!grants(caller, P.team)) return [];
  return (['none', 'analyst', 'staff', 'manager'] as const).filter((r) => RANK[r] <= RANK[mine]);
}

/** A Manager can't change an Admin at all (name, PIN or role). */
export function canEditMember(
  caller: readonly string[] | null | undefined,
  member: readonly string[] | null | undefined,
): boolean {
  if (studioRoleOf(caller) === 'admin') return true;
  if (!grants(caller, P.team)) return false;
  return studioRoleOf(member) !== 'admin';
}
