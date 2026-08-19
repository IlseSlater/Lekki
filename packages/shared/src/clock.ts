export interface Clock {
  now(): Date;
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

export function toIso(clock: Clock): string {
  return clock.now().toISOString();
}
