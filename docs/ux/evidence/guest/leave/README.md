# Evidence — G-08 / G-09 Leave

**Uncertainty removed:** Am I done?

| Case | Evidence |
|------|----------|
| Clear done state | Receipt purpose + leave copy |
| Leave closes session | `POST /sessions/:id/close` · e2e |
| Context freed | Heartbeat e2e “PhysicalContext free” |

Leave is production-path green for Restaurant. Pack terminology on receipt + close CTA (`physicalContext` / `close`) shipped — Receipt's title, leave prompt, confirm title, and close CTA all read the venue's own words (table / stay / zone / bay / board), not a hardcoded Restaurant default.

```bash
node --import tsx --test apps/web/src/app/studio/receipt-leave-terms.test.ts
```

Verified live across Restaurant (`clear your table` · "You're finished") and Hotel (`end your stay session` · "Your stay is complete") — distinct copy per Pack, not a shared fallback.
