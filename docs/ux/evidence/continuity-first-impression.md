# Evidence — First-impression craft

**Proof:** Landing, splash, and sign-in share dusk + gold mark light — never a teal SaaS glow.

**Date:** 2026-09-22  
**Surfaces:** Marketing landing · Guest splash · Studio sign-in · Boot (unchanged hills)  
**Pillar:** Confidence · Calm · Continuity  
**Interaction:** [craft-first-impression.md](../wireframes/guest/craft-first-impression.md)

## Slice (shipped)

| Surface | Craft |
|---------|--------|
| Landing `.lk-glow` | Dusk ridges + gold lamp · card bloom · no teal/cyan |
| Splash | Mark drop-shadow + bloom · `focus-visible` gold ring · motion-reduce static |
| Sign-in | Halo origin nearer mark · Continue press settle · focus-visible fields |
| Get started pills | Press `scale(0.98)` · motion-reduce off |

## Acceptance (UX Lead checklist)

- [x] Boot = hills only  
- [x] Splash peak = gold mark lamp; skip / 4s / reduced-motion OK  
- [x] No Lekki after splash on Guest (unchanged Place Identity)  
- [x] Landing light ≠ teal nebula; one primary pill  
- [x] Sign-in halo from mark, no loop; focus-visible (no error shake)  
- [x] Same dusk continuum across doors  
- [x] No Preflight / `dark:` / runtime class strings  
- [ ] Screenshot craft review — Product Reviewer / `design-review` (UX does not self-pass)

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/first-impression.test.ts
```

1. Landing hero glow is gold/dusk — not teal.  
2. Splash keyboard focus shows gold ring; reduced motion static.  
3. Sign-in halo blooms once (not looping).  
4. After splash, venue owns Guest (unchanged).

## Still HOLD

design-review screenshot Craft gate · Marketplace · Neo · Setup · GAP-02/07
