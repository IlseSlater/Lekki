# Teardown → delivery batches

Sequenced work orders for the open LEOS Teardown findings, written to fire the
`.cursor/skills/` system rather than bypass it.

**Why batches and not one prompt.** ~25 open findings across six domains. One
prompt loads six skills at once, they contradict each other on scope, and you
get patches without tests. Each batch below loads two or three skills that
agree with each other, and closes with a runnable proof.

**Order is risk-first, not domain-first.** Batch 1 is small on purpose — it makes
every later batch easier to debug, because right now a 500 hides the cause.

### Signal board (4 September)

| Item | State |
|------|--------|
| Settle-after-expiry hole | **Closed** (on remote) |
| Batch 1 error semantics | Landed |
| Batch 2 hardening | Landed |
| Batch 3 outbox | Landed — apply SQL when DB up (done on this machine 4 Sept) |
| Batch 4 authz nouns | **Landed** — Pack `restaurantStationAccess` table; cellar-bar not bar-by-substring; unknown fail-closed; `KNOWN_OPEN` empty; `check:nouns` exits 0 |
| Batch 5 menu editor | **Landed** — Studio `/studio/menu`, hospitality fields, guest 86/allergen live path |
| Batches 6–7 | Not started |

**Next sequence:** Batch 6 (onboarding wall).

---

## The template

Reuse this shape for anything not listed below.

```
@<domain-skill> @<implementation-skill> @unit-proof

CONTEXT
LEOS Teardown — <one line>.

PROBLEM (verified <date>)
<what is true in the code today, with file:line>
<what breaks for a human as a result>

SITES
<file:line list — no prose>

DO
1. Write the failing test first in apps/runtime/src/leos/<name>.test.ts
   (node:test, .test.ts — the runtime test script is a glob, so it will run).
2. <the change>
3. Re-run: pnpm --filter @lekki/runtime-app test

DONE WHEN
- <assertion that must pass>
- <assertion that must pass>

DO NOT
- <the drift you are most worried about>
- Touch frozen Setup step order, or any surface outside SITES.
```

Three rules that make the difference:

- **SITES is a list, not a paragraph.** The agent will wander to adjacent files
  if you describe an area instead of naming lines.
- **DONE WHEN is an assertion, not a feeling.** "Errors are clearer" is not a
  done condition. "A missing secret returns 400 and the body names the field" is.
- **DO NOT is where you spend your attention.** Every batch below has drifted in
  someone's hands. Name the drift you expect.

---

## Batch 1 — Error semantics at the boundary

Smallest batch, highest leverage: until this lands, every other batch debugs
through a 500.

```
@nestjs-runtime @security-architect @unit-proof

CONTEXT
LEOS Teardown — domain errors surface as HTTP 500.

PROBLEM (verified 3 September)
Eight controllers throw bare `new Error(...)` at the request boundary and there
is no exception filter. Nest maps those to 500 with a generic body. Meanwhile an
*invalid* participant secret correctly returns 401 from session-access.service.
So one guest problem — a secret that did not survive a tab reload — returns 401
down one path and 500 down the other. The 500 looks to the client like the
server fell over, so it is neither retried nor reported usefully.

SITES
apps/runtime/src/http/payment.controller.ts:26
apps/runtime/src/http/session.controller.ts:110
apps/runtime/src/http/session.controller.ts:111
apps/runtime/src/http/session.controller.ts:129
apps/runtime/src/http/transaction.controller.ts:24
apps/runtime/src/http/grow.controller.ts:19
apps/runtime/src/http/setup-entry.controller.ts:15

DO
1. Write apps/runtime/src/leos/error-mapping.test.ts FIRST. Assert the mapping
   as a pure function, so it needs no Nest and no database:
     - missing required field            -> 400, body names the field
     - invalid participant credentials    -> 401
     - NothingLeftToPayError              -> 409
     - unknown/unexpected error           -> 500, body carries no internals
2. Add a typed domain error set and a pure `mapDomainError(err)` returning
   { status, code, message }. Keep it in src/leos/ so it stays testable.
3. Add one global exception filter that delegates to mapDomainError.
4. Replace the eight bare throws with the typed errors.
5. Attach the request correlationId to every mapped response body.
6. pnpm --filter @lekki/runtime-app test

DONE WHEN
- A request with no participantSecret returns 400 and the body names the field.
- A request with a stale participantSecret still returns 401 (unchanged).
- No controller in apps/runtime/src/http/ throws a bare Error.
- Every error response carries a correlationId.

DO NOT
- Leak stack traces, Prisma messages, or SQL into any response body.
- Change any success-path status code.
- Refactor the controllers beyond the throw sites.
```

