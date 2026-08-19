# Platform Dashboard

**Mission:** [NORTH-STAR.md](../NORTH-STAR.md) (**Frozen**) · **HXE:** [LEK-040](../LEK-040-human-experience-engineering.md)  
**Delivery OS:** [LEOS-DELIVERY-SYSTEM.md](../LEOS-DELIVERY-SYSTEM.md) (**Frozen**)  
**Board:** [sprint-1-heartbeat.md](sprint-1-heartbeat.md) · **Stories:** [stories/](stories/)  
**Only Release Manager advances maturity.**

### Current state

| Vision | Architecture | Interaction | Components | Implementation | Delivery OS |
|--------|--------------|-------------|------------|----------------|-------------|
| Frozen | Frozen | In progress | Growing | Starting | Active |

---

## 1 — Product (Guest) — maturity L0–L6

```text
L6 Frozen bars (target 9/9):
G-06  ★★★★★★☆  L3+ (spec Frozen; Build pending)
G-05  ★★★☆☆☆☆  L1–L2 (IR; components/review pending)
G-07  ★★★☆☆☆☆  IR
G-03  ★★★☆☆☆☆  IR
G-04  ★★★☆☆☆☆  IR
G-01  ★☆☆☆☆☆☆  thin
G-02  ★☆☆☆☆☆☆  thin
G-08  ★☆☆☆☆☆☆  thin
G-09  ★☆☆☆☆☆☆  thin
```

| Screen | Level | Story |
|--------|------:|-------|
| G-06 Live Order | ~L3 | [G-06-live-order.md](stories/G-06-live-order.md) |
| G-05 Cart | ~L1–2 | [G-05-cart.md](stories/G-05-cart.md) |
| Others | see board | [sprint-1-heartbeat.md](sprint-1-heartbeat.md) |

**Guest Experience Frozen** = 9/9 at L6.  
**Guest Running** = heartbeat end-to-end.  
**Guest Proven** = Café · zero core changes.

---

## 2 — Components (LEK-028)

| | Count |
|--|------:|
| Discovered | ~21 |
| Frozen | **6** |
| Implemented in UI | scaffold / partial |

Next freeze candidates: Cart Summary · Line Item Row · Order Total  

---

## 3 — Code (Heartbeat)

| | Status |
|--|--------|
| Routes | Scaffold |
| Commands / Events | Partial |
| Tests | Smoke / partial |
| Next Build | **G-06** (story L3+) |

---

## 4 — Platform (Profiles)

| Profile | Heartbeat |
|---------|-----------|
| Restaurant | ■ in progress |
| Café | □ proof target |
| Hotel · Spa | □ |

---

## Knowledge / Questions

- [knowledge/](knowledge/README.md) · [questions/](../questions/_TEMPLATE.md)  

## Daily / delivery loop

`Build Story G-0X` → Executive Orchestrator → departments → Release Manager updates this dashboard.
