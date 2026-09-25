# Payments readiness review — connector platform + Studio wizard

Read on 10 September 2026 against the working tree. One sandbox ITN settling
is a real milestone. It is not the same thing as the payment loop being closed,
and this review is about the distance between those two statements.

**P0 status (10 Sep 2026):** P0-1 / P0-2 / P0-3 landed in code — unknown
connectors fail closed, org comes from the staff token only, notify URL requires
`PUBLIC_RUNTIME_ORIGIN` or `PAYFAST_NOTIFY_URL` (no localhost default), published
sandbox merchant defaults removed, production refuses
`NODE_TLS_REJECT_UNAUTHORIZED=0` and `PAYFAST_CONFIRM_WITH_SERVER=0`. Evidence:
`payment-connector-registry.test.ts`, `setup-payments.p0.test.ts`,
`connectors/payfast/src/notify-url.test.ts`, `runtime-secrets.test.ts`.

**Connector contract (10 Sep 2026):** Backend schema + runtime speak
`PaymentConnectorDefinition`. `PaymentConnectorInstall` stores `configJson` +
`vaultRefsJson` (PayFast columns removed). PayFast exports
`payFastConnectorDefinition`. Setup services iterate declared credentials.
Studio UI not yet migrated — API still projects `merchantId` /
`merchantKeyMasked` / `passphraseSet` for compat.

What one green ITN proves: the happy path works end to end, once, on a sandbox
merchant, on a machine where the notify URL happened to be reachable.

What it does not touch: a second tenant, a live merchant, an unreachable notify
URL, a connector that is not PayFast, a failed or cancelled ITN, or an operator
who fills the wizard in wrong. Every one of those has a defect below.

---

## Credit where it is due

These are good and should not be traded away in the fixes:

- `validate.ts` fails closed on every path — abort, timeout, exact `'VALID'`
  string compare, catch returns false. No optimistic parsing.
- `checkItnAmountGross` blocks the underpay tamper explicitly and separately
  from mismatch, so the log tells you which attack you saw.
- `buildPaymentBinding` maps environment → `baseUrl` / `validateUrl` properly.
  I expected that to be missing; it is not.
- Secrets go to the vault as refs, never to columns. `maskInstall` never
  returns them.
- The wizard's hint copy is honest: it says the merchant key is stored, not
  verified. `probe.ts` says the same in its header. Somebody resisted the urge
  to overclaim, and that is rare.

---

## P0 — must fix before a second company touches this

### 1. An unknown connector silently becomes fake settlement

`leos-bootstrap.service.ts:150-157`

```ts
case 'fake': case 'connector-fake-payment':  return createFakePaymentBinding(10);
case 'manual': case 'connector-manual-payment':
default:                                     return createManualPaymentBinding(10);
```

`default:` is the whole problem. `activate()` in `setup-payments.service.ts`
checks that `row.connectorId` is non-empty and, if it is PayFast, that the
credential refs exist. It never checks the id is a connector that exists, and
it never checks `installable`.

So: `PUT /setup/payments/draft {connectorId:'stripe'}` → `POST activate` →
binding resolves through `default:` → **the in-process manual stub**. Studio
renders "Stripe · active". Every guest payment is marked settled. No money is
taken. Nobody is told.

This is Batch 4's exact defect — infer behaviour from an id you do not
recognise — sitting in the money path instead of the station board, and failing
*open* instead of closed. It is the single most dangerous line in the payment
code.

Fix: a real registry. `default:` throws. `activate()` rejects any connectorId
not in the registry with `installable: true`. Test: activating `'stripe'` is a
400, and no binding is replaced.

### 2. The request body overrides the authenticated tenant

`setup-payments.controller.ts:38` and `:45`

```ts
organisationId: body.organisationId ?? req.staff?.org
```

The body wins. An authenticated operator of org A sends
`{organisationId:'org-B'}` and reads or rewrites org B's payment connector
install. `testConnection` will then resolve org B's stored merchant key and
passphrase out of the vault to run the probe.

It gets worse downstream:

- `setup-payments.service.ts` `saveDraft` opens with
  `paymentConnectorInstall.findFirst({orderBy:{updatedAt:'desc'}})` — **no
  where clause at all**. It patches whichever install in the entire database
  was touched last, regardless of tenant.
- `resolveTenant` falls back to `findFirst` across all installs, then to the
  oldest venue in the database.
- `activate(undefined)` runs
  `updateMany({where:{status:'active'}}, {status:'draft'})` with no org filter —
  it deactivates every tenant's payment connector at once.

None of this is exploitable today because there is one tenant. All of it
becomes a cross-tenant credential and outage bug on the day there are two,
which is the day this product starts existing.

Fix: org comes from the token, full stop — `req.staff.org`, body ignored. Every
query in this service takes `organisationId` as a required argument. Make
`organisationId` non-nullable on `PaymentConnectorInstall` and add a unique
index on `(organisationId, venueId)` so "the newest row" stops being a lookup
strategy.

### 3. The notify URL defaults to localhost

`connectors/payfast/src/index.ts:252-254`

