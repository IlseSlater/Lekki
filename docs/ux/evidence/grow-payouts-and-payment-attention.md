# Evidence — S-15 Payouts / S-20 Payment attention

**Proof:** GAP-11's money split (Operate = health today, Grow = cadence over time) is real, running code — not just copy in a story doc.

**Date:** 2026-09-22
**Surfaces:** Studio Grow (`/studio/grow`), Studio Operate (`/studio/operate`)
**Pillar:** Confidence · Calm
**Related:** [S-15-payouts.md](../stories/S-15-payouts.md) · [S-20-payment-attention.md](../stories/S-20-payment-attention.md) · [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) GAP-11

## Slice (shipped)

| Surface | What it shows | What it deliberately doesn't |
|---|---|---|
| Grow → "See what you've taken" sheet | Real week/month total + a general, vendor-neutral cadence line | Any promised date, any connector name, any ledger/fee breakdown |
| Operate → "Needs you" board | A row per failed/amount-mismatch payment on a still-open session — "Payment didn't go through" / "Ask the guest to try again" | Claim/Resolve/Force clear actions (visibility only — resolution is a separate, unbuilt follow-up) |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/grow-payouts.test.ts
```

6/6 pass, including two tests that directly enforce the constraints this evidence is about: `never names a specific day or date` and `capabilities before vendors — never names the payment connector`.

## Manually walked (this session, real data — not synthetic fixtures)

1. **Backend, direct.** Logged in via `POST /identity/staff/login` with the demo Restaurant account, then called both new endpoints with the resulting staff token:
   - `GET /grow/payouts` → `{"amount":0,"currency":"ZAR","period":"week"}` (and `period=month` — same shape, no payments taken in this account's window).
   - `GET /operate/payments-attention` → 8 real `status:"failed"` rows from seeded demo data, correctly joined to `placeCode:"T1"`.
2. **Frontend, live in the browser.** Signed in through `/signin`, opened `/studio/grow`, clicked "See what you've taken" → sheet opened with `payoutsTotalLine: "Nothing taken this week yet."` and `payoutsCadenceLine: "Card payments usually reach your account within a few working days."` — confirmed via the actual rendered DOM (`.leos-payouts-sheet` text content), not just component state.
3. **Operate board, live in the browser.** Opened `/studio/operate` with `live` forced true (view-state only — no real go-live call was made). All 8 payment-attention rows rendered inside the *existing* "Needs you" board with "Payment didn't go through" / "Ask the guest to try again", no Claim/Resolve/Force clear buttons on those rows, and the gold "Claim" affordance still correctly targeted the one real claimable manager-escalation-shaped row, not a payment row (`isPrimaryClaim`/`ownerHint` both explicitly exclude `kind: 'payment'`).
4. **Staleness bound, verified against real data.** The `payments-attention` query bounds to sessions with `status in (created, active, settling)`, matching `floor()`'s own filter exactly. Checked directly: the 8 seeded failures belong to session `sess_0dff360a5fe7`, which the DB genuinely has `status: "active"` with `idleMinutes: 21520` (~15 days, started 2026-09-07) — a pre-existing abandoned demo session that *also* shows stale in the Floor board today, unrelated to this change. The filter itself is correct and matches Operate's own established pattern; this demo account doesn't have a closed-session example to show it actively excluding something, but the logic is the same one `floor()` already ships with.

## Still open (named, not silently deferred)

- **Resolution action for payment attention** — the row is visibility only. "Claim"/retry/refund for a failed payment is real future work, not shipped here.
- **S-16–19** (Feedback, Answers, One Suggestion, Documents) remain L0 — each has a named external dependency, see their own story docs.
- **Settings** — not started, deliberately last per GAP-11.
