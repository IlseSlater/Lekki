/**
 * Studio Team confidence — human answers, not permission strings.
 * Who can do what · which device is in use · safe to end a login.
 */

export const TEAM_DEVICE_IN_USE_MS = 10 * 60 * 1000;

export type TeamPermissionGroupId = 'see' | 'act' | 'finish';

export type TeamPermissionGroup = {
  id: TeamPermissionGroupId;
  title: string;
  why: string;
  permissionIds: string[];
};

const GROUP_ORDER: TeamPermissionGroup[] = [
  {
    id: 'see',
    title: 'They can see',
    why: 'Queues, places, and what’s ready.',
    permissionIds: ['session.read', 'fulfilment.read'],
  },
  {
    id: 'act',
    title: 'They can act',
    why: 'Prep, serve, pay, and ask for help.',
    permissionIds: ['fulfilment.update', 'payment.complete', 'staff.service'],
  },
  {
    id: 'finish',
    title: 'They can finish',
    why: 'Clear a visit when guests are done.',
    permissionIds: ['session.close'],
  },
];

export function permissionGroupsFor(
  options: Array<{ id: string; label: string }>,
): Array<TeamPermissionGroup & { items: Array<{ id: string; label: string }> }> {
  const byId = new Map(options.map((p) => [p.id, p]));
  return GROUP_ORDER.map((g) => ({
    ...g,
    items: g.permissionIds.map((id) => byId.get(id)).filter((p): p is { id: string; label: string } => !!p),
  })).filter((g) => g.items.length > 0);
}

export function canDoSummary(experienceLabel: string, permissionIds: string[]): string {
  const ids = new Set(permissionIds);
  const acts: string[] = [];
  if (ids.has('fulfilment.update')) acts.push('mark ready');
  if (ids.has('payment.complete')) acts.push('take payment');
  if (ids.has('staff.service')) acts.push('help the floor');
  if (ids.has('session.close')) acts.push('clear visits');
  if (!acts.length && (ids.has('session.read') || ids.has('fulfilment.read'))) acts.push('see the floor');
  const tail = acts.slice(0, 2).join(' · ');
  return tail ? `${experienceLabel} · ${tail}` : experienceLabel;
}

export function lastSeenPhrase(iso: string | null | undefined, now = Date.now()): string {
  if (!iso) return 'Not seen yet';
  const then = Date.parse(iso);
  if (!Number.isFinite(then)) return 'Not seen yet';
  const min = Math.round((now - then) / 60000);
  if (min < 2) return 'Last seen just now';
  if (min < 60) return `Last seen ${min} min ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `Last seen ${hr}h ago`;
  return `Last seen ${Math.round(hr / 24)}d ago`;
}

export type TeamDeviceTrust = {
  state: 'In use' | 'Idle';
  lastSeen: string;
  assigned: string;
};

export function deviceTrust(
  device: {
    label: string;
    lastStaffName?: string | null;
    lastSeenAt?: string | null;
    inUse?: boolean;
  },
  activeDeviceLabels: Set<string>,
  now = Date.now(),
): TeamDeviceTrust {
  const seen = Date.parse(device.lastSeenAt || '');
  const recentlySeen = Number.isFinite(seen) && now - seen < TEAM_DEVICE_IN_USE_MS;
  const inUse =
    device.inUse === true ||
    activeDeviceLabels.has(device.label) ||
    (!!device.lastStaffName && recentlySeen);
  return {
    state: inUse ? 'In use' : 'Idle',
    lastSeen: lastSeenPhrase(device.lastSeenAt, now),
    assigned: 'Assigned here',
  };
}

export function sessionOnDevice(
  staffId: string,
  sessions: Array<{ staffId: string; active: boolean; deviceLabel?: string | null }>,
): string | null {
  const hit = sessions.find((s) => s.active && s.staffId === staffId && s.deviceLabel);
  return hit?.deviceLabel || null;
}

export function sessionRevokeCopy(session: {
  active: boolean;
  deviceLabel?: string | null;
  displayName: string;
}): { action: string; consequence: string; after: string } {
  if (!session.active) {
    return {
      action: 'Already ended',
      consequence: 'This login is no longer in use.',
      after: 'Safe to reassign.',
    };
  }
  const device = (session.deviceLabel || '').trim();
  if (device) {
    return {
      action: 'End now',
      consequence: `Ends access on ${device}.`,
      after: 'Safe to reassign.',
    };
  }
  return {
    action: 'End now',
    consequence: `Ends ${session.displayName}’s login.`,
    after: 'They’ll sign in again when needed.',
  };
}
