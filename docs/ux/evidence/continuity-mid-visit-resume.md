# Evidence — Mid-visit session resume

**Proof:** Re-opening an open visit answers “Am I still in?” — not Welcome back, not Join browse.

**Date:** 2026-08-21  
**Surfaces:** Guest splash · Experience banner · Entry welcome (if shown)  
**Pillar:** Continuity · Confidence · Calm  
**Interaction:** [continuity-mid-visit-resume.md](../wireframes/guest/continuity-mid-visit-resume.md)

## Slice (shipped)

| Path | Greeting |
|------|----------|
| Mid-visit resume (same session + participant) | **You’re still in** · optional quiet line · short splash · `welcome=still` |
| After Leave · new visit | Existing **Welcome back** |
| First join | Existing **You’re in — browse…** |

## HCI

Guest who never Left knows the visit continues. Return HCI stays for true return after Leave.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/mid-visit-resume.test.ts
```

1. Join → leave app mid-visit → re-scan same QR → You’re still in (not Welcome back).
2. Leave → done → re-scan → Welcome back.
3. First join → You’re in — browse…
4. Refresh mid-visit (same tab session known) → You’re still in once.

## Still HOLD

Help ack pack polish · Cover-from-Leave · tip product · Marketplace · Neo · Setup · Admin BI · allocation wizard · CRM resume-cart
