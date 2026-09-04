# Batch 3 — Outbox durability

Verified against the working tree on 4 September 2026.

---

## First, a correction to what I told you last message

I said `PaymentOverpayment` "will sit in the outbox forever" and that the choice
was between dead-lettering it as an unknown type or parking it in a terminal
state. **Both are wrong.** `EventBusService.publish` (`event-bus.service.ts:16`)
is an unconditional fan-out — it does not match on event name, and the single
subscriber (`leos.gateway.ts:37`) broadcasts everything it receives. So
`PaymentOverpayment` publishes cleanly on the next tick and is marked
`publishedAt` like any other message.

The real problem is the opposite of the one I described: it does **not** get
stuck, it does not alarm, and no human is on the other end of it. A `needs_refund`
today is a `logger.error` line and a websocket frame. That is a surfacing
problem, not a queue problem, and it is written down at the bottom as **3b**
rather than folded in here.

Same failure mode as the `.spec.ts` miss earlier in this project — I reasoned
from the column names in the spec instead of reading the bus. Checked this time
before writing the batch.

---

## Batch 3

```
@nestjs-runtime @data-architect @unit-proof

CONTEXT
LEOS Teardown — the outbox publisher has no failure path. One throw takes the
runtime process down; nothing retries, nothing dead-letters, nothing reports.

PROBLEM (verified 4 September)

1. No try/catch anywhere in the loop.
   outbox-publisher.service.ts:45-53 iterates pending messages and awaits
   bus.publish then a prisma update. Neither is guarded. tick() (:25) has
   try/finally but no catch, and onModuleInit fires it as `void this.tick()`
   (:21). A rejection therefore floats. Node is v22 with no
   --unhandled-rejections flag and no process-level handler anywhere in
   apps/runtime/src, so the default mode is `throw`: one bad publish exits
   the runtime.

2. The expiry dependency runs the other way from how I framed it.
   tick() awaits expireAbandoned() (:29) BEFORE publishPending() (:30). So a
   publish failure does not stop the expiry sweep — but an expiry failure stops
   publishing entirely, and either one kills the process. Both directions end in
   the same place; the ordering just changes which symptom you see first.

3. No retry state, so failure is an infinite 1 Hz loop.
   OutboxMessage (schema.prisma) has id, eventName, envelope, publishedAt,
   createdAt — no attempts, no nextRetryAt, no deadLetteredAt, no lastError.
   publishPending orders by createdAt asc, take 50. A message that throws is
   never marked, so it is first in the next batch, and every event queued behind
   it never publishes. Head-of-line block with no exit.

4. No claim, so two instances double-publish.
   findMany then update, no lock (:39-51). EventBusService dedupes by eventId
   (:17) but `seen` is a per-process Set (:10) — it does nothing across
   processes. Today's single instance hides this; the first time you run two,
   every guest gets every event twice.

5. The timer outlives the module.
   onModuleInit sets a setInterval (:21). There is no onModuleDestroy in this
   service. The timer holds the event loop open and keeps ticking through
   shutdown, against a Prisma client that is disconnecting
   (prisma.service.ts:10).

6. /health cannot see any of it.
   health.controller.ts:9-23 reports database up/down and uptime. An outbox that
   stopped publishing an hour ago still returns status: ok.

SITES
apps/runtime/src/events/outbox-publisher.service.ts:20-54
apps/runtime/src/events/outbox.service.ts:13-21
apps/runtime/src/http/health.controller.ts:9-23
apps/runtime/src/main.ts (process-level rejection backstop)
apps/runtime/package.json:10 (test glob)
prisma/schema.prisma (model OutboxMessage)
prisma/migrations/20260904140000_outbox_retry/migration.sql (new)
apps/runtime/src/events/outbox-policy.ts (new, pure)
apps/runtime/src/events/outbox-policy.test.ts (new)

DO

1. Fix the test glob FIRST, before writing any test.
   package.json:10 is currently:
     "test": "node --import tsx --test src/leos/*.test.ts src/staff-auth/*.test.ts"
   A test in src/events/ would silently never run — this is the same defect that
   made me report "zero tests" in the original teardown, still live. Replace with:
     "test": "node --import tsx --test 'src/**/*.test.ts'"
   Quote the glob so node expands it, not the shell. Confirm the count does not
   drop: 55 green before, >=55 after.

2. Write apps/runtime/src/events/outbox-policy.ts — pure, no Nest, no Prisma.
   Same shape as payment-session-cap.ts.

     validateEnvelope(raw: unknown): { ok: true } | { ok: false; reason: string }
       Rejects: missing/blank eventId, missing/blank eventName, missing/blank
       organisationId, payload not a plain object, occurredAt not parseable.
       Reason string names the failing field.

     nextRetry(input: { attempts: number; now: Date }): { attempts, nextRetryAt }
       attempts + 1. Delay = min(2 ** attempts, 300) seconds, jittered +/-20%
       from a caller-supplied random so the test can pin it.

     shouldDeadLetter(input: { attempts: number; maxAttempts: number }): boolean

     isDue(input: { publishedAt, deadLetteredAt, nextRetryAt, now }): boolean

     outboxHealth(input: { oldestPendingAt: Date | null; deadLettered: number;
                           now: Date; lagBudgetSeconds: number })
       : { lagSeconds: number; state: 'ok' | 'degraded' }

3. Write apps/runtime/src/events/outbox-policy.test.ts first and watch it fail.
   Minimum cases:
   - an envelope missing eventId is not ok, and the reason names eventId
   - a well-formed envelope is ok
   - nextRetry backs off: attempts 0 -> ~1s, 3 -> ~8s, 9 -> capped at 300s
   - shouldDeadLetter is false at attempts < max, true at max
   - isDue is false while nextRetryAt is in the future, true once it passes
   - isDue is false for a dead-lettered row even when nextRetryAt has passed
   - outboxHealth is degraded when lag exceeds budget, and degraded when
     deadLettered > 0 with zero lag

4. Migration 20260904140000_outbox_retry:
     ALTER TABLE "OutboxMessage"
       ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0,
       ADD COLUMN "nextRetryAt" TIMESTAMP(3),
       ADD COLUMN "deadLetteredAt" TIMESTAMP(3),
       ADD COLUMN "lastError" TEXT;
     CREATE INDEX "OutboxMessage_due_idx" ON "OutboxMessage" ("createdAt")
       WHERE "publishedAt" IS NULL AND "deadLetteredAt" IS NULL;
   Mirror the columns into schema.prisma.

5. Rewrite publishPending as claim -> validate -> publish -> mark, per message,
   each in its own transaction:

     const rows = await tx.$queryRaw`
       SELECT * FROM "OutboxMessage"
       WHERE "publishedAt" IS NULL
         AND "deadLetteredAt" IS NULL
         AND ("nextRetryAt" IS NULL OR "nextRetryAt" <= ${now})
       ORDER BY "createdAt" ASC
       LIMIT 20
       FOR UPDATE SKIP LOCKED`;

   Then for each row:
   - validateEnvelope fails -> set deadLetteredAt = now, lastError = reason.
     Do not call the bus. This is the poison path and it costs one attempt,
     not twelve, because a malformed body fails identically every time.
   - bus.publish throws -> transient. nextRetry(), write attempts and
     nextRetryAt and lastError (truncate to 500 chars). If shouldDeadLetter,
     set deadLetteredAt instead and log at error with the eventId.
   - success -> publishedAt = now.
   Wrap the per-message body in try/catch so message 7 failing does not skip
   messages 8-20.

   maxAttempts = 12. At the capped backoff that is roughly an hour of retrying
   before a message is set aside, which is longer than any PayFast outage you
   should be absorbing silently.

6. Make the loop survivable.
   - tick() gets its own catch that logs and returns; keep the finally that
     clears `ticking`.
   - Replace setInterval with a self-scheduling setTimeout re-armed in the
     finally: 1000ms normally, 200ms when the last claim returned a full batch
     of 20, so a backlog drains instead of trickling at 20/second.
   - Implement OnModuleDestroy and clearTimeout there.
   - In main.ts add process.on('unhandledRejection') that logs at error with the
     stack. A backstop that logs — it must not swallow into silence.

7. /health gains an outbox block:
     outbox: { pending, oldestPendingSeconds, deadLettered, state }
   using outboxHealth with lagBudgetSeconds = 60. Overall status becomes
   'degraded' when the outbox state is degraded, even with database up.

8. Re-run: pnpm --filter @lekki/runtime-app test

DONE WHEN
- A test file placed in a directory not named in package.json runs anyway.
- An envelope with a blank eventId is dead-lettered on attempt 1, never reaches
  the bus, and lastError names eventId.
- A publish that throws leaves the row unpublished with attempts = 1 and
  nextRetryAt roughly one second out — and the next message in the same batch
  still publishes.
- A row at attempts = 12 that fails again has deadLetteredAt set and is not
  returned by the next claim.
- Two concurrent claims never return the same row.
- /health returns state 'degraded' when the oldest unpublished message is older
  than 60 seconds, with database still 'up'.
- Killing the process mid-tick and restarting republishes nothing that already
  has publishedAt.
- Test count is >= 55 and green.

DO NOT
- Do not swallow the error to make the loop look green. A silent catch is worse
  than today's crash: the crash at least tells you. Every failure path writes
  lastError and logs.
- Do not classify by error type. `this.server` being undefined at boot throws a
  TypeError and is entirely transient; a TypeError is not evidence of a poison
  message. Poison is decided by validating the envelope BEFORE publishing.
  Anything thrown during publish is transient by default — dropping a real event
  is the worse error here, so this one fails open, unlike Batch 4.
- Do not add PaymentOverpayment to CanonicalEventName in this batch. It is a
  contracts change needing a version bump, and the bus does not match on names,
  so nothing requires it to publish. Note it for a contracts batch.
- Do not touch markPaymentSettled or payment-expiry.service.ts. They are green.
  This batch is the transport underneath them.
- Do not build a refund handler. Row 10 is a deliberate deferral.
- Do not touch frozen Setup step order, or any surface outside SITES.
```