---

## Batch 2 — Runtime hardening

The four that are pure configuration, and the reason a determined guest on the
venue wifi is still a threat.

```
@security-architect @nestjs-runtime

CONTEXT
LEOS Teardown — the runtime has no perimeter.

PROBLEM (verified 3 September)
1. Both shared secrets fall back to a hardcoded dev value:
   staff-token.service.ts:24  STAFF_TOKEN_SECRET || 'leos-dev-staff-token-secret'
   secrets-vault.service.ts:20 LEKKI_VAULT_KEY   || 'lekki-dev-vault-key'
   Anyone who has read this repo can forge a staff token and decrypt the vault.
2. No throttler and no helmet are in apps/runtime/package.json. Staff PIN login
   has no rate limit, no lockout, no delay. Minimum PIN is 4 digits.
3. main.ts:42 creates the app with `cors: true` — every origin reflected, with
   credentials.
4. No ValidationPipe. class-validator is a dependency with zero imports, so every
   @Body() is an erased TypeScript interface.

SITES
apps/runtime/src/staff-auth/staff-token.service.ts:24
apps/runtime/src/leos/secrets-vault.service.ts:20
apps/runtime/src/main.ts:42
apps/runtime/package.json

DO
1. Fail fast at bootstrap when STAFF_TOKEN_SECRET or LEKKI_VAULT_KEY is unset,
   or equals the dev literal. Refuse to start — do not warn and continue.
2. Add @nestjs/throttler: per-account and per-IP limits on staff PIN login, with
   exponential lockout. Log every failed attempt with the correlationId.
3. Add helmet, a body size limit, and a request timeout.
4. Replace `cors: true` with an explicit per-environment origin allowlist.
5. Add a global ValidationPipe (whitelist + forbidNonWhitelisted) and DTO classes
   for the guest-facing bodies at minimum.
6. Add both env vars to .env.example with a comment saying they are required.

DONE WHEN
- The runtime refuses to boot with either secret unset.
- 10 wrong PINs in a row locks the account and the attempts are in the log.
- A cross-origin request from an unlisted origin is refused.
- `{"quantity": -5}` is rejected by validation, not by the database.

DO NOT
- Weaken any of this for local development convenience — use .env.
- Change the PIN length policy in this batch (it is a product decision, and it
  belongs with the team screen).
```

---

## Batch 3 — The outbox

Currently a silent total outage waiting for one bad message.

```
@platform-architect @nestjs-runtime @unit-proof

CONTEXT
LEOS Teardown — the outbox publisher head-of-line blocks forever.

PROBLEM (verified 3 September)
outbox-publisher.service.ts has no try/catch, no attempt counter, no backoff, no
dead-letter and no SKIP LOCKED. One throwing handler aborts the loop; the same
50 rows are re-selected a second later, forever. The entire event stream stops
permanently and the only symptom is a log line. It also publishes then marks, so
a crash replays, and the dedupe set is in-memory so it is empty after a restart.

SITES
apps/runtime/src/events/outbox-publisher.service.ts

DO
1. Write the failing test first — a handler that throws must not stop the loop,
   and the message must be retried then dead-lettered.
2. Try/catch per message. Add `attempts` and `nextRetryAt` columns; migrate.
3. Exponential backoff. A `deadLetteredAt` column after N attempts.
4. SELECT ... FOR UPDATE SKIP LOCKED so two instances cannot double-publish.
5. Self-scheduling loop — do not setInterval without awaiting the previous run.
6. Surface outbox lag and dead-letter count on /health.

DONE WHEN
- A handler that always throws dead-letters its message and the loop keeps going.
- Two publisher instances do not deliver the same message twice.
- /health reports a non-200 when outbox lag exceeds the threshold.

DO NOT
- Drop a message silently. Dead-lettering is visible or it is data loss.
```

---

## Batch 4 — The two authorization noun violations

`check:nouns` scans decision expressions only (not comments, URLs, or
allowlists). Three known open files remain in `KNOWN_OPEN` until this batch
clears them; CI fails on any new decision-site hit.

