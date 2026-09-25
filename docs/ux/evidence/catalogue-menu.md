# Evidence — Catalogue menu

**Proof:** Home → `/studio/menu` → Live phone browse → Guest 86 path is one owned walk.  
**Date:** 2026-09-21  
**Surfaces:** Studio Home · `/studio/menu` · Live Experience phone · Guest browse  
**Pillar:** Continuity · Confidence  
**Story:** [S-12-catalogue.md](../stories/S-12-catalogue.md)

## Uncertainty removed

*What can guests order tonight?* — editor and phone agree; off-menu items do not appear.

## Slice

| Beat | Owner |
|------|--------|
| Door from Home | Catalogue noun (Menu · Board · …) |
| Editor | `studio-menu.page` · auto-save · import list |
| Phone on this URL | `studioLivePhone` → shell, unlocked catalogue |
| Guest 86 | `guestVisibleCatalogueItems` · `projectionItemsFromVenueCatalogue` |
| Not Setup | S-03 remains toggles only |

## HCI

| Axis | |
|------|--|
| PX | Change the list without a sixth Setup step |
| CX | Off tonight is gone from browse |
| DX | One desk helper; no sample menu on this route |
| OX | Unchanged |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/catalogue-lock.test.ts apps/web/src/app/studio/catalogue-guest-visibility.test.ts apps/web/src/app/studio/menu-list-import.test.ts
```

1. Home → Menu/Board → phone shows items, not arrival wash.
2. Toggle “On the menu tonight” off → Guest list drops it.
3. Import a CSV → rows appear; empty file is not a sample menu.

## Hold

Marketplace · Neo · extra Setup · inventory CRUD product.
