# IA — Three Human Experiences × Studio

**Status:** Evolving (ADR-004) — was “two surfaces”; now **three humans · three experiences · one platform**  
**Constitution:** [NORTH-STAR](../NORTH-STAR.md) · [LEK-040](../LEK-040-human-experience-engineering.md) · [ADR-004](../adr/004-three-human-experiences.md)

## Naming

| Do not say | Say |
|------------|-----|
| Admin | **LEOS Studio** |
| Guest app (product) | **LEOS Experience** (Guest) |
| Staff app / POS | **LEOS Staff Experience** |
| Insights (product) | **Grow** (Studio mode) |
| Kitchen tablet in Studio | **Staff Experience · Kitchen** |
| Operate as floor work | **Operations Overview** (Studio) |
| Pack / Profile / Capability (in UI) | **Experience** / experience type |
| Choose Pack | **Choose Experience** / Create an experience |
| Menu / Catalog (as product nouns) | **Experience** (step) — Food, Drinks, Room Service, … |

**Live Experience** is the always-on Studio surface (not a Setup step). See [live-experience.md](live-experience.md).

Guest never learns Studio or Staff exists. Staff never learn Setup or Grow. Humans never see Pack — Packs are implementation only.

---

## Frozen IA rule (ADR-004)

**Every person sees only the world that matters to them.**

```text
                    LEOS
            ┌──────────────┐
            │ Core Platform │
            └──────┬───────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
   Owner         Staff          Guest
 LEOS Studio  Staff Experience  Experience
```

| Experience | Human | Job |
|------------|-------|-----|
| **Studio** | Owner · manager · admin | Manage the business |
| **Staff Experience** | Kitchen · bar · waiter · … | Do the work |
| **Guest Experience** | Guest | Enjoy the visit |

---

## Studio (owner)

```text
LEOS Studio
├── Home
├── Setup     ★ FROZEN v1 — Who → What → Where · How pay → Go Live
├── Operate   Operations Overview (calm mission control — not the kitchen tablet)
├── Grow      Trusted manager · almost invisible
├── Team      Staff · Experiences · Permissions · Devices · PINs
└── Settings  (as needed)
```

**Operate** = oversight (queues health · attention · payments · guests dining).  
Clicking a station may open Staff Experience in **monitoring** mode — never force owners to use staff chrome for oversight, and never force staff through Studio.

**Team** assigns **Experiences** (primary) then refines **permissions**.

Setup Engine story (Identity → Go Live) remains frozen. See below.

---

## Staff Experience

Own shell · own entry (PIN / staff login). No Setup · Grow · Team · Payments config.

Lands in the Experience assigned to that person (Kitchen · Bar · Floor/Waiter · …).  
Shared device: PIN → person → Experience.

---

## Guest Experience

```text
Discover → Join → Experience → Complete → Return
```

Routes: `/entry`, `/e/:token`, `/experience` (alias `/guest`). Minimal chrome.

---

## Experience Setup Engine (frozen)

**One engine. Infinite markets.** Experience type changes terminology, defaults, validation, capabilities, and Live Experience — never routes or page architecture.

**Live Experience** is permanent Studio chrome beside every Setup step — not a nav item, not a route.  
**Nav tells a human story** (each step answers one question):

```text
Who you are → What guests experience → Where they join → How they pay → Go Live
(+ Live Experience always on)
→ Operate → Grow
```

| Step (human) | Job |
|--------------|-----|
| Welcome | Calm start — create an experience |
| Choose Experience | Restaurant · Café · Hotel · Festival · Airport · Healthcare |
| Who you are | Name guests will recognise |
| What guests experience | Guest options — Live Experience updates instantly |
| Where they join | Tables · Pickup · Rooms · Zones |
| How they pay | Connect & settle — Live Experience updates |
| Go Live | Inevitable — same experience, now public · QR · Open Experience |
| Operate | Mission control |
| Grow | Calm truth |

Confidence Indicators measure **guest confidence**, not checklist completion. See [live-experience.md](live-experience.md).

**Rejected:** `/studio/setup/restaurant/menu` and any pack-specific route trees.  
**Rejected:** Live Experience as a Setup step or left-nav destination.

### Experience definition contract (Studio registry)

Studio reads an **Experience registry**. Pack packages remain internal.

| Field | Role |
|-------|------|
| `id` | Internal type key (e.g. `restaurant`) — maps to pack |
| `label` / `blurb` | UI: “Restaurant” · “Guests order and dine.” |
| `terminology` | item · place · station · … |
| `defaults` | venueName, place labels, seed token |
| `capabilities` | Flags (bill split, tipping, …) — not separate products |
| `setupHints` | Lead copy per engine step |

---

## Studio modes

| Mode | Job | Density | Opens on |
|------|-----|---------|----------|
| **Setup** | Get live / change config | Calm · Workspace whitespace | Progress · how close to live? |
| **Operate** | **Operations Overview** — owner mission control | Calm status · not floor chrome | Attention · queues health · not charts |
| **Grow** | Understand & expand | Calm analytics | Large numbers · human copy |
| **Team** | Staff · Experience Assignment · devices | Clear lists · invite · roles | Who can do what |

Studio = owner shell · one owner auth. Staff have a **separate** Staff Experience shell ([ADR-004](../adr/004-three-human-experiences.md)).

**Studio opens on status, not navigation** — morning briefing when live; empty workspace → Create your first experience. Nav is secondary.

---

## Routes

| Shell | Paths | Chrome |
|-------|-------|--------|
| Guest Experience | `/entry`, `/e/:token`, `/experience` (alias `/guest`) | Minimal; **no** Studio / Staff |
| Staff Experience | `/staff/*` — login · kitchen · bar · floor | Role Experience only; **no** Setup / Grow / Team |
| Studio | `/studio`, `/studio/setup/*`, `/studio/operate`, `/studio/grow`, `/studio/team` | Setup · Operate · Grow · Team |

Floor boards live under Staff. Legacy `/studio/kitchen|bar|waiter|service` redirect to `/staff/*`.

Legacy `/setup/*`, `/studio/choose`, `/studio/configure`, `/studio/golive`, `/studio/live` → Experience Engine routes.

## QR contract

- QR targets **Experience only** via canonical `/entry?token=…` (alias `/e/:token` still routes).
- Demo gallery only via `?demo=1` on `/scan` or Studio Open Experience.
- LAN-aware origins for phone scan on same network.

## Live Experience

Always-on projection of configuration into the guest journey (toggles → Live Experience). **Not** Canva. **Not** an editor. Same Experience Shell guests use after Go Live. Frozen: [live-experience.md](live-experience.md).

## Wireframes

- Experience: [wireframes/experience/](wireframes/experience/)
- Studio: [wireframes/studio/](wireframes/studio/)