---

## Two decisions, written down

**What counts as poison.** Decided by the envelope, not by the exception. If the
stored body fails `validateEnvelope`, it will fail identically on attempt 50, so
it dead-letters on attempt 1. Anything thrown while publishing is transient and
retries to 12 attempts. The default direction is retry, because a lost event is
worse than a slow one — the inverse of the fail-closed rule in Batch 4, and
worth stating out loud so nobody "makes it consistent" later.

**What happens to a known event with no handler.** Nothing special, because the
bus has no name matching — see the correction above. There is no state to add.

---

## 3b — the thing I found while checking (separate, not in Batch 3)

`leos.gateway.ts:39-45` broadcasts every envelope to the guest session room
whenever `payload.sessionId` is present. `leos.service.ts` stamps every envelope
`classification: 'INTERNAL'` (envelope helper), and the gateway does not read
that field.

So when the settle path fires `PaymentOverpayment`, the guest's browser receives
`paidMinor`, `billMinor`, `priorStatus`, the internal `paymentId`, and the string
"manual refund required" — over the socket, in a room they are already in. It is
not rendered, so nobody has noticed. It is one devtools tab from being noticed.

That is a five-line fix and it does not belong in an outbox batch:

```
@nestjs-runtime @security-architect @unit-proof

SITES
apps/runtime/src/ws/leos.gateway.ts:37-52

DO
1. Add a pure guestVisibleEvent(envelope) predicate with a test — allow only
   classification 'PUBLIC', or an explicit allowlist of names the guest UI
   actually consumes.
2. Gate the session-room emit on it. Staff/operate rooms keep receiving
   INTERNAL.
3. Test: an INTERNAL envelope carrying a sessionId does not reach the session
   room; a PUBLIC one does.

DONE WHEN
- PaymentOverpayment reaches no guest room.
- The guest journey still updates on the events it actually renders.

DO NOT
- Do not fix this by removing sessionId from the overpayment payload. The
  payload is correct; the broadcast rule is the bug.
```

---

## Before you start

Two carry-overs from your last report, both still open:

- `20260904110000_payment_expires_at` is unapplied. Batch 3's whole premise is
  that the sweep rides this loop, and the sweep reads `expiresAt`.
  `pnpm exec prisma db execute --schema prisma/schema.prisma --file prisma/migrations/20260904110000_payment_expires_at/migration.sql`
- `d575fe6`, `ac0f712`, `529d330` are the entire money path and exist on one
  disk. Push them.
