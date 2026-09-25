# Guest Experience Inventory

**Authoritative journey:** [lifecycle-and-screen-map.md](lifecycle-and-screen-map.md)  
**HCI lock:** [current-product-state.md](current-product-state.md) — Arrival → Return **running**  
**Evidence:** [evidence/guest/](evidence/guest/README.md)

Status below is **the app**, not the old freeze queue.

```text
Running = in `guest.page` / entry / splash
Craft remaining = named GAP or continuity polish
Hold = constitution Never
```

## Board (running)

| # | Screen | Spec | In app |
|---|--------|------|--------|
| — | Splash | G-01 | `/splash` · 4s Lekki mark |
| — | Venue landing | G-01 · S-02 look | `phase === 'arrival'` · Get started → menu |
| G-01 | Entry | [entry.md](wireframes/guest/entry.md) · [G-01-entry.md](stories/G-01-entry.md) | `/entry` · `/splash` · `arrival` |
| G-02 | Join | [join.md](wireframes/guest/join.md) · [G-02-join.md](stories/G-02-join.md) | Folded into G-01 — not a screen |
| G-03 | Menu | [menu.md](wireframes/guest/menu.md) · [G-03-menu.md](stories/G-03-menu.md) | `browse` · **L6** |
| G-04 | Choices | [g04-choices-sheet.md](g04-choices-sheet.md) · [G-04-choices.md](stories/G-04-choices.md) | Sheet · **Shipped** |
| G-05 | Cart | [cart.md](wireframes/guest/cart.md) | `cart` · **L6** |
| G-06 | Live order | [live-order.md](wireframes/guest/live-order.md) | `live` · **L6** |
| G-07 | Payment | [payment.md](wireframes/guest/payment.md) | `payment` · **L6** |
| G-08 | Receipt | [receipt.md](wireframes/guest/receipt.md) · [G-08-receipt.md](stories/G-08-receipt.md) | `receipt` |
| G-09 | Leave | [leave.md](wireframes/guest/leave.md) · [G-09-leave.md](stories/G-09-leave.md) | `leave` · not a dock tab |
| — | Specials | Specials Continuity | `specials` · tab if Studio on |
| — | Help | Help Continuity | overflow **More** |

**Guest dock (running):** Specials (if on) · Menu · Orders · Bill · More (Help). Cart is the **Your order** chip. Leave is on receipt, not the bar.

**Out of bounds:** Marketplace · Neo · Guest account wall · extra Setup · Admin BI.
