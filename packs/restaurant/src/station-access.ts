/**
 * Pack-owned station → operate-role grants.
 * Platform never infers role from station id substrings.
 */

export type StationAccessTable = {
  /** Bare or `venueId::stationId` → staff roles allowed to update that station. */
  stations: Record<string, readonly string[]>;
  /** Roles that may act on every station (known or not). */
  adminRoles: readonly string[];
  /** Roles limited to marking fulfilment delivered (serve / handoff). */
  deliverOnlyRoles: readonly string[];
  /** Incoming alias → canonical staff role (e.g. floor → waiter). */
  roleAliases: Record<string, string>;
};

/** Namespace a station id under a venue (Batch 4). */
export function venueStationId(venueId: string, stationId: string): string {
  return `${venueId.trim()}::${stationId.trim()}`;
}

/**
 * Restaurant demo grants — explicit only.
 * `station-cellar-bar` deliberately does NOT list the bar role (substring trap).
 */
export const restaurantStationAccess: StationAccessTable = {
  stations: {
    'station-kitchen': ['kitchen', 'staff'],
    'station-bar': ['bar', 'staff'],
    'station-service': ['waiter', 'staff'],
    'station-counter': ['counter', 'staff'],
    'station-cellar-bar': ['staff'],
  },
  adminRoles: ['staff'],
  deliverOnlyRoles: ['waiter'],
  roleAliases: { floor: 'waiter' },
};

export function normalizeOperateRole(
  raw: string,
  table: StationAccessTable = restaurantStationAccess,
): string | null {
  const trimmed = (raw || '').trim().toLowerCase();
  if (!trimmed) return null;
  const aliased = table.roleAliases[trimmed] ?? trimmed;
  const known = new Set<string>([
    ...Object.values(table.stations).flat(),
    ...table.adminRoles,
    ...table.deliverOnlyRoles,
    ...Object.values(table.roleAliases),
  ]);
  return known.has(aliased) ? aliased : null;
}

export function isOperateRoleAllowed(
  staffRole: string,
  requested: string,
  table: StationAccessTable = restaurantStationAccess,
): boolean {
  const staff = normalizeOperateRole(staffRole, table);
  const want = normalizeOperateRole(requested, table);
  if (!staff || !want) return false;
  if (table.adminRoles.includes(staff)) return true;
  return staff === want;
}
