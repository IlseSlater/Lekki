# Guest Experience Inventory

**North Star:** Guest Experience Frozen — designer · FE · BE · zero clarification  
**Board:** [sprint-1-heartbeat.md](sprint-1-heartbeat.md) · **Dashboard:** [platform-maturity.md](platform-maturity.md)  
**Constitution:** [BUILDING-LEOS.md](../BUILDING-LEOS.md)  
**Evidence:** [evidence/guest/](evidence/guest/README.md)  
**Rules:** [ADR-003](../adr/003-reference-experience-rule.md) · [LEK-038](../LEK-038-behaviour-inventory.md)

```text
Not Started → IR → Frozen → Running (Implemented) → Validated (Evidence)
```

**Frozen** = implementable with no clarification. Build Frozen screens **in parallel** with freezing others.

---

## Board (platform-value freeze order)

| # | Screen | Spec | Status | Build |
|---|--------|------|--------|-------|
| 1 | G-06 Live Order | [live-order.md](wireframes/guest/live-order.md) | **Frozen** | **L6** |
| 2 | G-05 Cart | [cart.md](wireframes/guest/cart.md) | **Frozen** | **L6** |
| 3 | G-07 Payment | [payment.md](wireframes/guest/payment.md) | **Frozen** | **L6** |
| 4 | G-03 Menu | [menu.md](wireframes/guest/menu.md) | IR | After Freeze |
| 5 | G-04 Item | [item.md](wireframes/guest/item.md) | IR | After Freeze |
| 6 | G-01 Entry | [entry.md](wireframes/guest/entry.md) | Thin | |
| 7 | G-02 Join | [join.md](wireframes/guest/join.md) | Thin | |
| 8 | G-08 Receipt | [receipt.md](wireframes/guest/receipt.md) | Thin | |
| 9 | G-09 Leave | [leave.md](wireframes/guest/leave.md) | Thin | Guest Tab Bar → confirm |

**Guest chrome (Frozen IA):** Bottom tab bar **Menu · Orders · Bill · Help · Leave** + floating **Your order** chip — Lekki theme; behaviour reference dark-culinary (labels only). See [Restaurant Pack UX Constitution](restaurant-pack-ux-constitution.md) §7.

**Frozen: 3+ / 9** · **Restaurant Complete** · Café path e2e · Next: Café Proven / Hotel Pack

---

## Workstreams

1. Product Design — freeze board above  
2. Design System — LEK-028 on every freeze  
3. Heartbeat Code — parallel on Frozen  
4. Evidence — first-class  
5. Platform Proof — Café after Guest Running  

**Out of bounds:** New architecture · Waiter/Kitchen/Hotel · Setup/Marketplace/Neo before Guest Proven.
