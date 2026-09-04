import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isDue,
  nextRetry,
  OUTBOX_BACKOFF_CAP_SECONDS,
  OUTBOX_MAX_ATTEMPTS,
  outboxHealth,
  shouldDeadLetter,
  validateEnvelope,
} from './outbox-policy';

const goodEnvelope = {
  eventId: 'evt_1',
  eventName: 'PaymentCompleted',
  organisationId: 'org_1',
  payload: { sessionId: 'ses_1' },
  occurredAt: '2026-09-04T12:00:00.000Z',
};

test('Batch 3: envelope missing eventId is not ok and reason names eventId', () => {
  const result = validateEnvelope({ ...goodEnvelope, eventId: '  ' });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.reason, 'eventId');
});

test('Batch 3: well-formed envelope is ok', () => {
  assert.equal(validateEnvelope(goodEnvelope).ok, true);
});

test('Batch 3: nextRetry backs off — 0→~1s, 3→~8s, 9→capped at 300s', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const noJitter = () => 0.5; // jitter factor 1.0

  const a0 = nextRetry({ attempts: 0, now, random: noJitter });
  assert.equal(a0.attempts, 1);
  assert.equal(a0.nextRetryAt.getTime() - now.getTime(), 1000);

  const a3 = nextRetry({ attempts: 3, now, random: noJitter });
  assert.equal(a3.attempts, 4);
  assert.equal(a3.nextRetryAt.getTime() - now.getTime(), 8000);

  const a9 = nextRetry({ attempts: 9, now, random: noJitter });
  assert.equal(a9.attempts, 10);
  assert.equal(
    a9.nextRetryAt.getTime() - now.getTime(),
    OUTBOX_BACKOFF_CAP_SECONDS * 1000,
  );
});

test('Batch 3: shouldDeadLetter false under max, true at max', () => {
  assert.equal(
    shouldDeadLetter({ attempts: OUTBOX_MAX_ATTEMPTS - 1, maxAttempts: OUTBOX_MAX_ATTEMPTS }),
    false,
  );
  assert.equal(
    shouldDeadLetter({ attempts: OUTBOX_MAX_ATTEMPTS, maxAttempts: OUTBOX_MAX_ATTEMPTS }),
    true,
  );
});

test('Batch 3: isDue false while nextRetryAt is in the future', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  assert.equal(
    isDue({
      publishedAt: null,
      deadLetteredAt: null,
      nextRetryAt: new Date('2026-09-04T12:00:05.000Z'),
      now,
    }),
    false,
  );
});

test('Batch 3: isDue true once nextRetryAt has passed', () => {
  const now = new Date('2026-09-04T12:00:05.000Z');
  assert.equal(
    isDue({
      publishedAt: null,
      deadLetteredAt: null,
      nextRetryAt: new Date('2026-09-04T12:00:00.000Z'),
      now,
    }),
    true,
  );
});

test('Batch 3: isDue false for dead-lettered row even when nextRetryAt passed', () => {
  const now = new Date('2026-09-04T12:00:05.000Z');
  assert.equal(
    isDue({
      publishedAt: null,
      deadLetteredAt: new Date('2026-09-04T11:00:00.000Z'),
      nextRetryAt: new Date('2026-09-04T12:00:00.000Z'),
      now,
    }),
    false,
  );
});

test('Batch 3: outboxHealth degraded when lag exceeds budget', () => {
  const now = new Date('2026-09-04T12:02:00.000Z');
  const health = outboxHealth({
    oldestPendingAt: new Date('2026-09-04T12:00:00.000Z'),
    deadLettered: 0,
    now,
    lagBudgetSeconds: 60,
  });
  assert.equal(health.lagSeconds, 120);
  assert.equal(health.state, 'degraded');
});

test('Batch 3: outboxHealth degraded when deadLettered > 0 with zero lag', () => {
  const now = new Date('2026-09-04T12:00:00.000Z');
  const health = outboxHealth({
    oldestPendingAt: null,
    deadLettered: 1,
    now,
    lagBudgetSeconds: 60,
  });
  assert.equal(health.lagSeconds, 0);
  assert.equal(health.state, 'degraded');
});