```
@platform-architect @security-architect @pack-architect

CONTEXT
LEOS Teardown — authorization decided by string-matching restaurant nouns.

PROBLEM (verified 4 September)
Decision-site check reports load-bearing hits in two files (plus borderline
fulfilment):
  staff-token.service.ts   canAccessStation: waiter blanket grant + id.includes('kitchen')
  leos.gateway.ts          station→role via includes; unconditional return 'kitchen' (fail-open default)
  fulfilment.controller.ts staff.role === 'waiter' status gate (enum, fail-closed — fix second)
This fails open — a station id that does not contain those substrings is
writable by kitchen staff — and it means a Pack noun decides a Platform
permission, which is the boundary the constitution exists to protect.

SITES
apps/runtime/src/staff-auth/staff-token.service.ts
apps/runtime/src/ws/leos.gateway.ts
apps/runtime/src/http/fulfilment.controller.ts

DO
1. Write the failing test first: station 'station-cellar-bar' must not be
   writable by the bar role by accident, and an unknown station id must fail
   CLOSED, not open.
2. Replace substring matching with an explicit station→role table stored per
   venue, resolved through the Pack, never inferred from the id string.
3. Namespace station ids per venue while you are here.
4. Delete the unconditional return 'kitchen' fallback.
5. Clear KNOWN_OPEN in scripts/check-noun-separation.mjs (check exits 0 clean).

DONE WHEN
- check:nouns exits 0 with an empty KNOWN_OPEN and CI stays green.
- An unknown station id is refused for every role.
- No authorization decision anywhere reads a restaurant noun.

DO NOT
- Rename nouns in guest-facing copy to satisfy the linter. The rule is about
  core logic, not about what a human reads.
```

---

## Batch 5 — The menu editor

The one that makes "go live in minutes" true or false.

```
@studio-architect @angular-web @brand-architect

CONTEXT
LEOS Teardown — the catalogue write API exists and nothing reaches it.

PROBLEM (verified 3 September)
catalogue.controller.ts exposes @Post('venue/:venueId') and @Put('item/:id'),
both guarded. No Studio screen calls either — only leos-api.service.ts even
names them. So an operator completes all five setup steps, goes live, and their
guests see the seeded demo menu at someone else's prices. Every claim the
marketing page makes about the guest seeing "your menu" is currently false.

SITES
apps/runtime/src/http/catalogue.controller.ts
apps/web/src/app/services/leos-api.service.ts
apps/web/src/app/pages/ (new screen)

DO
1. Read docs/ux/LEOS-Studio-Design-Blueprint.md before drawing anything.
2. Build the menu editor as a Studio surface: left pane one question at a time,
   right pane the live guest phone reflecting each save. Auto-save, no
   Save/Apply/Publish row.
3. Item fields: label, description, price, category, station routing, image.
4. Add the fields the teardown found missing on the model, with a migration:
   allergens, dietary tags, availability (86), ageRestricted.
5. Surface allergens and dietary tags in the guest menu, and carry the 86 flag
   over the existing socket so a sold-out item disappears live.
6. Verify in the browser: change a price in Studio, see it on the guest phone.

DONE WHEN
- An operator can create a menu from empty without touching a database.
- 86-ing an item removes it from the guest menu without a reload.
- An allergen set in Studio is visible to a guest before they order.

DO NOT
- Put menu CRUD inside the frozen Setup step sequence — it is an Operate/Studio
  surface reached from Studio home, not a sixth setup step.
- Ship a table-and-modal admin grid. This is hospitality, not a CMS.
```

---

## Batch 6 — The onboarding wall

The largest single conversion risk in the product, and it contradicts your own
Entry copy.

```
@experience-architect @brand-architect @hci-confidence

CONTEXT
LEOS Teardown — seven steps and a fake OTP between a hungry guest and a price.

PROBLEM (verified 3 September)
onboarding.page.ts:10 defines: account → verify → name → birthday → gender →
phone → welcome. Before this, guest-splash holds a 5-second unskippable splash.
verifyCode() accepts any six digits and sendCode() is a 700ms setTimeout that
sends no email — the screen says "we have sent you a code" and nothing is sent.
Entry's own copy promises "we'll take you straight in. No account needed."
IdentityConsent is modelled and never written; there is no privacy notice.

SITES
apps/web/src/app/pages/onboarding.page.ts
apps/web/src/app/pages/guest-splash.page.ts:8
apps/web/src/app/pages/entry.page.ts:64

DO
1. Menu first. A guest reaches prices with zero taps beyond the scan.
2. Ask for identity only where it is needed — at pay, and only what pay needs.
3. Delete the birthday and gender steps unless someone can name what reads them.
   If age verification is the reason, that is an ageRestricted item check at the
   point of order, not a signup field.
4. Either wire a real provider for the OTP or delete the step. Do not ship a
   screen that says it sent mail.
5. Splash under one second and interruptible on tap.
6. If any personal data is still collected, write IdentityConsent and link a
   real privacy policy — the footer links are currently inert spans.
7. Score the change with @hci-confidence before and after.

DONE WHEN
- Scan to visible price is under two seconds with no taps.
- No screen claims to have sent something it did not send.
- Anything still collected has a consent record and a policy link.

DO NOT
- Replace the wall with a smaller wall. The target is zero, not three steps.
```

