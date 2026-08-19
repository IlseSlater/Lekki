# Operate SLA / idle pulses

**When:** 2026-08-07  
**Source:** Restaurant App kitchen pending >10m · waiter idle ≥15m

## Rules

| Surface | Signal | Threshold |
|---------|--------|-----------|
| Kitchen / Bar | Pending pulse + age `Nm` | Pending / New **> 10m** |
| Waiter tables | Row pulse + *needs a look* | Idle **≥ 15m** |

Helper: `apps/web/src/app/studio/operate-pressure.ts`  
Fulfilments list includes `createdAt`.
