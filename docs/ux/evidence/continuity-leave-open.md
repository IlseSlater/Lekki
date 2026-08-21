# Evidence — Leave while visit still open

**Proof:** Leave confirm answers “Can I leave if others still owe?” — yes, calmly — without an allocation wizard or Cover-from-Leave.

**Date:** 2026-08-21  
**Surfaces:** Guest Leave confirm  
**Pillar:** Continuity · Confidence · Calm  
**Related:** [continuity-social-settle.md](continuity-social-settle.md)

## Slice (shipped)

| State | Meaning |
|-------|---------|
| Visit still open | Title **You’re free to leave** · lead says others can settle · quiet Visit still open amount · primary **I’m finished** |
| Visit cleared | Existing pack leave title · Stay if you still need anything · session-end body · **I’m finished** |

## HCI

Guest who paid their share is not trapped. Visit can stay open for others. No new leave product.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/leave-open-continuity.test.ts
```

1. Mine pay · visit remaining → Leave → “You’re free to leave” + Visit still open amount.
2. Visit cleared → “All done here?” (or pack title) + stay lead.
3. Primary stays **I’m finished** · Stay still returns · no Cover on Leave.

## Still HOLD

Allocation wizard · Cover-from-Leave · mid-visit resume · Help ack pack · Marketplace · Neo · Setup redesign · Admin BI