---

## Batch 7 — Make the SEO work reach AI crawlers

Half-done: the metadata is real, the rendering is not.

```
@angular-web @engineering-architect

CONTEXT
LEOS Teardown — meta tags exist, nothing server-renders them.

PROBLEM (verified 3 September)
index.html now carries description, Open Graph and canonical; robots.txt and
sitemap.xml exist. Real gains for Google. But angular.json has no ssr or
prerender configuration, and the marketing route is client-rendered — so GPTBot,
ClaudeBot, PerplexityBot and OAI-SearchBot, none of which execute JavaScript,
fetch an empty <lekki-root>. Every word of the positioning is invisible to the
channel growing fastest.

SITES
apps/web/angular.json
apps/web/src/index.html
apps/web/src/app/app.routes.ts

DO
1. Decide the fork explicitly and write it down: add @angular/ssr and prerender
   the marketing route, OR split marketing onto a static generator. SSR is the
   smaller change; the split ranks faster and keeps guest bundle weight down.
2. Whichever you pick, prerender at minimum: /, pricing, and each pack page.
3. Add SoftwareApplication and Organization JSON-LD.
4. Use Angular's Title and Meta services per route — currently used nowhere, so
   every page shares one title.
5. Verify by fetching the built page with JavaScript disabled: the headline and
   the pricing must be in the HTML source.

DONE WHEN
- curl of the marketing route returns the headline text in the body.
- Server logs show GPTBot and ClaudeBot receiving rendered HTML.
- Each route has a distinct title and description.

DO NOT
- Ship SSR for /experience or /studio. Guest session URLs must stay
  unindexed — robots.txt already disallows them, keep it that way.
```

---

## Row 5 — closed by constraint, not by test

Decision (3 Sept): we do not carry concurrent double-charge, and we do not
wait for a test database. We make it structurally impossible.

Why not a test. `requestPayment` used to read, compute remaining, then
`$transaction` only around `payment.create`. A sequential approximation would
pass while the bug survived. The constraint holds under conditions no unit
test can stage.

### What landed

- `ExperienceSession.billMinor`, `paidMinor`, `version` (session-wide — row 3
  is 200+150=350, so the cap is not per-`Transaction`).
- Conditional `UPDATE ... WHERE version = $v AND paidMinor + $base <= billMinor`;
  zero rows → `PaymentConflictError` → HTTP 409.
- Partial unique indexes on pending `Payment` by `sessionId`, split by scope
  (`visit` vs `mine`) so Bob and Carol can still pay their shares together.
- `Payment.expiresAt` (15 min): abandoned PayFast redirects expire; sweep
  marks `expired` and releases `paidMinor`, freeing the unique index.
  Runs on outbox cadence and again at the start of `requestPayment`.
- Late ITN after expiry: `markPaymentSettled` re-takes `paidMinor` when the
  prior status is not `pending`. If the session has no capacity left, status
  becomes `needs_refund` and `PaymentOverpayment` is emitted — row 10 is no
  longer hypothetical.
- `payment-concurrency.test.ts` asserts the **predicate, expiry release,
  settle re-take / overpayment flag, and 409 mapping** as pure functions.
  Postgres enforces the race.

### Still open after this

What the guest who loses the race actually sees. A 409 is correct and silent.
“Someone at your table is paying right now — one moment” is correct and
hospitable. That is a `@brand-architect` call, not this batch.

The expiry sweep rides the outbox publisher loop (Batch 3: durable claim /
retry / dead-letter). If that loop dies, abandoned rows wait until the next
`requestPayment` — which still expires them before reading remaining. That
hot-path sweep is usually a no-op (15-minute predicate); concurrent pays each
run it — lock ordering under load is worth watching.

### Migrations / P3005

This repo’s baseline was never recorded in `_prisma_migrations`, so
`prisma migrate deploy` fails with P3005. Local applies use
`prisma db execute --file …`. Before a second environment exists, run
`prisma migrate resolve --applied 20250901120000_sellable_baseline` (then
deploy subsequent folders) so schema is reproducible.

## Row 10 — refund tripwire (deliberate)

The test asserts the stubs behave like stubs, which is the honest thing to
write today. It means the suite fails the day someone ships a real refund.
That is the point — as long as whoever sees the red understands it is a
prompt to rewrite the assertion, not a regression to revert.

`PaymentOverpayment` + status `needs_refund` (late gateway settle after
expiry, against a table that already filled capacity) is the first real
producer of that case. Do not absorb it into `paidMinor`.
