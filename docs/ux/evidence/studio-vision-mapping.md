# Evidence — Studio vision mapping

**When:** 2026-08-07  
**Plan:** Studio features — LEOS vision mapping

## Decision

Restaurant Admin intentions map into LEOS craft — **not** an Admin BI shell.

| Intention | LEOS | Status |
|-----------|------|--------|
| Revenue panels | Grow calm trading breath (prose) | Shipped |
| Floor heat map | Operate table pulse | Shipped |
| Claim/split · Pay for Others · loyalty · wallets | Experience (+ caps later) | **HOLD** Continuity |
| Fleet sysadmin | Multi-venue later | **HOLD** |
| Inventory CRUD | Pack tools later | **HOLD** |
| Admin BI · dark glass · menu CRUD · code copy | Vision pollution | **HOLD** forever |

ADR-001: behaviour reference only.

## Shipped

### Grow calm trading breath
- Soft-amend [grow-craft.md](../grow-craft.md): one trading figure in prose allowed; grids still Never
- `GET /grow/overview` returns `takingsToday` · `takingsYesterday` · `popularLabel`
- Grow page: “Tonight you took R…” · favourite from live lines · one suggestion

### Operate table pulse
- Floor pulse tiles on Operate: calm · prep · ready · attention
- Idle / help / manager breathe; link to Staff monitor
- Not a spatial Admin heat map

## Prove
1. Grow → calm trading line without charts  
2. Operate → Floor pulse shows tables that need a glance  
3. Staff / Guest never see Grow revenue chrome

## HOLD (Continuity — not now)
Claim/split · loyalty tiers · multi-wallet · fleet · inventory  
Return HCI shipped (device Welcome back — not CRM)
