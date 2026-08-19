# LEOS Implementation

See [README.md](../README.md) for quick start.  
**Daily board:** [LEKKI-BUILD.md](LEKKI-BUILD.md) — Vision · Roadmap · Milestone · Sprint · Story · Blockers · Done.

## Building Lekki (not writing documents)

Phase 1 Foundation is **Done**. Phase 2 = first vertical slice (Restaurant proves the platform).

**Mindset:** *Which experience are we shipping this week?*  
**Immutable:** Built by completing experiences, not by completing documents.  
**Instruct LEO:** `Continue building Lekki` or `Build Story G-0X` — one frozen contract at a time.

| Doc | Status |
|-----|--------|
| [LEKKI-BUILD.md](LEKKI-BUILD.md) | **Daily master** |
| [LEK-001](LEK-001.md) Platform Constitution | **Frozen** |
| [LEK-027](LEK-027-experience-interaction-catalogue.md) Interaction Spec | **Frozen** |
| [LEK-040](LEK-040-human-experience-engineering.md) Human Experience Engineering | **Frozen** |
| [NORTH-STAR.md](NORTH-STAR.md) | **Frozen** |
| [Delivery OS](LEOS-DELIVERY-SYSTEM.md) | **Frozen** |

**Next:** `Build Story G-06` → finish Experience Journey → Provider/Studio slice → Café (zero core changes).

## Current milestone — First vertical slice

See [LEKKI-BUILD.md](LEKKI-BUILD.md).  
**Mission:** [NORTH-STAR.md](NORTH-STAR.md) · **HXE:** [LEK-040](LEK-040-human-experience-engineering.md) · **Delivery:** [LEOS-DELIVERY-SYSTEM.md](LEOS-DELIVERY-SYSTEM.md)  
**Dashboard:** [ux/platform-maturity.md](ux/platform-maturity.md) · **Stories:** [ux/stories/](ux/stories/)

```text
Phase 1 Foundation ✅ · Phase 2 Restaurant vertical slice 🟡 · Café ⚪
```

**Orchestrate:** `Build Story G-06` or `Continue building Lekki`

No new architecture unless implementation exposes a real problem.

```text
QR → Join → Menu → Item → Cart → Submit → Kitchen
  → Live Order → Payment → Receipt → Leave
```

**Guest Running:** [REFERENCE-IMPLEMENTATION-CHECKLIST.md](REFERENCE-IMPLEMENTATION-CHECKLIST.md) · then **Café** proof (Guest Proven).

## Phase 1 Architectural Proof

This codebase proves:

- Runtime separation (`packages/runtime/{entry,context,experience,capability}`)
- Profile Engine (`packages/profile-engine`)
- Pack isolation (`packs/restaurant`)
- Capability resolution — payment binding swap via `PAYMENT_CONNECTOR` (`manual` | `fake` | `payfast`); fulfilment routed through `FulfilmentCapability` (`connectors/manual-payment`, stateless so it survives restarts)
- Phase 2 PayFast connector (`connectors/payfast` — signed form checkout, ITN notify + validate, binding-only swap)
- Setup Studio payments onboarding (LEK-022) at `/setup/payments` — draft, verify, activate hot-swap
- Event architecture (outbox + in-process bus + Socket.IO projections; `PaymentFailed` on the failure path)
- Health/liveness (`GET /health` — service + database status)

## Platform Rule

Every feature belongs in Entry Runtime, Context Runtime, Experience Runtime, Capability Runtime, Profile Engine, Experience Pack, or Connector.

Ask of every screen / API / event: *What runtime renders or owns this? What component composes this? What profile enables this? What capability powers this? What events describe it?*

### Specification compass

Every core LEK must answer: **Does this make LEOS more reusable across experiences?**

If a document answers *“How does the restaurant work?”* instead of *“How does LEOS work?”*, that content belongs in the **Restaurant Experience Pack**, not in the core specification set (001, 026–037).

Steal **behaviour and proof**; keep **runtimes and components** LEOS-owned ([ADR-003](adr/003-reference-experience-rule.md)).

North Star (unchanged): every person arrives at any participating organisation, identifies once, enters through a trusted interaction, and receives a seamless experience — via Entry → Context → Experience → Capability, profiles, and packs — not via a restaurant-shaped core.

## Specification set (executable)

### Frozen foundation

