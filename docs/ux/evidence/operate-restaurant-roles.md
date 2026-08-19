# Evidence — Restaurant/café Operate roles in Studio

**Date:** 2026-08-06  
**Sources:** Restaurant App waiter · kitchen · bar · staff (admin/manager BI deferred)

## Mapping

| Restaurant App | LEOS Studio | When |
|----------------|-------------|------|
| Kitchen board | `/studio/station/kitchen` (+ `/studio/kitchen`) | Restaurant |
| Bar board | `/studio/station/bar` (+ `/studio/bar`) | Restaurant |
| Counter / barista | `/studio/station/counter` | Café |
| Waiter dashboard | `/studio/service` **Waiter** — Ready · Help · Visit | Restaurant / café (café: Floor) |
| Staff login redirect | `/studio/operate/staff` role doors | Restaurant / café |
| Admin menu/tables CRUD | Setup (frozen) — not Operate | — |
| Manager BI / System-admin | Out of Operate craft | Deferred |

## Shipped

- Operate hub: station doors + multi-station glance  
- Shell nav: Now · Kitchen · Bar · Floor (or Counter · Floor) · Staff  
- Floor: Ready to serve (mark served) · Help · This visit  
- Staff: Who’s operating? → station  

## Files

`operate-stations.ts` · `setup-operate.page.ts` · `service.page.ts` · `operate-staff.page.ts` · `studio-shell` · `app.routes` · `_studio.scss`
