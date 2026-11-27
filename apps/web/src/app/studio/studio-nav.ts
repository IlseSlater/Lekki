/**
 * The Studio rail — organised around what the guest app does, not around setup.
 *
 * Home · What guests see (every page shows the real guest app) · Run the floor · The business.
 * Labels are hospitality words: never integration, connector, pack or admin.
 */

import { ADMIN_PERMISSION, STUDIO_PERMISSIONS as SP, grants } from './studio-roles';

export type StudioNavMode = 'setup' | 'operate' | 'grow' | 'team';

export type StudioNavItem = {
  label: string;
  path: string;
  /** Paths that light this item: the path and anything under it (exact for Home). */
  matches: string[];
  exact?: boolean;
  mode: StudioNavMode;
  /** One SVG path string (stroke icon, 24 grid). */
  icon: string;
  /** The Studio permission that opens this page (see studio-roles.ts). */
  need: string;
};

export type StudioNavGroup = {
  /** Null for Home, which sits alone at the top. */
  label: string | null;
  items: StudioNavItem[];
};

export const STUDIO_NAV_GROUPS: StudioNavGroup[] = [
  {
    label: null,
    items: [
      {
        label: 'Home',
        path: '/studio',
        matches: ['/studio'],
        exact: true,
        mode: 'setup',
        need: SP.reports,
        icon: 'M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
      },
    ],
  },
  {
    label: 'What guests see',
    items: [
      {
        label: 'Your place',
        path: '/studio/place',
        matches: ['/studio/place', '/studio/setup/identity'],
        mode: 'setup',
        need: ADMIN_PERMISSION,
        icon: 'M3 9l2-5h14l2 5M3 9h18M3 9v11h18V9M9 20v-6h6v6',
      },
      {
        label: 'Menu',
        path: '/studio/menu',
        matches: ['/studio/menu', '/studio/setup/experience'],
        mode: 'setup',
        need: SP.menu,
        icon: 'M5 6h14M5 12h14M5 18h9',
      },
      {
        label: 'Tables & QR',
        path: '/studio/tables',
        matches: ['/studio/tables', '/studio/setup/places', '/studio/setup/golive'],
        mode: 'setup',
        need: ADMIN_PERMISSION,
        icon: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z',
      },
      {
        label: 'At the table',
        path: '/studio/at-the-table',
        matches: ['/studio/at-the-table'],
        mode: 'setup',
        need: ADMIN_PERMISSION,
        icon: 'M4 11h16M6 11V7a6 6 0 0 1 12 0v4M5 11l1 9h12l1-9',
      },
    ],
  },
  {
    label: 'Run the floor',
    items: [
      {
        label: 'Operate',
        path: '/studio/operate',
        matches: ['/studio/operate'],
        mode: 'operate',
        need: SP.hours,
        icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11',
      },
      {
        label: 'Team',
        path: '/studio/team',
        matches: ['/studio/team'],
        mode: 'team',
        need: SP.team,
        icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75',
      },
    ],
  },
  {
    label: 'The business',
    items: [
      {
        label: 'Payments',
        path: '/studio/payments',
        matches: ['/studio/payments', '/studio/setup/payments'],
        mode: 'setup',
        need: ADMIN_PERMISSION,
        icon: 'M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2zM2 10h20',
      },
      {
        label: 'Grow',
        path: '/studio/grow',
        matches: ['/studio/grow'],
        mode: 'grow',
        need: SP.reports,
        icon: 'M3 17l6-6 4 4 7-7M14 8h6v6',
      },
      {
        label: 'Connections',
        path: '/studio/connections',
        matches: ['/studio/connections'],
        mode: 'setup',
        need: ADMIN_PERMISSION,
        icon: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
      },
    ],
  },
];

export const STUDIO_NAV_ITEMS: StudioNavItem[] = STUDIO_NAV_GROUPS.flatMap((g) => g.items);

export function navItemActive(item: StudioNavItem, path: string): boolean {
  const p = path.split(/[?#]/)[0].replace(/(.)\/+$/, '$1');
  return item.matches.some((m) => (item.exact ? p === m : p === m || p.startsWith(m + '/')));
}

/** The one nav item a Studio URL belongs to (the most specific match). */
export function activeNavItem(path: string): StudioNavItem | undefined {
  return STUDIO_NAV_ITEMS.filter((i) => navItemActive(i, path)).sort(
    (a, b) =>
      Math.max(...b.matches.map((m) => m.length)) - Math.max(...a.matches.map((m) => m.length)),
  )[0];
}

/** The rail this person sees: only pages their Studio role opens; empty groups drop out. */
export function navGroupsFor(permissions: readonly string[] | null | undefined): StudioNavGroup[] {
  return STUDIO_NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => grants(permissions, i.need)),
  })).filter((g) => g.items.length);
}

/**
 * May this person open this Studio URL? The guided first run and creating a place are Admin's.
 * Pages outside the rail (welcome) stay open; the server still checks every call.
 */
export function studioPathAllowed(permissions: readonly string[] | null | undefined, path: string): boolean {
  const p = path.split(/[?#]/)[0];
  if (p.startsWith('/studio/setup') || p.startsWith('/studio/create')) {
    return grants(permissions, ADMIN_PERMISSION);
  }
  const item = activeNavItem(p);
  return !item || grants(permissions, item.need);
}

/** Where someone lands when a page isn't theirs: their first page, or the floor if none. */
export function studioLandingFor(permissions: readonly string[] | null | undefined): string {
  return navGroupsFor(permissions)[0]?.items[0]?.path ?? '/staff';
}
