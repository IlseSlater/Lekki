# Evidence — Screen coverage (GAP-08)

**Proof:** Every `SCR-*` in the lifecycle map names a story/HCI owner. Coverage fails CI if a bare GAP-01…08 owns a screen, a required story is missing, a dead page returns, or Neo is imported.  
**Date:** 2026-09-21  
**Surfaces:** `docs/ux/lifecycle-and-screen-map.md` · `app.routes.ts` · stories  
**Pillar:** Continuity (docs ↔ software)

## Verify

```bash
pnpm run check:screens
node --import tsx --test apps/web/src/app/studio/gap-01-08.test.ts
```

## Hold

Do not weaken the script to “document later.” Update the map in the same change as routes.
