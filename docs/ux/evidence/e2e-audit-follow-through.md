# Evidence — E2E audit follow-through

**When:** 2026-08-07  
**Plan:** End-to-end docs vs running software

## Shipped

### P0 API Experience gates
- Staff login returns HMAC `token` + `StaffSession` row
- `PATCH /fulfilments/:id/status` requires staff token + `fulfilment.update` + station Experience
- Assistance ack/resolve requires `staff.service`
- Session close: guest OK without token; staff clear requires `session.close`
- WS operate rooms require staff token
- Permission IDs aligned (`fulfilment.update`; `fulfilment.write` alias)
- Monitor (`?monitor=1`) does not attach staff token (HTTP + WS) — server rejects writes without token

### P0 Guest HCI
- Status timeline rendered on live orders
- Guest chrome shows venue name after join
- `/scan` demos only with `?demo=1`

### P0 Staff leaks
- Removed Staff → Studio Team link
- Foot doors filtered by Experience role

### P1 Live Experience
- Projection tabs = Menu · Orders · Bill (production grammar)

### P1 Team
- Devices · Sessions (login history) · End session

### P2 Hygiene
- operate-craft retitled for Staff floor vs Studio overview
- Dead `operate-staff.page.ts` removed
- Session key `leos.staff.session`
- LEKKI-BUILD HCI Wait/Receive/Arrival updated

## Prove
1. Staff PIN → advance ticket (needs token)  
2. Without token, PATCH fulfilment → 401  
3. Guest live phase shows timeline  
4. Team → Devices / Sessions tabs  
5. `/scan` without `?demo=1` has no demo chips
