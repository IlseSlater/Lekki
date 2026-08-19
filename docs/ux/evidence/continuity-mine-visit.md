# Evidence — Continuity claim/split (Mine · Visit)

**Proof:** Guest pay answers one question — *Am I paying for my items, or the whole visit?* — with a real scoped amount on `RequestPayment` (no new Payment Engine).

**Date:** 2026-08-07  
**Pillar:** Continuity · Confidence · Hospitality

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Prisma | `TransactionLine.participantId` · `Payment.tipAmount` · `Payment.scope` |
| Entry | Returns `joinedParticipantId`; guest state persists it |
| Order | `createTransaction` stamps lines with participant |
| Bill UI | Mine vs This visit — mine lines filtered by participant |
| Pay | `scope` + `participantId` → amount = mine share or remaining visit (+ tip) |
| Settle | Transaction settles only when paid toward total covers lines (partial mine ok) |

## HCI

1. Where am I? — bill place · name subtitle  
2. What can I do? — **This visit** or **Mine** + tip + one gold Pay  
3. What happens next? — Mine: “Your share is paid”; Visit: “You’re all set”

## Not in this slice (still HOLD)

- Equal-split wizard · claim picker · wallets · loyalty  
- Multi-guest social claim UI polish (attribution is ready; claim-from-table later)

## Verify

1. Join → order → Pay → This visit amount = full open balance  
2. Same path → Mine (single guest) ≡ visit until a second participant orders  
3. Pay Mine then Visit remaining (multi-order / attributed) — visit settles when covered  
4. No Stripe/PayFast nouns on Guest surface  

## Architecture note

Extends existing `PaymentCapability.createPayment` / `RequestPayment`. Does not invent ApplyAllocation UX or a second settlement model.
