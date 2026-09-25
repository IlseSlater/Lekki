# Evidence — Payments one door (GAP-06)

**Proof:** How they pay (S-05) is the only payments home. The Integrations hub is gone; old URLs redirect.  
**Date:** 2026-09-21  
**Surfaces:** `/studio/setup/payments` · `/studio/setup/payments/connect` · `/studio/integrations/pilot`  
**Pillar:** Confidence · Continuity

## Slice

| Before | After |
|--------|--------|
| Home → Integrations hub | Home → Payments |
| `/studio/integrations` page | Redirect → `setup/payments` |
| `/studio/integrations/payfast` | Redirect → `setup/payments/connect` |
| Pilot | Deep link from How they pay only |

`setup-integrations.page.ts` deleted (with GAP-01 dead list).

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/gap-01-08.test.ts
```

1. Open Home (not live) → Payments (not Integrations).
2. `/studio/integrations` lands on How they pay.
3. Pilot Back returns to How they pay.