| Document | Role |
|----------|------|
| [LEK-001 Platform Constitution](LEK-001.md) | **Frozen** — ADR-only changes |
| [LEK-027 Experience Interaction Specification](LEK-027-experience-interaction-catalogue.md) | **Frozen** — product bible (intentional gaps listed, not TODOs) |

### Dual streams (active)

```text
027 Frozen
    ├─ Stream A Experience Design          ├─ Stream B Platform
    │  LEK-026 LEDS                        │  LEK-031 Entry Runtime
    │  LEK-028 Components  ← consumes 026  │  LEK-032 Context (next)
    │  LEK-029 Composition & Wireframes    │  LEK-033 Experience
    │  LEK-030 IA (next)                   │  LEK-034 Capability
    │  Experience Profiles                 │  LEK-035 Profile Engine
    └──────────────┬───────────────────────┘
                   ▼
            LEK-036 Domain → LEK-037 API → Build
```

| Stream | Document |
|--------|----------|
| Design | [LEK-026 LEDS](LEK-026-leds-visual-language.md) |
| Design | [LEK-028 Component Catalogue](LEK-028-component-catalogue.md) |
| Design | [LEK-029 Composition & Wireframes](LEK-029-experience-composition.md) (Guest UX contract frozen for heartbeat) |
| Platform | [LEK-031 Entry Runtime](LEK-031-entry-runtime.md) |
| Acceptance | [Reference Implementation Checklist](REFERENCE-IMPLEMENTATION-CHECKLIST.md) |
| Behaviours | [LEK-038 Behaviour Inventory](LEK-038-behaviour-inventory.md) |

### Convergence (later)

LEK-036 Domain & Data Model → LEK-037 API Catalogue → production build order (contracts → domain → runtime → Prisma → Nest → Angular → Restaurant Pack → connectors → heartbeat → second profile → Setup → Marketplace → Neo).

## UI / UX foundation (before Figma / LEDS polish)

| Document | Role |
|----------|------|
| [Guest Experience Inventory](ux/guest-experience-inventory.md) | Phase 1 · design by reuse (Menu→Item→Cart→Payment→…) · Frozen criteria |
| [G-03 Menu](ux/wireframes/guest/menu.md) · [G-04 Item](ux/wireframes/guest/item.md) | ✅ Core commerce specs |
| [Experience Design Principles](ux/LEOS-experience-design-principles.md) | UX constitution |
| [Layout Grammar](ux/layout-grammar.md) | Anatomy |
| [LEK-028](LEK-028-component-catalogue.md) | Components extracted as you design |
| [UX index](ux/README.md) | Entry point |

**Phase 1:** Finish Guest inventory before coding depth / Prisma / Setup / Neo.

## UI / UX (LEOS / LEDS)

Guest and staff surfaces follow LEDS tokens and Experience Grammar:

- **Warm-minimalist palette** — Warm Sand surfaces, Deep Emerald (`#0D3A2F`) primary actions, Electric Cyan Neo dock
- **Token geometry** — 24px card radius, 12px button/input radius
- **Experience Grammar** — one purpose, one primary action, success state, escape route, help text per screen
- **Visual selection cards** — entry profile picker (not radio buttons)
- **Neo Dock** — passive bottom-right indicator (no popups)
- **Profile terminology** — labels from Experience Profile via Profile Engine (`TerminologyService`)
- **Adaptive layouts** — guest micro layout; station operator layout (large touch targets)

Tokens: `apps/web/src/styles/_tokens.scss` and `_leos.scss` (canonicalised in LEK-026).

**Setup Studio payment screens (UX inventory):** [`docs/ux/setup-studio-payment-connector-screens.md`](ux/setup-studio-payment-connector-screens.md).

## Verification

```bash
pnpm run dev         # Postgres + runtime + web, one command
pnpm run build:packages
pnpm run build --filter @lekki/runtime-app
pnpm run check:nouns
pnpm run check:payfast
pnpm run proof
pnpm run e2e:smoke   # Docker Postgres + runtime + heartbeat
```

## Document triad

| Document | Role |
|----------|------|
| [LEK-001](LEK-001.md) | Constitution (**Frozen**) |
| [LEK-027](LEK-027-experience-interaction-catalogue.md) | Interaction Specification (**Frozen**) |
| [LEK-026](LEK-026-leds-visual-language.md) / [LEK-028](LEK-028-component-catalogue.md) | Design stream |
| [LEK-031](LEK-031-entry-runtime.md) | Platform stream (Entry) |
| `C:\Restaurant App` | Reference experience only |
