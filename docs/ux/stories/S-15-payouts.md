# Story: S-15 — Payouts

| | |
|--|--|
| **Maturity** | **L4 Running** |
| **Journey stage** | Provider — Grow (nested view, not a new nav item) |
| **Spec** | [grow-craft.md](../grow-craft.md) — "one trading figure in prose" |
| **Evidence** | [grow-payouts-and-payment-attention.md](../evidence/grow-payouts-and-payment-attention.md) — `grow-payouts.test.ts` (6/6) + live walk |
| **Questions** | — |

Uber Eats Manager answers "what am I owed" with a Payments dashboard: current balance, next payout, payout history, and a Payment Detail table of gross sales / taxes / Uber fees / service fees / promotions / refunds / adjustments / net payout. That is a ledger. Grow doesn't ship ledgers.

**Payout timing is not known to this runtime.** No `settledAt` field, no PayFast payout/settlement-batch API integration exists — `getSettlement()` in the PayFast connector is an explicit stub. PayFast's own public docs confirm a real T+2/3-working-day settlement cycle with merchant-configurable daily/weekly/monthly payout frequency, but LEOS doesn't capture which frequency a venue chose (that's set inside PayFast's own merchant portal). **This story deliberately never promises a specific date** — it answers "how much" honestly and gives a general, sourced cadence line, not "when."

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Grow, after service |
| 2 | Which human benefits? | Owner checking they'll get paid |
| 3 | Which reusable platform capability emerges? | `getPayoutOverview` → `GrowController.payouts` — total taken this week/month, no date |
| 4 | How will we know it's better? | Owner reads a real total + a calm, honest cadence line — never a specific promised date |
| 5 | Can another profile reuse it? | Yes — PayFast settlement cadence is per-venue, not per-Pack |

### Platform Value

| | |
|--|--|
| **User Value** | I know what I've taken, without opening a spreadsheet — and I'm not told a date we can't guarantee |
| **Platform Value** | One trading-total capability, reusing `GrowController`'s existing `Payment`-summing pattern (`sumPayments()`) |
| **Reusable Capability** | `GET /grow/payouts?venueId=&period=week\|month` → `{ amount, currency, period }`; `composePayoutCopy()` turns that into two calm prose lines |
| **Future Reuse** | Same shape for any future payment connector, not just PayFast; `period` can extend beyond week/month without a new endpoint |

### Reach model (reference implementation)

Payouts is the **first and reference** "door" off Grow's one-breath home screen — a secondary text link beside the existing "One suggestion" section opens a bottom sheet (`leos-payouts-sheet`, modelled on `guest-help-sheet.component.ts`'s exact shape: `@Input open`, `@Output dismiss`, backdrop-click to close, no routing). **S-16–19 must reuse this exact sheet pattern for their own reach**, not invent their own — this was the explicit point of building Payouts first.

### Acceptance Spec

```text
Given my experience is live and has taken payments
When I open Grow and tap "See what you've taken"
Then a sheet opens showing one prose line with the real total
     (e.g. "You've taken R18,200 this week.")
And a second, general cadence line
     ("Card payments usually reach your account within a few working days.")
     — capabilities before vendors: never names the connector by name
And I do not see a balance ledger, fee breakdown table, transaction grid,
     or any specific promised payout date/day

Given I have taken no payments this period
When I open the sheet
Then it reads calmly ("Nothing taken this week yet.") — not a blank or zero stat

Given the sheet fails to load
When I open it
Then one calm line says so ("Couldn't load your totals — try again shortly.")
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Against Excel SaaS? | Yes | No ledger, no date promise, one sheet |
| One trading figure in prose? | Yes | `grow-payouts.test.ts` asserts no day name / date ever appears |

### Retrospectives

Link when done.
