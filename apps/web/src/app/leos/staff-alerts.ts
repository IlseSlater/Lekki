export type AlertsStatus = 'unsupported' | 'unconfigured' | 'blocked' | 'off' | 'on';

export interface AlertsAdvice {
  /** One calm line for the waiter. Empty when there is nothing to say. */
  line: string;
  /** Show the one button that turns alerts on. */
  canEnable: boolean;
}

/**
 * What the waiter sees about ready alerts. iPhone alerts need the site on the Home Screen,
 * so the line says that first. Guests never see any of this.
 */
export function alertsAdvice(
  status: AlertsStatus,
  device: { ios: boolean; standalone: boolean },
): AlertsAdvice {
  if (status === 'on') return { line: 'You’ll hear when food is ready.', canEnable: false };
  if (status === 'unconfigured') return { line: '', canEnable: false };
  if (device.ios && !device.standalone) {
    return {
      line: 'Add Lekki to your Home Screen to hear when food is ready.',
      canEnable: false,
    };
  }
  if (status === 'unsupported') return { line: '', canEnable: false };
  if (status === 'blocked') {
    return {
      line: 'Alerts are switched off for this site in your phone settings.',
      canEnable: false,
    };
  }
  return { line: 'Hear when food is ready, even with the screen off.', canEnable: true };
}

export function isIosUserAgent(userAgent: string): boolean {
  return /iPad|iPhone|iPod/.test(userAgent);
}

/**
 * Help for a table goes to that table's waiter. Tables nobody has yet reach everyone,
 * and managers see all of it.
 */
export function helpVisibleTo(
  tableWaiterId: string | null | undefined,
  staffId: string,
  isManager: boolean,
): boolean {
  return !tableWaiterId || tableWaiterId === staffId || isManager;
}
