# Evidence — G-06 Live Order

**Screen:** G-06 — Guest Live Order (Experience Progress)  
**Uncertainty removed:** Is everything progressing?  
**Spec:** [../../wireframes/guest/live-order.md](../../wireframes/guest/live-order.md)  
**Status:** **Running (L4)** — Status Timeline in Guest live phase · BE fulfilment status path verified in e2e

## Implementation

| Layer | Change |
|-------|--------|
| FE | `leos-status-timeline` + `progress-timeline.ts` mapping · offline banner · Assist / Browse / Pay-if-due |
| BE | Existing `PATCH /fulfilments/:id/status` + session projection (no Platform redesign) |
| Pack | Restaurant step labels only (`Order received` → `Served`) |

## Event trace

```text
Cart Submit
  → TransactionCreated
  → FulfilmentCreated
  → FulfilmentStatusChanged (pending → preparing → ready → delivered)
  → PaymentRequested (G-07)
  → PaymentCompleted
  → SessionCompleted
```

## Acceptance Spec (story)

| Case | Evidence |
|------|----------|
| READY → Timeline Ready + polite live region | FE maps `ready` → platform `ready` / Pack “Ready”; `aria-live` announcement |
| Offline → banner + stale timeline | `offline` flag + `--stale` class; Retry |
| Pay when due → G-07 | Pay primary only when `balanceDue` |

## Tests

| Kind | Location | Passes |
|------|----------|--------|
| E2E heartbeat | `scripts/e2e-heartbeat.mjs` | preparing → ready → delivered + session projection |
| Unit mapping | `apps/web/.../progress-timeline.ts` | used by Status Timeline |

## Review notes

See [review-notes.md](review-notes.md).
