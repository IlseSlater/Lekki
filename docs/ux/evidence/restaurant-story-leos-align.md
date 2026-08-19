# Evidence — Restaurant story → LEOS align

**When:** 2026-08-07  
**Plan:** Align Restaurant App story → LEOS (reference behaviour only; ADR-001)

## Decision

Dark Culinary behaviours map into LEOS nouns. No dark glass theme, no `/manager` or Admin BI shell. Manager help → **Studio Operate Escalations**.

## Shipped

### P0 Dual assistance + Operate escalations
- Assistance kinds locked: `service` | `manager` (normalize aliases); one open per kind per session
- List filter `?kind=`; WS payloads already include `kind`
- Guest help sheet: **Request Waiter** · **Speak to Manager**; banners pending / on the way
- Staff Help: service actionable; manager read-only (“claimed in Studio Operate”)
- Studio Operate Escalations strip: Claim (ack) · Resolve · Force clear (`POST /sessions/:id/close` as owner, no staff token)
- Manager ack/resolve allowed without staff token; service still requires `staff.service`

### P1 Leave HCI
- Receipt “You’re finished” · Leave “Visit complete?” · CTA “I’m finished” → Entry
- HCI Leave / Complete → ✓

### P2 Offline flush
- Guest reconnect runs `offlineQueue.flush` for queued `transaction.create`

## Prove
1. Guest → Speak to Manager → Operate Escalations → Claim → Guest “Manager is on the way”
2. Guest → Request Waiter → Staff Help → Ack/Resolve
3. Operate Force clear ends table; Staff monitor cannot mutate
4. Leave after pay returns to Entry
5. Offline order recovers when API returns

## Hold
Admin BI · Admin heat map · dark Guest theme · claim/split · Return HCI · fleet · inventory · menu CRUD  
LEOS table pulse shipping (not Admin heat map) · Grow trading breath shipping (not revenue grids)
