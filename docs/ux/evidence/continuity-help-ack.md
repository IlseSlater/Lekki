# Evidence — Help ack pack polish

**Proof:** After Help, the guest knows staff heard them — and when someone is coming — without “hang tight.”

**Date:** 2026-08-21  
**Surfaces:** Guest help banner · `guestServiceAssistCopy` / `guestManagerAssistCopy`  
**Pillar:** Confidence · Calm · Hospitality  
**Interaction:** [continuity-help-ack.md](../wireframes/guest/continuity-help-ack.md)

## Slice (shipped)

| Status | Banner |
|--------|--------|
| open | **We’ve told your waiter** (pack noun) — no hang tight |
| acknowledged | Existing **… is on the way** (unchanged) |

## HCI

“Is someone coming?” — first breath: they heard you · second breath: someone is coming.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/help-ack-continuity.test.ts
```

1. Restaurant Help → We’ve told your waiter · ack → Your waiter is on the way.
2. Café Help → We’ve told the counter · no hang tight in any pack.
3. Festival manager → We’ve told the lead · The lead is on the way.

## Still HOLD

Cover-from-Leave · allocation wizard · tip product · Marketplace · Neo · Setup · Admin BI · new Help surfaces
