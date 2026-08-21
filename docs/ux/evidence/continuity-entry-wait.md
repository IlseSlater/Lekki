# Evidence — Entry wait still-in flash

**Proof:** Mid-visit Entry redirect/loading never flashes Welcome back — answers “Am I still in?” in the wait beat.

**Date:** 2026-08-21  
**Surfaces:** Entry redirect · loading  
**Pillar:** Continuity · Calm  
**Related:** [continuity-mid-visit-resume.md](continuity-mid-visit-resume.md)

## Slice (shipped)

| Path | Wait copy |
|------|-----------|
| Mid-visit (session + participant) | **You’re still in — one moment…** · where you left it |
| True return | Welcome back — one moment… |
| First visit | Welcome — one moment… |

Also: Guest Bill `allowTip` defaults **false** until `resolveAllowTip` — no tips-on flash when Setup Tips is off.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/entry-wait-continuity.test.ts
```

1. Open visit · re-scan QR → Entry wait says You’re still in (not Welcome back).
2. After Leave · re-scan → Welcome back.
3. Tips off in Setup · open Bill → no tip chips on first paint.

## Still HOLD

Ready lead density · Leave purpose chrome · cross-device tipStaff · Marketplace · Neo · Setup · Admin BI
