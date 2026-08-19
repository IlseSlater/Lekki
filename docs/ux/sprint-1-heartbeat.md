# Sprint board — Experience Heartbeat

**Mission:** [NORTH-STAR.md](../NORTH-STAR.md) · **Delivery OS:** [LEOS-DELIVERY-SYSTEM.md](../LEOS-DELIVERY-SYSTEM.md)  
**Exit gate:** Guest Experience Frozen — designer · FE · BE · zero clarification  
**Dashboard:** [platform-maturity.md](platform-maturity.md) · **Stories:** [stories/](stories/)

**Orchestrate:** **`Build Story G-05`** (Product freeze path) or **`Build Story G-06`** (Implementation path).  
Executive Orchestrator decides departments; Release Manager advances L0–L6.

```text
Vision ✅ · Architecture ✅ · Delivery OS ✅ · Interaction 🟡 · Implementation ⚪
```

No new architecture unless implementation exposes a real gap.

---

## Workstream 1 — Product Design (highest priority)

Freeze order = **platform value** (not chronology):

| Order | Screen | Frozen |
|------:|--------|--------|
| 1 | G-06 Live Order | [x] |
| 2 | G-05 Cart | [ ] IR |
| 3 | G-07 Payment | [ ] IR |
| 4 | G-03 Menu | [ ] IR |
| 5 | G-04 Item | [ ] IR |
| 6 | G-01 Entry | [ ] |
| 7 | G-02 Join | [ ] |
| 8 | G-08 Receipt | [ ] |
| 9 | G-09 Leave | [ ] |

Per screen: spec → LEK-028 → Critique → **Freeze**.

**Next freeze:** G-05 Cart — story [G-05-cart.md](stories/G-05-cart.md)  
**Next build:** G-06 — story [G-06-live-order.md](stories/G-06-live-order.md)

---

## Workstream 2 — Design System

After each freeze: *Reusable primitive?* → LEK-028 immediately. Never duplicate UI.

---

## Workstream 3 — Heartbeat Code (parallel)

Frozen ⇒ buildable now. Do not wait for 9/9.

```text
G-06 Frozen → Angular → Nest → Runtime → Playwright → Evidence
```

While freezing Cart, **build G-06**.

---

## Workstream 4 — Evidence

Per built Frozen screen: running UI · Playwright · event-trace · review-notes → `docs/ux/evidence/guest/{screen}/`

---

## Workstream 5 — Platform Proof

After Guest Running: Café profile · same heartbeat · zero core changes.  
Not Waiter / Kitchen / Hotel until then.

---

## Daily loop

1. Freeze one interaction  
2. Extract components  
3. Implement a previously Frozen interaction  
4. Capture evidence  
5. Update [dashboard](platform-maturity.md)

---

## Uncertainty removed

| Screen | Uncertainty |
|--------|-------------|
| Entry | Am I in the right place? |
| Join | Am I part of this experience? |
| Menu | What can I do? |
| Item | What am I choosing? |
| Cart | What am I about to commit to? |
| Live Order | Is everything progressing? |
| Payment | Did payment work? |
| Receipt | Is the experience complete? |
| Leave | Am I done? |
