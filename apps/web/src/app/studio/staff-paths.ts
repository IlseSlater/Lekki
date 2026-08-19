/** Staff Experience routes — ADR-004. Never nest floor work in Studio. */

import { getExperience, type ExperienceTypeId } from './experience-registry';

export const STAFF_LOGIN = '/staff';
export const STAFF_SERVICE = '/staff/service';

export function staffStationPath(stationId: string): string {
  const id = stationId.replace(/^station-/, '');
  return `/staff/station/${id}`;
}

export function staffHomeForRole(role: string): string {
  switch (role) {
    case 'kitchen':
      return staffStationPath('kitchen');
    case 'bar':
      return staffStationPath('bar');
    case 'waiter':
      return STAFF_SERVICE;
    case 'counter':
      return staffStationPath('counter');
    case 'staff':
      return STAFF_SERVICE;
    default:
      return STAFF_LOGIN;
  }
}

export function staffMonitorPath(workPath: string): string {
  const sep = workPath.includes('?') ? '&' : '?';
  return `${workPath}${sep}monitor=1`;
}

export type StaffExperienceOption = {
  id: string;
  label: string;
  blurb: string;
};

/** Experience Assignment — role first, then permissions refine. */
export const STAFF_EXPERIENCES: readonly StaffExperienceOption[] = [
  { id: 'kitchen', label: 'Kitchen', blurb: 'Prep · ready' },
  { id: 'bar', label: 'Bar', blurb: 'Pour · ready' },
  { id: 'waiter', label: 'Waiter', blurb: 'Tables · serve · help' },
  { id: 'counter', label: 'Counter', blurb: 'Make · collect' },
  { id: 'staff', label: 'Floor lead', blurb: 'All stations' },
] as const;

/** Pack place nouns — Continuity with Operate / Guest (Pickup · Rooms · …). */
export function staffExperiencesForType(
  typeId: ExperienceTypeId | string = 'restaurant',
): StaffExperienceOption[] {
  const def = getExperience(typeId as ExperienceTypeId);
  const places = def?.defaults.placeLabel ?? 'Tables';
  return STAFF_EXPERIENCES.map((exp) => {
    if (exp.id === 'waiter') {
      return { ...exp, blurb: `${places} · serve · help` };
    }
    return { ...exp };
  });
}

export const PERMISSIONS_BY_EXPERIENCE: Record<string, Array<{ id: string; label: string }>> = {
  kitchen: [
    { id: 'fulfilment.read', label: 'View queue' },
    { id: 'fulfilment.update', label: 'Mark preparing · ready' },
    { id: 'staff.service', label: 'Hand off to floor' },
  ],
  bar: [
    { id: 'fulfilment.read', label: 'View queue' },
    { id: 'fulfilment.update', label: 'Mark preparing · ready' },
    { id: 'staff.service', label: 'Hand off to floor' },
  ],
  waiter: [
    { id: 'session.read', label: 'View own tables' },
    { id: 'fulfilment.read', label: 'See ready tickets' },
    { id: 'fulfilment.update', label: 'Mark served' },
    { id: 'payment.complete', label: 'Take payment' },
    { id: 'staff.service', label: 'Request assistance · transfer' },
    { id: 'session.close', label: 'Clear table' },
  ],
  counter: [
    { id: 'fulfilment.read', label: 'View queue' },
    { id: 'fulfilment.update', label: 'Mark ready · collect' },
    { id: 'staff.service', label: 'Serve guests' },
  ],
  staff: [
    { id: 'session.read', label: 'View all tables' },
    { id: 'session.close', label: 'Clear tables' },
    { id: 'fulfilment.read', label: 'View queues' },
    { id: 'fulfilment.update', label: 'Advance tickets' },
    { id: 'payment.complete', label: 'Take payment' },
    { id: 'staff.service', label: 'Floor lead' },
  ],
};

/** Permission labels with pack place nouns. */
export function permissionsForExperience(
  role: string,
  typeId: ExperienceTypeId | string = 'restaurant',
): Array<{ id: string; label: string }> {
  const base = PERMISSIONS_BY_EXPERIENCE[role] ?? PERMISSIONS_BY_EXPERIENCE['staff'];
  const def = getExperience(typeId as ExperienceTypeId);
  const place = (def?.terminology.place ?? 'Table').toLowerCase();
  const places = (def?.defaults.placeLabel ?? 'Tables').toLowerCase();
  return base.map((p) => {
    if (p.id === 'session.read' && role === 'waiter') {
      return { ...p, label: `View own ${places}` };
    }
    if (p.id === 'session.read' && role === 'staff') {
      return { ...p, label: `View all ${places}` };
    }
    if (p.id === 'session.close' && role === 'waiter') {
      return { ...p, label: `Clear ${place}` };
    }
    if (p.id === 'session.close' && role === 'staff') {
      return { ...p, label: `Clear ${places}` };
    }
    return { ...p };
  });
}

export function defaultPermissionsForRole(role: string): string[] {
  return (PERMISSIONS_BY_EXPERIENCE[role] ?? PERMISSIONS_BY_EXPERIENCE['staff']).map((p) => p.id);
}
