# Story: S-20 — Payment attention

| | |
|--|--|
| **Maturity** | **L4 Running** (+ Continuity next-step craft) |
| **Journey stage** | Provider — Operate |
| **Spec** | [operate-craft.md](../operate-craft.md) · [continuity-payment-failed-next.md](../wireframes/studio/continuity-payment-failed-next.md) |
| **Evidence** | [grow-payouts-and-payment-attention.md](../evidence/grow-payouts-and-payment-attention.md) · [continuity-payment-failed-next.md](../evidence/continuity-payment-failed-next.md) |
| **Questions** | — |

Before this story, a failed PayFast payment (settlement failure or amount-mismatch) updated the database and fired a `PaymentFailed` domain event — but that event was allowlisted only to the *guest's* own WS room. Operate had no REST endpoint, no WS subscription, and no path to it at all: a payment could fail and the owner would never know, short of the guest mentioning it in person. The only payments-related field Operate showed (`paymentsLine`) was a one-time setup-completion flag, misleadingly worded ("Healthy") as if it reflected live status.

This closes that gap — the split decided as part of GAP-11's resolution: **payment health, today → Operate. Payout cadence, over time → Grow** (see [S-15-payouts.md](S-15-payouts.md)).

**Continuity deepen (same story):** visibility alone left “Ask the guest to try again” with no action. Craft adds **Open table** (Floor focus) and **Got it** (`operatorNotedAt`) — money status unchanged; no refund invent.

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Operate, live floor oversight |
| 2 | Which human benefits? | Owner/staff who needs to know a guest's payment didn't go through, now, not after the fact |
| 3 | Which reusable platform capability emerges? | `listPaymentAttention` — same row shape as `listFulfilments`/`listAssistance` |
| 4 | How will we know it's better? | A failed payment appears in the existing "Needs you" board within one poll cycle — no new board, no new widget |
| 5 | Can another profile reuse it? | Yes — `Payment.status` failure states aren't Pack-specific |

### Platform Value

| | |
|--|--|
| **User Value** | I see a failed payment while the guest is still at the table, not days later |
| **Platform Value** | Reuses the existing escalation board and its `refresh()`/`forkJoin` polling — no new UI surface |
| **Reusable Capability** | `GET /operate/payments-attention?venueId=` → `{ id, sessionId, placeCode, status, createdAt }[]` |
| **Future Reuse** | Same row shape could carry a real resolution action later (retry / refund) — deliberately not built here |

### Acceptance Spec

```text
Given a guest's payment fails or amount-mismatches
When staff/owner open Operate
Then a row appears in the existing "Needs you" board — "Payment didn't go through"
And the hint reads "Ask the guest to try again" (informational only)
And there is a calm next step: gold **Open table** (when first) and quiet **Got it**
And Got it notes the failure for Operate without changing payment money status
And there is no Refund / Force-settle invent on this row

Given a payment-attention row and a manager-assistance row both exist
When the board ranks "who's first"
Then the primary gold Claim button only ever targets the claimable
     (non-payment) row — a payment row is never treated as "next to claim"

Given the venue has finished payments setup
When Operate's footer status line renders
Then it reads "Payments set up" — not "Payments Healthy", which would
     misstate a one-time setup flag as live connector health
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| One glance test? | Yes | Reuses the existing board, no new widget |
| Dark ops theme absent? | Yes | Same row styling as existing escalations |
| No cards-in-cards? | Yes | No new component beyond a `kind` branch in the existing template |

### Retrospectives

Link when done.
