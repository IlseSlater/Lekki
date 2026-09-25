# Evidence — Continuity: Payment failed · what do I do?

**Proof:** Operate Needs-you payment rows now have a next step — Open table (Floor focus) + Got it — without inventing refund or changing money status.

**Date:** 2026-09-22  
**Surfaces:** Studio Operate · Staff Floor embed  
**Pillar:** Confidence · Calm · Continuity  
**Related:** [wireframe](../wireframes/studio/continuity-payment-failed-next.md) · [S-20](../stories/S-20-payment-attention.md)

## Slice

| Action | Behaviour |
|--------|-----------|
| **Open table** (gold when first Needs-you) | Opens Floor monitor with `focusSessionId` → table detail |
| **Got it** | `POST /operate/payments-attention/:id/heard` sets `operatorNotedAt` — row leaves board; payment `status` unchanged |
| List filter | `operatorNotedAt: null` only |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/operate-glance.test.ts
```

8/8 — includes gold Open table vs Claim ranking + place-noun label.

**DB:** migration `20260922150000_payment_operator_noted` adds `Payment.operatorNotedAt`. Apply when runtime can release the Prisma engine lock:

```bash
pnpm --filter @lekki/runtime-app exec prisma migrate deploy --schema ../../prisma/schema.prisma
pnpm --filter @lekki/runtime-app exec prisma generate --schema ../../prisma/schema.prisma
```

## Still open

- Refund / retry payment (not this craft)
- Abandoned multi-day `active` demo sessions (Floor hygiene — separate)
- S-18 / S-19 / Settings
