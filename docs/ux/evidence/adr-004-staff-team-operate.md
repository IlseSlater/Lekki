# Evidence — ADR-004 Staff shell · Team · Operate Overview

**When:** 2026-08-07  
**Decision:** [ADR-004](../../adr/004-three-human-experiences.md)

## Shipped

### Staff Experience (`/staff`)
- Own shell — no Setup · Grow · Team · Payments
- PIN entry → assigned Experience (Kitchen / Bar / Waiter / …)
- Shared device: Switch → next PIN → different Experience
- Boards live under `/staff/station/*` and `/staff/service`
- Legacy `/studio/kitchen|bar|waiter|service` redirect into Staff

### Studio Team (`/studio/team`)
- First-class mode in Studio chrome
- Experience Assignment first, then permissions refine
- Create / edit staff · PIN · role · permissions (`POST/PATCH /identity/staff`)

### Operate = Operations Overview
- Morning briefing + station health cards
- Cards open Staff Experience in **monitor** mode (`?monitor=1`) — read-only
- Foot links: Team · Staff Experience

## Prove locally

1. Studio → Team — list seed staff · change Experience · Save  
2. Open `/staff` — PIN `1111` (kitchen) → Kitchen board only  
3. Switch → PIN `3333` → Waiter  
4. Studio → Operate — cards open `/staff/...?monitor=1` without advancing tickets  

## Demo PINs (seed)

| Email | PIN | Experience |
|-------|-----|------------|
| kitchen@rustyoak.demo | 1111 | Kitchen |
| bar@rustyoak.demo | 2222 | Bar |
| waiter@rustyoak.demo | 3333 | Waiter |
| staff@rustyoak.demo | 4444 | Floor lead |

## Not yet

- Devices / login history / active sessions UI  
- Hard API permission gates per action  
- Owner monitor without any staff session needing org websocket join
