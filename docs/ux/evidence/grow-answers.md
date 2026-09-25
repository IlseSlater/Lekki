# Evidence — S-17 Answers

**Proof:** "Email me last week's orders" is real, running code — a capability-first email connector, an async outbox pipeline, and a CSV — not just copy in a story doc.

**Date:** 2026-09-22
**Surfaces:** Studio Grow (`/studio/grow`)
**Pillar:** Confidence · Calm
**Related:** [S-17-reports.md](../stories/S-17-reports.md) · [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) GAP-11

## Slice (shipped)

| Layer | What it is | What it deliberately doesn't |
|---|---|---|
| Contract | `EmailConnectorDefinition`/`EmailCapability` in `@lekki/contracts`, mirroring `PaymentConnectorDefinition` — platform-level (no organisationId/venueId), bound once at bootstrap from env, not a per-venue Setup step | A vault-backed, owner-configurable connector marketplace — payments need that because each venue picks its own provider; email doesn't have that per-venue choice |
| Connectors | `connectors/resend` (real, HTTP) · `apps/runtime/src/leos/email-connectors/fake.definition.ts` (records instead of sending — the default here, since no `RESEND_API_KEY` exists in this environment) | Nothing — both fully implement the same capability interface |
| Async dispatch | `POST /grow/answers` appends a `VisitRecordRequested` outbox event and returns immediately; `AnswersMailerService` (subscribed to the event bus) builds the CSV and sends, off the request/response cycle | A synchronous send inside the HTTP handler — would block the response on email-provider latency and have no retry on transient failure |
| Grow UI | Two door buttons ("Email last week's/this month's orders →") that swap their own text to "On its way to …" inline on success | A sheet (nothing here needs the fetch-then-preview shape Payouts/Feedback needed), a report-type picker, a date-range toolbar |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/grow-answers.test.ts
node --import tsx --test apps/runtime/src/leos/csv.test.ts
node --import tsx --test connectors/resend/src/resend-connector.test.ts
```

4/4, 5/5, and 4/4 pass respectively — including `capabilities before vendors`-style tests (`grow-answers.test.ts` asserts the owner-facing copy never mentions "report/export/csv/download"; `resend-connector.test.ts` asserts a missing key or network failure fails calmly, never throws).

## Manually walked (this session, real data — not synthetic fixtures)

1. **Backend, direct.** Logged in via `POST /identity/staff/login` with the demo Restaurant account, then `POST /grow/answers` with `{"period":"week"}` and the resulting staff token → `{"to":"staff@rustyoak.demo","period":"week"}`, returned immediately (not waiting on the send).
2. **Outbox, verified against Postgres directly** (not inferred from logs): queried `OutboxMessage` for `eventName='VisitRecordRequested'` — found the row with the exact payload (`period`, `toEmail`, `venueId`) and `publishedAt` set with `attempts: 0`, confirming `AnswersMailerService` processed it successfully on the first try, not just that the HTTP call returned.
3. **Frontend, live in the browser.** Opened `/studio/grow`, real click (not a JS-invoked method call) on "Email last week's orders" → the button's own DOM text swapped to "On its way to staff@rustyoak.demo." with no sheet, no page reload. Repeated for the month door independently — confirmed both periods track separate state (`answersConfirm.week` / `.month`), not a shared field.
4. **Fake connector confirmed live**, not just in tests: runtime boot log shows `[EmailRuntimeService] RESEND_API_KEY / RESEND_FROM_ADDRESS not set — email connector bound: fake (nothing will actually send)` — the warning fires plainly rather than silently pretending to send.

## Still open (named, not silently deferred)

- **Real Resend delivery is unverified in this session** — no `RESEND_API_KEY` exists in this environment, so the live walk above proves the connector contract, the outbox pipeline, and the CSV/copy correctness, but not that an actual email lands in a real inbox. The `resend-connector.test.ts` suite covers the HTTP-call shape with a fake `fetch`, which is as far as this environment can verify without a real account.
- **S-18 (One Suggestion), S-19 (Documents)** remain L0 — each still has its own named dependency (guest-side promotional pricing; invoice generation), unrelated to this slice.
- **Settings** — not started, deliberately last per GAP-11.
