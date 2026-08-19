# Operate staff accounts + role views

**When:** 2026-08-06  
**Source:** Restaurant App staff login · waiter / kitchen / bar boards · LEK-027 Waiter Login + Floor gaps

## Accounts (seed)

| Person | Email | PIN | Home view |
|--------|-------|-----|-----------|
| Alex · Kitchen | kitchen@rustyoak.demo | 1111 | `/studio/kitchen` |
| Sam · Bar | bar@rustyoak.demo | 2222 | `/studio/bar` |
| Jordan · Waiter | waiter@rustyoak.demo | 3333 | `/studio/waiter` |
| Riley · Staff | staff@rustyoak.demo | 4444 | `/studio/operate` (hub) |

PIN is the staff password on existing `StaffMember` — not a new platform identity model.

## Flow

Staff login → PIN → role home. Nav shows only that role’s door (Staff sees all). Kitchen/Bar queues gated. Waiter: **Active tables · Ready · Help** + Clear table.

## API

- `GET /identity/staff` · `POST /identity/staff/login` (+ `role`, `homePath`)
- `GET /operate/floor` — live sessions / tables
- Fulfilments include `sessionId` for table place labels

## Tables

Seed T1–T4 with QR `qr-demo-restaurant`, `-t2`, `-t3`, `-t4`.
