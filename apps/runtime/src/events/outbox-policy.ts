/**
 * Outbox durability policy — pure functions, no Nest / Prisma.
 * Poison = envelope fails validation (dead-letter attempt 1).
 * Anything thrown during publish is transient (retry with backoff).
 */

export const OUTBOX_MAX_ATTEMPTS = 12;
export const OUTBOX_LAG_BUDGET_SECONDS = 60;
export const OUTBOX_BACKOFF_CAP_SECONDS = 300;

export type EnvelopeValidation =
  | { ok: true }
  | { ok: false; reason: string };

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/** Rejects malformed outbox bodies before they reach the bus. */
export function validateEnvelope(raw: unknown): EnvelopeValidation {
  if (!isPlainObject(raw)) {
    return { ok: false, reason: 'envelope is not a plain object' };
  }
  if (!nonBlankString(raw.eventId)) {
    return { ok: false, reason: 'eventId' };
  }
  if (!nonBlankString(raw.eventName)) {
    return { ok: false, reason: 'eventName' };
  }
  if (!nonBlankString(raw.organisationId)) {
    return { ok: false, reason: 'organisationId' };
  }
  if (!isPlainObject(raw.payload)) {
    return { ok: false, reason: 'payload' };
  }
  if (
    typeof raw.occurredAt !== 'string' ||
    Number.isNaN(Date.parse(raw.occurredAt))
  ) {
    return { ok: false, reason: 'occurredAt' };
  }
  return { ok: true };
}

/**
 * Exponential backoff with optional jitter.
 * Delay = min(2 ** attempts, 300) seconds, jittered ±20% when random is supplied.
 * `attempts` is the count *before* this failure is recorded.
 */
export function nextRetry(input: {
  attempts: number;
  now: Date;
  random?: () => number;
}): { attempts: number; nextRetryAt: Date } {
  const attempts = input.attempts + 1;
  const baseSeconds = Math.min(2 ** input.attempts, OUTBOX_BACKOFF_CAP_SECONDS);
  const random = input.random ?? Math.random;
  const jitter = 0.8 + random() * 0.4; // 0.8 .. 1.2
  const delayMs = Math.round(baseSeconds * 1000 * jitter);
  return {
    attempts,
    nextRetryAt: new Date(input.now.getTime() + delayMs),
  };
}

export function shouldDeadLetter(input: {
  attempts: number;
  maxAttempts: number;
}): boolean {
  return input.attempts >= input.maxAttempts;
}

export function isDue(input: {
  publishedAt: Date | null | undefined;
  deadLetteredAt: Date | null | undefined;
  nextRetryAt: Date | null | undefined;
  now: Date;
}): boolean {
  if (input.publishedAt) return false;
  if (input.deadLetteredAt) return false;
  if (!input.nextRetryAt) return true;
  return input.nextRetryAt.getTime() <= input.now.getTime();
}

export function outboxHealth(input: {
  oldestPendingAt: Date | null;
  deadLettered: number;
  now: Date;
  lagBudgetSeconds: number;
}): { lagSeconds: number; state: 'ok' | 'degraded' } {
  const lagSeconds = input.oldestPendingAt
    ? Math.max(
        0,
        Math.floor(
          (input.now.getTime() - input.oldestPendingAt.getTime()) / 1000,
        ),
      )
    : 0;
  const degraded =
    lagSeconds > input.lagBudgetSeconds || input.deadLettered > 0;
  return { lagSeconds, state: degraded ? 'degraded' : 'ok' };
}

export function truncateError(message: string, max = 500): string {
  if (message.length <= max) return message;
  return `${message.slice(0, max - 1)}…`;
}