```ts
notifyUrl: overrides?.notifyUrl ?? process.env.PAYFAST_NOTIFY_URL
         ?? `http://localhost:${runtimePort}/payments/payfast/notify`
```

`buildPaymentBinding` overrides `baseUrl` and `validateUrl` by environment. It
does **not** override `notifyUrl`. So in any deployment where
`PAYFAST_NOTIFY_URL` is unset, the checkout form tells PayFast to post the ITN
to `http://localhost:3000` — PayFast's own localhost.

The guest pays. The money leaves their account. No ITN ever arrives. The
payment stays `pending` until the expiry sweep releases it, the table never
closes, and there is no record on the Lekki side that anything happened. That
is the worst failure this system can have, and it is the default configuration.

The merchant credential defaults are the same shape:
`merchantId ?? '10000100'`, `merchantKey ?? '46f0cd694581a'` — PayFast's
published sandbox pair. A misconfigured production boot does not fail; it
quietly runs as the demo merchant.

Fix: require `PUBLIC_RUNTIME_ORIGIN` and derive `notifyUrl` from it. Refuse to
activate a `production` install whose notify origin resolves to localhost, a
private range, or `.local`. Drop the hardcoded merchant defaults — Batch 2
already established that a missing secret refuses boot; these are secrets.

---

## P1 — wrong before a live merchant

### 4. "Verified" is a substring match against the wrong host

`connectors/payfast/src/probe.ts`

```ts
const pingUrl = input.pingUrl ?? 'https://api.payfast.co.za/ping';
...
const known = body === 'Payfast API' || body === 'API V1' ||
  body.toLowerCase().includes('payfast') || body.toLowerCase().includes('api');
```

Two problems.

The host is hardcoded to production and ignores `environment`, so the sandbox
path verifies against the live API.

And the success test is `includes('api')` on any 2xx body. A corporate proxy
interstitial, a captive portal, an ISP landing page, a generic gateway error
page — anything containing the letters "api" — passes as verification. This is
the same inference-from-substring the noun linter was built to eliminate, now
deciding whether a merchant's credentials are real.

Then:

```ts
businessName: environment === 'production' ? 'PayFast Merchant' : 'PayFast Sandbox Merchant',
merchantStatus: 'Verified Merchant & Passphrase',
```

Both are string literals. Nothing came back from PayFast. The operator reads
"Verified Merchant & Passphrase · PayFast Merchant" as a lookup result. It is a
constant.

Fix: pick the host from `environment`. Require an exact expected body or a
documented status code, and return `ok:false` on anything else. Report what was
actually confirmed — the file's own header already admits `merchant_key` is not
verified by `/ping`, so the status string should not claim it was.

### 5. `verified` survives an environment flip

`testConnection` writes `status:'verified'` together with the environment it
verified. `saveDraft` can then patch `environment` to `production` and never
touches `status`. `activate` only checks that `merchantId` and the two secret
refs exist.

Sequence: verify in sandbox → change the dropdown to Live → activate. The
binding now posts to `www.payfast.co.za` signed with sandbox credentials. The
first real guest hits a broken checkout, and the wizard shows green.

Fix: store `verifiedEnvironment` alongside `status`. `activate` requires
`verifiedEnvironment === environment`. Any `saveDraft` that changes
`environment`, `merchantId`, or either secret resets `status` to `draft`.

### 6. One env var disables the last gate of the shield

`PAYFAST_CONFIRM_WITH_SERVER=0` turns off the server-side validate call — the
leg that actually proves the ITN came from PayFast. It should be impossible to
set that when `NODE_ENV=production`. Same boot assertion as Batch 2's secrets.

### 7. Bank details are stored in plaintext JSON

`settlementJson` carries `accountNumber` and `branchCode` as a plain `Json`
column while `merchantKey` and `passphrase` correctly go to the vault. Under
POPIA that is the same class of data. `activate` also does not require
settlement details at all, so a connector can go live with no answer to "where
does the money land".

---

## P2

**8.** The ITN endpoint appends to `resolve(process.cwd(),'../../.tmp')` on
every request — an unbounded file outside the app directory, written on a hot
path, with the failure swallowed. Dev evidence, not production behaviour. It is
also not rate-limited; the signature check runs before the outbound validate so
amplification is bounded, but a throttle belongs here.

**9.** `payfastNotify` always returns 200 "so PayFast stops retry storms". For
a *decision* — bad signature, amount mismatch — 200 is correct: retrying will
not change the answer. For a *failure* — the database was unreachable when the
ITN landed — 200 tells PayFast the settlement is recorded and the retry never
comes. Worth walking `handlePayFastItn` and confirming that every path which is
an infrastructure failure rather than a verdict propagates instead of returning
a result object.

**10.** `PAYMENT_PROVIDERS` ships Stripe 3.4.0, Yoco 1.12.0 and Peach 2.0.1
with publisher names, for connectors that do not exist. Invented version
numbers attached to real companies in a customer-facing marketplace is a
credibility problem and arguably a trademark one. List them without versions,
or not at all.

---

