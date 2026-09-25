# Evidence — Studio first impression

**Proof:** Sign-in → Welcome → Create uses frozen halo / settle / stagger — not a Setup redesign.

**Date:** 2026-09-22  
**Surfaces:** Studio sign-in · Welcome · Create  
**Pillar:** Confidence · Calm · Continuity  
**Interaction:** [craft-studio-first-impression.md](../wireframes/studio/craft-studio-first-impression.md)

## Slice (shipped)

| Screen | Craft |
|--------|--------|
| Sign-in | Empty email · 360ms settle before navigate |
| Welcome (returning) | Ash halo · greeting → venue → ready → list stagger |
| Welcome (first-time) | Halo on start card |
| Create | Confidence remounts on select → `ci-settle` |

## HCI

Good morning — this venue is ready — then continue. No demo email theatre.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/studio-first-impression.test.ts
```

1. Sign-in fields empty · success settles then Studio.  
2. Welcome peak reveals in order with halo.  
3. Create “Looks good” settles when a type is chosen.  
4. No new motion ADR · Setup Engine untouched.

## Still HOLD

Setup redesign · Marketplace · Neo · GAP-02/07 · design-review screenshots
