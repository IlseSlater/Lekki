# Operate status flow — restaurant alignment

**When:** 2026-08-06  
**Source:** Restaurant App kitchen / bar / waiter / customer status rules

## Flow (restaurant)

| Role | Path | Copy |
|------|------|------|
| Kitchen | PENDING → PREPARING → READY | Start prep › · Mark ready › · **Waiter serves ›** |
| Bar | PENDING → PREPARING → READY | Start pouring › · Drinks ready › · **Waiter serves ›** |
| **Waiter** | READY → SERVED | Served › / Mark next served |
| Guest | Pending · Preparing · Ready · Served | Ready banner: *Your waiter is on the way with your order.* |

Kitchen/bar **cannot** mark served from their own board — Ready opens **Waiter** (`/staff/service?tab=ready`). Kitchen and Bar may complete that handoff there (their station only). Waiter serves every ready ticket.

## Café variant

Counter advances READY → Collected. Guest ready banner: counter collect. Role label stays **Floor**.

## Shared helper

`apps/web/src/app/studio/operate-status.ts` — station · waiter/floor · guest labels/actions/banners.

## Wired

- Station (`station.page.ts`) — handoff to Waiter
- Waiter (`service.page.ts`) — role header Waiter
- Operate doors / nav (`operate-stations.ts`) — Waiter door
- Guest orders + ready banner (`guest-orders` · `guest.page` · `progress-timeline`)
