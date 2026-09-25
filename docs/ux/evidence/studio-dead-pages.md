# Evidence — Dead Studio pages (GAP-01)

**Proof:** Unrouted Studio leftovers are gone. Old URLs still redirect to the engine. No preview product.  
**Date:** 2026-09-21  
**Surfaces:** `apps/web/src/app/pages/` · `app.routes.ts` redirects  
**Pillar:** Confidence (engineers) · Continuity  

## Deleted (do not restore)

| File | Why it was dangerous |
|------|----------------------|
| `studio-live.page.ts` | Second Live / preview |
| `setup-golive.page.ts` | Duplicate vs `setup-golive-engine.page.ts` |
| `setup-hub.page.ts` | Feature-grid Setup |
| `studio-configure.page.ts` | Pre-engine configure |
| `studio-choose.page.ts` | Pre-engine choose |
| `setup-organisation.page.ts` | Pre-engine org |
| `setup-integrations.page.ts` | Second payments home (GAP-06) |

Redirects stay: `/studio/live` → Go Live · `/studio/choose` → create · `/studio/configure` → identity · `/studio/organisation` → identity · `/studio/integrations` → How they pay.

`leos-neo-dock` remains unimported (**GAP-02** Hold locked).

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/dead-pages.test.ts
```

## Hold

Marketplace · Neo · extra Setup · wiring a preview page.
