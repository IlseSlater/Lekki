/**
 * Operate pressure signals — Restaurant App SLA / idle pulses.
 * Kitchen/Bar: pending > 10 minutes.
 * Waiter tables: idle ≥ 15 minutes.
 */

export const PENDING_SLA_MINUTES = 10;
export const TABLE_IDLE_PULSE_MINUTES = 15;

export function ageMinutes(fromIsoOrDate: string | Date | undefined | null, now = Date.now()): number {
  if (!fromIsoOrDate) return 0;
  const t = typeof fromIsoOrDate === 'string' ? Date.parse(fromIsoOrDate) : fromIsoOrDate.getTime();
  if (Number.isNaN(t)) return 0;
  return Math.max(0, Math.floor((now - t) / 60000));
}

export function isPendingOverSla(
  status: string,
  createdAt: string | Date | undefined | null,
  now = Date.now(),
): boolean {
  const s = (status || '').toLowerCase();
  if (s !== 'pending' && s !== 'created') return false;
  return ageMinutes(createdAt, now) > PENDING_SLA_MINUTES;
}

export function isTableIdlePulsing(idleMinutes: number): boolean {
  return idleMinutes >= TABLE_IDLE_PULSE_MINUTES;
}

export function ageLabel(minutes: number): string {
  if (minutes <= 0) return 'now';
  return `${minutes}m`;
}
