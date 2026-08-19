# Waiter table detail

**When:** 2026-08-07  
**Source:** Restaurant App waiter drawer (Active / History · Served · Clear table)

## Behaviour

- Active tables → **Open ›** opens table detail  
- Active / History item tabs  
- Ready items: **Served ›** (LEOS `delivered`)  
- Pending / Preparing: status only (Kitchen/Bar owns)  
- **Clear table** ends the visit  
- Live refresh via Operate waiter WebSocket room  

## API

`GET /sessions/:id` returns `placeCode` + labelled fulfilment lines.
