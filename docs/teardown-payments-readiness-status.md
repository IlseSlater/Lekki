# Payments readiness — verification pass

Updated 10 September 2026 after residuals (prior-active restore, vault prove,
async prove, credential projection) landed. Prior closed findings remain closed.

---

## Closed — verified in the code

**P0-1 / P0-2 / P0-3 / contract / backfill — CLOSED.**

**N1 · prove binding before DB writes — CLOSED.**
`provePaymentBinding` (async) before writes; demote/promote in one
`$transaction`; install failure → `activate_failed` **and restores the prior
active row**; boot restore → `restore_failed`.

**P1-5 · verifiedEnvironment — CLOSED.**
Invalidation runs after optional body `status`, so `status:'verified'` cannot
bypass a credential/env change.

**P1-4 · verify fail-closed — CLOSED.**
Exact ping bodies; env-specific URL; honest status copy.

**P1-6 · `PAYFAST_CONFIRM_WITH_SERVER=0` — CLOSED.**
`assertProductionPayFastConfirmEnabled` + `assertProductionTlsNotDisabled` in
`assertRuntimeSecrets`.

### Residuals (post N1/P1-5/P1-4) — CLOSED

1. **Prior active restored on install failure** — capture `priorActive` before
   the transaction; catch demotes the new row and re-activates the prior.
2. **Vault secrets proven at activate** — `provePaymentBinding` resolves each
   required secret once; dangling/unreadable refs fail closed before write.
3. **`provePaymentBinding` is async** — awaited; first async `createBinding`
   will still be proved.
4. **`maskInstall` projects through `definition.credentials`** — non-secret
   fields only; undeclared `configJson` keys (and mistaken `secret:false`
   third-party fields still only emit declared public ids) are not echoed.
   Compat `merchantId` / `merchantKeyMasked` / `passphraseSet` retained.

Evidence: `setup-payments.activate.test.ts`, `prove-payment-binding.test.ts`,
vault self-check.

---

## Still open (do not block wizard round-trip)

**N4 · `manual` installable in production** — gate activate like
`LEOS_ALLOW_MANUAL_COMPLETE`.

**P1-7 · bank details in plaintext `settlementJson`.**

**N2 · dual homes** for businessName / country / etc. vs `configJson`.

**N3 · `resolveTenant` without `venueId`** picks oldest venue.

**P2-8/9** — ITN `.tmp` log / always-200 — not re-checked.

---

## Order from here

1. **Wizard round-trip** — definition-driven credentials; operator-visible
   verify + notify failures
2. Then N4 / P1-7 / N3 / N2 as capacity allows