## The connector contract does not exist yet

The stated goal is that companies add their own payment connectors. Today
"adding a connector" means editing four files in three packages:

| What a connector needs | Where it lives now |
|---|---|
| Marketplace entry | a `const` array in `setup-payments.service.ts` |
| Credential fields | PayFast-specific columns on `PaymentConnectorInstall` (`merchantId`, `merchantKeySecretRef`, `passphraseSecretRef`) |
| Verification | `if (connectorId !== 'payfast') throw` in `testConnection` |
| Runtime binding | a hardcoded `switch` in `leos-bootstrap.service.ts` |
| Wizard UI | a bespoke Angular page, `setup-payfast.page.ts` |

Nothing here is extensible. The shape it wants:

```ts
interface PaymentConnectorDefinition {
  id: string;
  displayName: string;
  countries: string[];
  currencies: string[];
  capabilities: PaymentCapability[];
  /** Studio renders the wizard from this — no bespoke page per connector. */
  credentials: Array<{
    id: string; label: string; help: string;
    secret: boolean; required: boolean;
    environments?: ('sandbox' | 'production')[];
  }>;
  /** Structured evidence, not a boolean. */
  verify(input: VerifyInput): Promise<VerifyResult>;
  /** Does the gateway call us back, and at what URL? */
  webhook?: { pathSuffix: string; requiresPublicOrigin: true };
  createBinding(input: BindingInput): PaymentBinding;
}
```

Store credentials as a `credentialsJson` map plus a `secretRefs` map keyed by
field id, instead of PayFast's three columns. Once the wizard renders from
`credentials`, the "does Studio ask the right questions" problem largely solves
itself, because the questions become the connector's own declaration rather
than a hand-built form.

---

## What the Studio wizard should ask and does not

It currently asks four things: environment, merchant ID, merchant key,
passphrase. Missing, roughly in order of how badly each one bites:

1. **Nothing tells the operator the notify URL, and nothing tests it.** This is
   the whole ballgame. `/ping` proves credentials; it proves nothing about
   whether PayFast can reach this server. The wizard should display the exact
   notify URL, and the final step should be a real round-trip — a sandbox
   checkout the operator completes, with the wizard waiting for the ITN to
   arrive. Anything less ships venues that take money and never hear back.
2. **Separate credential sets per environment.** One row, one merchant ID, one
   set of refs, a dropdown that silently switches hosts. Sandbox and live
   PayFast credentials are different values; the model should hold both.
3. **Country and currency.** `testConnection` hardcodes `'ZA'` / `'ZAR'` and
   overwrites whatever the operator chose. Peach is already listed as ZA + KE.
4. **Where settlement lands**, with vault treatment, and required before
   activation.
5. **Routing** — org-wide, per venue, or per location. `routingStrategy` is in
   the model and the page never asks.
6. **Refund authority** — which staff permission may issue one, and what the
   guest sees when a payment lands in `needs_refund`. That state is now
   reachable in production and has no operator-facing answer.
7. **Tips and surcharges**, and the descriptor the guest sees on their bank
   statement. Chargeback rates track unrecognised descriptors more than
   anything else.
8. **A go-live checklist, not a single tick.** "Credentials verified (sandbox) ·
   Notify URL not yet confirmed · Settlement account missing" tells an operator
   what to do. One green tick tells them they are finished when they are not.

---

## The TLS workaround

`NODE_TLS_REJECT_UNAUTHORIZED=0` does not scope to one host. It disables
certificate verification for every outbound TLS connection in that process —
including `confirmItnWithPayFast`, which is the final gate of the shield. For
the duration of that hop, the check that proves an ITN came from PayFast was
answered over a channel nobody authenticated. It was the right call to get
unblocked and it is the right thing to never write down.

`NODE_EXTRA_CA_CERTS` is the correct fix. Add the assertion to the Batch 2
fail-fast set: refuse to boot when `NODE_ENV=production` and
`NODE_TLS_REJECT_UNAUTHORIZED` is `'0'`. Check that it appears in no script,
compose file, Dockerfile, or `.env.example`.

---

## On building the Staff Board next

The argument for it is good — it is the visible payoff, and "did they pay
before they walked out" is the real anxiety in a QR venue.

That is exactly why it should not be next. The board's entire value is a waiter
trusting a green card. Right now green can mean a connector fell through
`default:` to the manual stub and marked an uncollected payment settled (P0-1).
A board that displays that with confidence is worse than no board, because it
converts a silent accounting error into a waiter waving someone out of the
door.

Suggested order:

1. **P0-1, P0-2, P0-3** — a day's work, and they are the difference between a
   demo and a product other companies can install.
2. **The connector contract** — before a second connector exists, not after,
   because retrofitting a port around two hardcoded implementations is
   materially harder than around one.
3. **The wizard's round-trip test** — it closes P0-3 from the operator's side
   and is the single highest-value screen in the whole setup flow.
4. **Then the Staff Board**, on a payment layer where green means paid.

Pilot POS egress ranks below all of these. It is a sync of settled orders, and
"settled" is the word currently doing unearned work.
