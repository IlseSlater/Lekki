import type { ExperienceTypeId } from './experience-registry';
import { staffMonitorPath, staffStationPath, STAFF_SERVICE } from './staff-paths';

export type OperateDoor = {
  id: string;
  label: string;
  /** Human role from restaurant app mapping */
  role: 'kitchen' | 'bar' | 'counter' | 'floor' | 'staff';
  /** Staff Experience work path */
  path: string;
  /** Studio Operations Overview — open Staff Experience in monitor mode */
  monitorPath: string;
  apiId?: string;
  blurb: string;
};

function door(
  partial: Omit<OperateDoor, 'monitorPath'> & { monitorPath?: string },
): OperateDoor {
  return {
    ...partial,
    monitorPath: partial.monitorPath ?? staffMonitorPath(partial.path),
  };
}

/** Station / floor doors — Staff Experience paths (ADR-004). */
export function operateDoorsFor(typeId: ExperienceTypeId | string): OperateDoor[] {
  switch (typeId) {
    case 'cafe':
      return [
        door({
          id: 'counter',
          label: 'Counter',
          role: 'counter',
          path: staffStationPath('counter'),
          apiId: 'station-counter',
          blurb: 'Make · ready · collect',
        }),
        door({
          id: 'floor',
          label: 'Floor',
          role: 'floor',
          path: STAFF_SERVICE,
          blurb: 'Ready to serve · help',
        }),
      ];
    case 'restaurant':
      return [
        door({
          id: 'kitchen',
          label: 'Kitchen',
          role: 'kitchen',
          path: staffStationPath('kitchen'),
          apiId: 'station-kitchen',
          blurb: 'Prep · ready',
        }),
        door({
          id: 'bar',
          label: 'Bar',
          role: 'bar',
          path: staffStationPath('bar'),
          apiId: 'station-bar',
          blurb: 'Pour · ready',
        }),
        door({
          id: 'floor',
          label: 'Waiter',
          role: 'floor',
          path: STAFF_SERVICE,
          blurb: 'Serve · help · clear',
        }),
      ];
    case 'hotel':
      return [
        door({
          id: 'room-service',
          label: 'Room service',
          role: 'kitchen',
          path: staffStationPath('room-service'),
          apiId: 'station-room-service',
          blurb: 'Prep · deliver',
        }),
        door({
          id: 'floor',
          label: 'Floor',
          role: 'floor',
          path: STAFF_SERVICE,
          blurb: 'Assist · clear',
        }),
      ];
    default: {
      const primary = primaryStation(typeId);
      return [
        door({ ...primary, role: 'kitchen' as const, blurb: 'Station queue' }),
        door({
          id: 'floor',
          label: 'Floor',
          role: 'floor',
          path: STAFF_SERVICE,
          blurb: 'Assist · clear',
        }),
      ];
    }
  }
}

export function primaryStation(typeId: ExperienceTypeId | string): OperateDoor {
  const map: Record<string, OperateDoor> = {
    restaurant: door({
      id: 'kitchen',
      label: 'Kitchen',
      role: 'kitchen',
      path: staffStationPath('kitchen'),
      apiId: 'station-kitchen',
      blurb: 'Prep · ready',
    }),
    cafe: door({
      id: 'counter',
      label: 'Counter',
      role: 'counter',
      path: staffStationPath('counter'),
      apiId: 'station-counter',
      blurb: 'Make · collect',
    }),
    hotel: door({
      id: 'room-service',
      label: 'Room service',
      role: 'kitchen',
      path: staffStationPath('room-service'),
      apiId: 'station-room-service',
      blurb: 'Prep · deliver',
    }),
    festival: door({
      id: 'food-truck',
      label: 'Food truck',
      role: 'kitchen',
      path: staffStationPath('food-truck'),
      apiId: 'station-food-truck',
      blurb: 'Prep · ready',
    }),
    airport: door({
      id: 'gate-cafe',
      label: 'Gate café',
      role: 'counter',
      path: staffStationPath('gate-cafe'),
      apiId: 'station-gate-cafe',
      blurb: 'Make · collect',
    }),
    healthcare: door({
      id: 'clinic-cafe',
      label: 'Clinic café',
      role: 'counter',
      path: staffStationPath('clinic-cafe'),
      apiId: 'station-clinic-cafe',
      blurb: 'Make · collect',
    }),
  };
  return map[typeId] ?? map['restaurant'];
}

export function stationDoors(typeId: ExperienceTypeId | string): OperateDoor[] {
  return operateDoorsFor(typeId).filter((d) => d.apiId);
}
