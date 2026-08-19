# Evidence — Waiter table orders + status tracking

**When:** 2026-08-07  
**Issue:** Waiter Active tables showed only order counts — no item names or Pending / Preparing / Ready.

## Fix

- `GET /operate/floor` now returns per-table `items[]` (label · qty · status · station) + `pendingCount` / `preparingCount` / `readyCount`
- Waiter list shows each line with status under the table
- Table detail expands every fulfilment line (not only the first)
- Open table hydrates instantly from floor payload, then refreshes from session

## Prove

1. Guest places food + drinks at T1  
2. `/staff` → Waiter PIN `3333`  
3. Active tables → Table T1 lists Burger / Lager / Flat White with Pending · Preparing · Ready  
4. Open › → same lines with station + Serve on Ready
