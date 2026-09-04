import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import {
  clearPinFailures,
  emptyPinAttemptState,
  isPinLocked,
  recordPinFailure,
  type PinAttemptState,
} from './pin-login-lockout';

/**
 * In-memory staff login attempt tracker (per email + per IP).
 * Survives for the process lifetime — enough to stop wifi brute-force.
 */
@Injectable()
export class PinLoginGuardService {
  private readonly logger = new Logger(PinLoginGuardService.name);
  private readonly byKey = new Map<string, PinAttemptState>();

  private key(kind: 'email' | 'ip', value: string): string {
    return `${kind}:${value.trim().toLowerCase()}`;
  }

  assertNotLocked(input: {
    email: string;
    ip: string;
    correlationId?: string;
  }): void {
    const now = Date.now();
    for (const [kind, value] of [
      ['email', input.email],
      ['ip', input.ip],
    ] as const) {
      const state = this.byKey.get(this.key(kind, value)) ?? emptyPinAttemptState();
      if (isPinLocked(state, now)) {
        this.logger.warn(
          `staff login locked kind=${kind} correlationId=${input.correlationId ?? 'none'}`,
        );
        throw new HttpException(
          'Too many failed sign-in attempts — try again later',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }
  }

  recordFailure(input: {
    email: string;
    ip: string;
    correlationId?: string;
  }): void {
    const now = Date.now();
    for (const [kind, value] of [
      ['email', input.email],
      ['ip', input.ip],
    ] as const) {
      const k = this.key(kind, value);
      const next = recordPinFailure(
        this.byKey.get(k) ?? emptyPinAttemptState(),
        now,
      );
      this.byKey.set(k, next);
      this.logger.warn(
        `staff login failed kind=${kind} failures=${next.failures} correlationId=${input.correlationId ?? 'none'}`,
      );
    }
  }

  recordSuccess(input: { email: string; ip: string }): void {
    this.byKey.set(this.key('email', input.email), clearPinFailures());
    this.byKey.set(this.key('ip', input.ip), clearPinFailures());
  }
}
