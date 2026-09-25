# LEKKI-MAP

**Nav only** — how Lekki fits together. Not a LEK. Not process expansion.  
Daily board: [LEKKI-BUILD.md](LEKKI-BUILD.md) · Screens: [ux/lifecycle-and-screen-map.md](ux/lifecycle-and-screen-map.md)

---

## Product

**Lekki** builds one customer product: **LEOS** — The Experience Operating System.  
Restaurant is the first proof Pack. Same Platform; new markets = new Packs.

**LEO** = invisible engineering ops (coordinate one story).

---

## Four pillars + Platform

```text
LEOS
  Experience · Operations · Neo Intelligence · Ecosystem
        ↓ enabled by
  Platform (invisible)
  Entry · Context · Experience Runtime · Capability · Profiles
  Sessions · Events · Connectors · Marketplace
```

Pack nouns (kitchen, rooms, gates) stay in Packs — never in Platform.

---

## Human Experience Engineering

Every change improves **CX · DX · OX · PX** and reduces cognitive load, uncertainty, friction, confusion, time to value.  
[LEK-040](LEK-040-human-experience-engineering.md)

---

## Journeys (priority filter)

Provider: Create → Configure → Activate → Operate → Grow  
Experience: QR → Splash → Arrival → Menu heartbeat → Complete → Return  

Improve one or both — or do not build.

---

## Constitution (Frozen)

| Doc | Role |
|-----|------|
| [NORTH-STAR](NORTH-STAR.md) | Mission · Done · filter |
| [LEK-001](LEK-001.md) | Platform Rule + ADRs |
| [LEK-027](LEK-027-experience-interaction-catalogue.md) | Interactions |
| [LEK-028](LEK-028-component-catalogue.md) | Components |
| [LEK-029](LEK-029-experience-composition.md) | Composition / wireframes |
| [LEK-040](LEK-040-human-experience-engineering.md) | HXE |
| [Delivery OS](LEOS-DELIVERY-SYSTEM.md) | Design→Contracts→Build→Verify→Release |

Phase = **Construction**. ~95% build / 5% doc. Software is the documentation.

---

## Runtime path (QR → session)

Entry → Context (+ Profile) → Experience Session → Capability (fulfilment/payment) → Outbox → Socket.IO  

Code: `packages/runtime/*` · `packages/profile-engine` · `packs/restaurant` · `connectors/*` · `apps/runtime` · `apps/web`

---

## Success triad

1. Business go-live in minutes?  
2. Guest scans QR → delightful experience?  
3. New market as Pack without Platform change?  

If yes → continue. If not → fix the platform.

---

**Architecture changes only when running software demands it.**

| | |
|--|--|
| Mission | OS for human experiences |
| Phase | **Hospitality Phase** |
| Current Proof | GAP-01…GAP-08 closed or Hold-locked |
| Next Proof | Continuity polish if named — not Marketplace / Neo |
| Platform Confidence | High |
| Construction | One journey · all layers · then stop |
| Platform Proof Index | Restaurant ✓ · Café ✓ · Packs ✓ · Go Live QR ✓ · Guest heartbeat ✓ |

**Three Green:** Running · Proven · Reusable.  
**Commit test:** Did this make LEOS a better OS for human experiences?

Daily board: [LEKKI-BUILD.md](LEKKI-BUILD.md)
