# Evidence — Continuity claim polish (multi-guest Mine remaining)

**Proof:** After Guest A pays **Mine**, amounts and tabs stay truthful for Guest A and Guest B — no double-counting of mine payments.

**Date:** 2026-08-11  
**Pillar:** Continuity · Confidence · Calm

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Prisma | `Payment.participantId` for mine-scoped pays |
| Runtime `requestPayment` | Persists participant on mine; mine remaining filtered by that guest |
| Guest bill | Tabs show **remaining** visit/mine · Mine · paid when share covered |
| Guest live | Auto-switch Mine → Visit when share paid · prefer Mine when shares differ |

## HCI

1. What do I still owe? — scope amounts match what Pay will charge  
2. Did my share clear? — **Mine · paid** + calm note; visit still open for others  
3. Multi-guest? — Guest B’s mine is not reduced by Guest A’s mine payment  

## Still HOLD

Equal-split wizard · claim-from-table picker · wallets · loyalty

## Verify

1. Two participants order attributed items  
2. Guest A Pay → Mine → amount = A’s lines only  
3. Refresh bill: Mine · paid · Visit remaining excludes A’s share  
4. Guest B Mine remaining unchanged by A’s payment  

## Architecture note

Still `RequestPayment` + `Payment.scope` — no ApplyAllocation / new settlement model.
