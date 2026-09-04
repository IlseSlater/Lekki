# Continuity — Guest place = Kitchen place

## Lie fixed
Guest showed **Table 1**; Kitchen invented **Table 20** by hashing the fulfilment id against Studio’s place list.

## Truth
Kitchen / Waiter place labels use the session’s `physicalContext.code` (same field Guest sees), returned on `GET /fulfilments/station/:stationId` as `placeCode`.

## Files
- `apps/runtime/src/http/fulfilment.controller.ts` — include session.physicalContext
- `apps/web/src/app/studio/place-continuity.ts` (+ test)
- `apps/web/src/app/pages/station.page.ts` — no hash invent
- `apps/web/src/app/pages/service.page.ts` — ready / help use real place

## Proof
`node --import tsx --test apps/web/src/app/studio/place-continuity.test.ts` — pass
