# Operate WebSocket rooms

**When:** 2026-08-07  
**Source:** Restaurant App kitchen / bar / waiters rooms

## Rooms

| Room | Joined by | Events |
|------|-----------|--------|
| `org:{id}:session:{sessionId}` | Guest | Fulfilment*, Payment*, Session* |
| `org:{id}:operate:kitchen` | Kitchen staff | Fulfilment* for kitchen stations |
| `org:{id}:operate:bar` | Bar staff | Fulfilment* for bar stations |
| `org:{id}:operate:waiter` | Waiter | Fulfilment*, Transaction*, Session*, Assistance* |
| `org:{id}:operate:staff` | Staff hub | All operate rooms |

## Also

- `FulfilmentStatusChanged` payload includes `stationId`
- `AssistanceRequested` / `AssistanceResolved` outbox events
- Station + Waiter: socket primary · poll fallback 8s / 4s

## Files

`leos.gateway.ts` · `leos.service.ts` · `leos-api.service.ts` · `station.page.ts` · `service.page.ts`
