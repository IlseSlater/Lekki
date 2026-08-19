# Evidence — G-05 Cart

**Uncertainty removed:** What am I about to commit to?  
**Status:** Running (L5)

## Implementation

| Layer | Change |
|-------|--------|
| FE | `leos-line-item-row` · `leos-quantity-stepper` · `leos-order-total` · empty state · submit guard |
| BE | Existing `POST /transactions` (no Platform change) |
| LEK-028 | Line Item Row · Order Total **Frozen** |

## Acceptance

| Case | Evidence |
|------|----------|
| Empty cannot submit | Primary disabled when `!cart.length` |
| Qty / remove updates total | Stepper + remove handlers |
| Submit → G-06 | `phase = 'live'` after createTransaction |

## Tests

Heartbeat e2e still creates transaction from cart lines (API). UI components covered by web build.
