# Evidence — Ready → Pay next-step crispness

**Proof:** When fulfilment is Ready and a balance remains, Guest Live answers “What do I do now that it’s ready?” with one settle action — never “Pay & finish”.

**Date:** 2026-08-21  
**Surfaces:** Guest Live · ready cue · gold primary CTA  
**Pillar:** Continuity · Confidence · Calm  
**Interaction:** [continuity-ready-pay.md](../wireframes/guest/continuity-ready-pay.md)

## Slice (shipped)

| State | Meaning |
|-------|---------|
| Ready · balance due | Gold CTA **Pay now** · lead = ready cue + “Settle when you’re ready.” |
| Not ready · balance due | **Pay when ready** (unchanged) |
| Ready · no balance | **Finish** → receipt (unchanged) |

## HCI

Receive still answers “Is it ready?”  
This breath answers the next step: settle — without Leave / finish conflation.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/ready-pay-continuity.test.ts
```

1. Ready + open balance → primary is **Pay now** (no finish / leave / end).
2. Lead bridges waiter/counter/door ready cue with settle invitation.
3. Café ready hint still bridges settle when balance due.
4. Cleared balance → Finish path unchanged.

## Still HOLD

Leave while visit open · mid-visit resume · Help ack pack · tip product · Marketplace · Neo · Setup redesign · Admin BI · allocation wizard
