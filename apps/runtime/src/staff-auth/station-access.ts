/**
 * Platform station authorization — table-driven, fail closed.
 * Pack nouns live in the table (supplied by the Pack), never in id substrings.
 */

export type StationAccessTable = {
  stations: Record<string, readonly string[]>;
  adminRoles: readonly string[];
  deliverOnlyRoles: readonly string[];
  roleAliases: Record<string, string>;
};

export function venueStationId(venueId: string, stationId: string): string {
  return `${venueId.trim()}::${stationId.trim()}`;
}

/** Resolve a known station key, or null if the id is not in the table. */
export function resolveStationKey(input: {
  stationId: string;
  venueId?: string;
  table: StationAccessTable;
}): string | null {
  const bare = (input.stationId || '').trim();
  if (!bare) return null;
  const venue = input.venueId?.trim();
  if (venue) {
    const namespaced = venueStationId(venue, bare);
    if (input.table.stations[namespaced]) return namespaced;
  }
  if (input.table.stations[bare]) return bare;
  return null;
}

export function canAccessStation(input: {
  role: string;
  stationId: string;
  venueId?: string;
  table: StationAccessTable;
}): boolean {
  const role = (input.role || '').trim();
  if (!role) return false;
  if (input.table.adminRoles.includes(role)) return true;

  const key = resolveStationKey(input);
  if (!key) return false; // unknown → fail closed

  return input.table.stations[key]!.includes(role);
}

/** Primary operate broadcast role for a station, or null if unknown (fail closed). */
export function operateRoleForStation(input: {
  stationId: string | undefined;
  venueId?: string;
  table: StationAccessTable;
}): string | null {
  if (!input.stationId?.trim()) return null;
  const key = resolveStationKey({
    stationId: input.stationId,
    venueId: input.venueId,
    table: input.table,
  });
  if (!key) return null;
  const roles = input.table.stations[key]!.filter(
    (r) => !input.table.adminRoles.includes(r),
  );
  return roles[0] ?? null;
}

export function isDeliverOnlyRole(
  role: string,
  table: StationAccessTable,
): boolean {
  return table.deliverOnlyRoles.includes((role || '').trim());
}
