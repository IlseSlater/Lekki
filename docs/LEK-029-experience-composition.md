# LEK-029 — Experience Composition & Wireframes

**Status:** Active (Design stream) v0.1  
**Title:** Experience Composition & Living Wireframe Specification  
**Depends on:** [LEK-027](LEK-027-experience-interaction-catalogue.md) (Frozen), [LEK-028](LEK-028-component-catalogue.md), [LEK-026](LEK-026-leds-visual-language.md), [LEK-040](LEK-040-human-experience-engineering.md) (Frozen) · [North Star](NORTH-STAR.md)  
**Not this document:** High-fidelity UI, colour, typography (those stay in LEDS / Figma later)  
**Note:** Wireframes live here — **not** in LEK-028. LEK-028 remains the platform **Component Catalogue**.  
**Milestone:** §3 Guest journey UX contract + **state-based wireframes** in [docs/ux/wireframes/guest/](ux/wireframes/guest/README.md) (Complete for low-fi). See [REFERENCE-IMPLEMENTATION-CHECKLIST.md](REFERENCE-IMPLEMENTATION-CHECKLIST.md).

LEK-027 says **what** happens. These wireframes say **how people move through it**. The Guest Restaurant path is not “another flow” — it is the **canonical proof** that LEOS executes. It happens to use the Restaurant Experience Pack.

Design **experiences**, not isolated pages. Each section is one actor journey. Pack copy (e.g. “Rusty Oak”, “Table 14”) is illustrative Profile/Pack content — ownership stays on LEOS runtimes and [LEK-028](LEK-028-component-catalogue.md) components.

---

## 1. Wireframe contract (every screen)

```text
────────────────────────────
Screen Name
────────────────────────────
Behaviour: Proven ✓ Restaurant  |  New — LEOS Native
Intent
Runtime Owner
Pack
Capability
────────────────────────────
Layout (ASCII)
────────────────────────────
Components (LEK-028)
────────────────────────────
Actions → Command → Events
────────────────────────────
Navigation / Routes
────────────────────────────
```

**Behaviour badge** (required): see [LEK-038](LEK-038-behaviour-inventory.md) · [ADR-003](adr/003-reference-experience-rule.md).

Low-fidelity boxes only. No visual polish. The wireframe **is** documentation.

---

## 2. Wireframe DSL (executable intent)

Describe once; derive wireframes, Angular shells, Playwright, docs, a11y, Setup previews later.

```yaml
# Example — Guest Menu
screen: Guest.Menu
experience: RestaurantDining
journey: Guest
intent: Help a guest discover items and add them to an active transaction
runtime: Experience
pack: restaurant
capability: none

layout:
  header: SessionHeader
  body:
    - SearchSurface
    - FilterBar
    - EntityCardGrid
  footer:
    - CartSummary
  chrome:
    - NeoDock

actions:
  - name: ViewItem
    command: null
    events: [ItemViewed]          # analytics / soft event; domain optional
    navigation: Guest.ItemDetail
  - name: SubmitOrder
    command: CreateTransaction
    events: [TransactionCreated, FulfilmentCreated]
  - name: Pay
    command: RequestPayment
    events: [PaymentRequested]
    navigation: Guest.Payment

routes:
  path: /guest
  next: Guest.Cart
  back: Guest.Join
```

Parser / codegen is future work. YAML (or equivalent) in this LEK is the **source of truth** for composition; ASCII below is the human rendering of the same idea.

---

## 3. Experience: Restaurant Dining — Guest

**UX contract status: Frozen for Heartbeat Reference Implementation**  
**Screen IDs:** [Screen Inventory — Guest G-01…G-09](ux/screen-inventory.md)  
**Design foundation:** [docs/ux/README.md](ux/README.md)  
Only Intent · Components · Actions · Navigation · Events · Runtime owner matter for this milestone. Do not expand Waiter/Manager/Hotel until Guest is **Done** in the inventory.

### Interaction standard (Frozen)

**Restaurant Pack UX Constitution:** [docs/ux/restaurant-pack-ux-constitution.md](ux/restaurant-pack-ux-constitution.md) — **Frozen**

Canonical guest moments (browse → pay). Inherited by café, hotel room service, and future catalogue+options Packs where applicable.

| # | Pattern | Guest rule |
|---|---------|------------|
| 1 | Browse ≠ shopping | Venue header · sticky chips · list cards · floating order summary |
| 2 | One sheet | All choices on one Item sheet — no wizard |
| 3 | Required first | Gate Add; upsell later |
| 4 | Combos = products | Product + choice groups — not special code |
| 5 | Cart = 2nd sale | Your order → People also add → Continue |

**Human Confidence copy:** Prefer *Choose one / Extras / Special requests / Add to order / Your order* over *Customize / Modifiers / Required / Cart*.

### Journey map

```text
Entry
  ↓
Join Session
  ↓
Browse                    ← never feels like shopping
  ↓
Open item
  ↓
Choose required options   ← one sheet
  ↓
Optional extras
  ↓
Add → Added ✓
  ↓
Continue browsing
  ↓
Your order                ← second sales opportunity
  ↓
People also add
  ↓
Pay
  ↓
Receipt
  ↓
Exit
```

Live Order (G-06) remains after place-order commit where fulfilment is in play — see screen specs. The eight human moments above are the **ordering** constitution; status/progress is Experience Progress, not browse.

---

### Screen: Guest Entry (G-01)

**Behaviour:** Proven ✓ Restaurant (trusted entry) · **LEOS Native** (runtime split Entry→Context)  
**Intent:** Admit the guest into the right venue and physical context from a trusted entry interaction.  
**Runtime Owner:** Entry → Context  
**Pack:** Restaurant (venue branding / context labels)  
**Capability:** none

**Layout**

```text
┌───────────────────────────────┐
│                               │
│        [Venue mark]           │
│                               │
│  Welcome to {venue}           │
│                               │
│  {physical context}           │
│                               │
│───────────────────────────────│
│                               │
│   Continue                    │
│                               │
└───────────────────────────────┘
```

**Components:** App Shell · Profile/Venue header (Entity Card or Session Header pre-session) · Context Banner (context line) · Bottom Action Bar · Neo Dock  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Continue | `ResolveEntry` (+ start handoff) | `ExperienceStarted`, `ExperienceContextResolved` |

**Navigation / Routes:** Continue → Guest Join · Escape → leave  

**DSL id:** `Guest.Entry` · path `/entry`

---

### Screen: Guest Join (G-02)

**Behaviour:** Proven ✓ Restaurant (participant join)  
**Intent:** Attach a human participant so the session can collaborate and personalise.  
**Runtime Owner:** Experience  
**Pack:** Restaurant  
**Capability:** none

**Layout**

```text
┌───────────────────────────────┐
│ Welcome                       │
│                               │
│ Name                          │
│                               │
│ Continue                      │
└───────────────────────────────┘
```

*(Phone optional / profile-driven — not required by platform.)*

**Components:** Session Header · Form Section · Bottom Action Bar · Neo Dock  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Continue | `JoinSession` | `ParticipantJoined` |

**Navigation / Routes:** Continue → Guest Menu · Back → Guest Entry  

**DSL id:** `Guest.Join` · path `/entry` (combined today) → `/guest`

---

### Screen: Guest Menu (Browse) (G-03)

**Constitution:** Browse should never feel like shopping — [UX Constitution §1](ux/restaurant-pack-ux-constitution.md)

**Behaviour:** Proven ✓ Restaurant (browse before commitment)  
**Intent:** Help a guest discover food and add items to an active transaction.  
**Runtime Owner:** Experience · Profile Engine (labels)  
**Pack:** Restaurant (catalogue)  
**Capability:** none (browse)

**Layout**

```text
┌───────────────────────────────┐
│ Session Header                │
├───────────────────────────────┤
│ Search                        │
├───────────────────────────────┤
│ Categories                    │
├───────────────────────────────┤
│                               │
│ Menu Cards                    │
│                               │
│                               │
├───────────────────────────────┤
│ Cart (n Items)        {total} │
└───────────────────────────────┘
         [Neo Dock]
```

**Composition tree**

```text
Guest.Menu
 ├── SessionHeader
 ├── SearchSurface
 ├── FilterBar
 ├── EntityCardGrid
 ├── CartSummary
 └── NeoDock
```

**Components:** Session Header · Search Surface · Filter Bar · Entity Card · Cart Summary · Neo Dock · Offline Banner / Empty State / Error Surface (states)  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| AddToOrder (simple +) | draft line | — |
| OpenChoices (required) | — | open G-04 sheet over Menu |
| UpdateQuantity (row pill) | draft line | — |
| OpenCart / Your order | — | — |
| SubmitOrder | `CreateTransaction` | `TransactionCreated`, `FulfilmentCreated` |
| CallWaiter | `CreateAssistanceRequest` | assistance requested |
| Pay | `RequestPayment` | `PaymentRequested` |

**Navigation / Routes:** Simple add **stays on Menu** · Required choices → Item sheet over Menu · OpenCart → Cart · Pay → Payment · path `/guest`

**DSL id:** `Guest.Menu`

---

### Screen: Guest Item Detail (Configure Item) (G-04)

**Constitution:** One sheet · Required first · Combos are products — [UX Constitution §2–4](ux/restaurant-pack-ux-constitution.md) · **Add on menu** §6  
**Behaviour:** Proven ✓ Restaurant (deferred commitment / modifiers) — **LEOS depth Gap**  
**Intent:** Let the guest choose required options and extras on **one sheet over Browse**, then add a draft line — no wizard · **not a separate destination page**.  
**Runtime Owner:** Experience  
**Pack:** Restaurant (choice groups / product definitions — including combos as products)  
**Capability:** none

**Layout**

```text
┌───────────────────────────────┐
│ {Item name}                   │
│                               │
│ [Image]                       │
│                               │
│ Choose your side *            │
│ Choose your drink *           │
│ Extras                        │
│ Special requests              │
│                               │
│ Total · Qty                   │
│ Add to order                  │
└───────────────────────────────┘
```

**Components:** Session Header · Entity Card (detail) · Form Section (choice groups) · Quantity Stepper · Bottom Action Bar · Neo Dock  
**Guest copy:** *Choose one / Extras / Special requests / Add to order* — never “Modifiers” or “Customize” as the lead.  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Add to Cart | draft `AddLineItem` | — |

**Navigation / Routes:** Add → Menu (cart updated) · Back → Menu  

**DSL id:** `Guest.ItemDetail` · **Status:** ahead of current Angular (gap in product; specified here)

---

### Screen: Guest Cart (Review) (G-05)

**Constitution:** Cart is the second sales opportunity — [UX Constitution §5](ux/restaurant-pack-ux-constitution.md)  
**Behaviour:** Proven ✓ Restaurant (deferred commitment → transaction)  
**Intent:** Restate **Your order**, offer People also add, then continue — without slowing Browse.  
**Runtime Owner:** Experience  
**Pack:** Restaurant  
**Capability:** fulfilment (on submit)

**Layout**

```text
┌───────────────────────────────┐
│ Your order                    │
├───────────────────────────────┤
│ Line · choices · qty          │
│ Line · choices · qty          │
├───────────────────────────────┤
│ People also add               │
│  [Garlic Bread] [Dessert] …   │
├───────────────────────────────┤
│ Total                         │
├───────────────────────────────┤
│ Continue                      │
└───────────────────────────────┘
```

**Components:** Session Header · Line Item Row · Entity Card (upsell) · Cart Summary / Payment Summary (total) · Bottom Action Bar · Empty State  
**Guest copy:** *Your order* · *People also add* · *Continue* — upsell never blocks required configure.  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Place Order | `CreateTransaction` | `TransactionCreated`, `FulfilmentCreated` |
| Retry | `CreateTransaction` | same |

**Navigation / Routes:** Place Order → Live Order · Back → Menu  

**DSL id:** `Guest.Cart`

---

### Screen: Guest Live Order (Order Timeline) (G-06)

**Behaviour:** Proven ✓ Restaurant (live fulfilment projection)  
**Intent:** Show fulfilment progress so the guest knows what happens next.  
**Runtime Owner:** Experience (observe) · Capability fulfilment (source of truth)  
**Pack:** Restaurant  
**Capability:** `fulfilment.*` (read)

**Layout**

```text
┌───────────────────────────────┐
│ Session                       │
├───────────────────────────────┤
│ {line}      Preparing         │
│ {line}      Ready             │
│ {line}      Pending           │
├───────────────────────────────┤
│ Request Waiter                │
│ Pay Bill                      │
└───────────────────────────────┘
```

**Components:** Session Header · Timeline · Status Chip · Bottom Action Bar · Neo Dock  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Request Waiter | `CreateAssistanceRequest` | assistance requested |
| Pay Bill | `RequestPayment` | `PaymentRequested` |

**Navigation / Routes:** Pay → Payment · path `/guest` (timeline section or dedicated route later)  

**DSL id:** `Guest.LiveOrder` · observes `FulfilmentStatusChanged`

---

### Screen: Guest Payment (G-07)

**Behaviour:** Proven ✓ Restaurant (capability settlement) · Split = Proven, LEOS Gap  
**Intent:** Collect payment for what was consumed.  
**Runtime Owner:** Capability  
**Pack:** Restaurant (terminology only)  
**Capability:** `payment.settle`

**Layout**

```text
┌───────────────────────────────┐
│ Outstanding Balance           │
│                               │
│ Split                         │
│                               │
│ Card                          │
│ Wallet                        │
│ Cash                          │
│                               │
│ Pay                           │
└───────────────────────────────┘
```

**Components:** Session Header · Payment Summary · Selection Card (methods) · Allocation Panel (split — stub) · Bottom Action Bar · Error Surface · Neo Dock  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Pay | `RequestPayment` | `PaymentRequested`, `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed` |
| Retry | `RequestPayment` | same |

**Navigation / Routes:** Success → Receipt · Fail → stay + Error Surface · Back → Live Order / Menu  

**DSL id:** `Guest.Payment`

---

### Screen: Guest Receipt (G-08)

**Behaviour:** Proven ✓ Restaurant (post-settlement confirmation)  
**Intent:** Confirm payment succeeded and offer a clear leave path.  
**Runtime Owner:** Capability (facts) · Experience (session)  
**Pack:** Restaurant  
**Capability:** payment (read)

**Layout**

```text
┌───────────────────────────────┐
│ Payment Complete              │
│                               │
│ Receipt                       │
│                               │
│ Leave Experience              │
└───────────────────────────────┘
```

**Components:** Confirmation Panel · Payment Summary · Bottom Action Bar · Neo Dock  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Leave Experience | `CompleteSession` | `SessionCompleted` |

**Navigation / Routes:** Leave → Exit / Entry · **Status:** intentional gap in product; specified here  

**DSL id:** `Guest.Receipt`

---

### Screen: Guest Exit (G-09)

**Behaviour:** Proven ✓ Restaurant (context release)  
**Intent:** End the visit so the physical context is free for the next person.  
**Runtime Owner:** Experience  
**Pack:** Restaurant  
**Capability:** none

**Layout**

```text
┌───────────────────────────────┐
│ Thanks                        │
│                               │
│ Context cleared               │
│                               │
│ Done                          │
└───────────────────────────────┘
```

**Components:** Confirmation Panel · Bottom Action Bar  

**Actions:** none required after `SessionCompleted`  
**Navigation / Routes:** Done → Entry (new visit)  

**DSL id:** `Guest.Exit`

---

## 4. Experience: Restaurant Dining — Waiter (outline)

### Journey map

```text
Login → Floor → Session → Orders / Assistance → Payment assist → Close
```

Wireframes for Login / Floor remain **intentional gap** (LEK-027). Shipped surface today: Assistance / Close.

### Screen: Waiter Assistance / Close

**Intent:** Clear guest requests and free the context when the visit is done.  
**Runtime Owner:** Experience  
**Pack:** Restaurant  
**Capability:** none

**Layout**

```text
┌───────────────────────────────┐
│ Session                       │
├───────────────────────────────┤
│ Open assistance               │
│  · request          [Resolve] │
├───────────────────────────────┤
│ Clear & close                 │
└───────────────────────────────┘
```

**Components:** Session Header · Assistance List · Bottom Action Bar · Empty State  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Resolve | `ResolveAssistanceRequest` | assistance resolved |
| Clear & close | `CompleteSession` | `SessionCompleted` |

**Routes:** `/service` · DSL id: `Waiter.Assistance`

---

## 5. Experience: Restaurant Dining — Kitchen (outline)

### Journey map

```text
Board → Ticket → Preparing → Ready → Complete
```

### Screen: Kitchen Board

**Intent:** Keep fulfilment moving under pressure.  
**Runtime Owner:** Experience + Capability  
**Pack:** Restaurant (station labels)  
**Capability:** `fulfilment.*`

**Layout**

```text
┌───────────────────────────────┐
│ Station Header                │
├───────────────────────────────┤
│ [Filter]                      │
├───────────────────────────────┤
│ Ticket   Pending   [Prep]     │
│ Ticket   Preparing [Ready]    │
│ Ticket   Ready     [Served]   │
└───────────────────────────────┘
```

**Composition tree**

```text
Kitchen.Board
 ├── SessionHeader
 ├── FilterBar
 ├── FulfilmentTicket[]
 └── NeoDock
```

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Mark Preparing / Ready / Served | `UpdateFulfilmentStatus` | `FulfilmentStatusChanged` |

**Routes:** `/station/:stationId` · DSL id: `Kitchen.Board`

---

## 6. Experience: LEOS Studio + LEOS Experience shells

**IA:** [docs/ux/ia-experience-studio-shells.md](ux/ia-experience-studio-shells.md)  
**Wireframes:** [ux/wireframes/experience/](ux/wireframes/experience/) · [ux/wireframes/studio/](ux/wireframes/studio/)

### Product journeys

```text
STUDIO     Create → Configure → Activate → Operate → Grow
EXPERIENCE Discover → Join → Experience → Complete → Return
```

### Studio journey map

```text
Welcome → Choose Experience → Configure (venue/places/payments)
  → Generate QR → Live achievement → Home / Operate
```

### Experience journey map (QR-first)

```text
Scan → Welcome (venue) → Name → Confirm place → Heartbeat
```

Payments wizard detail remains in [setup-studio-payment-connector-screens.md](ux/setup-studio-payment-connector-screens.md). Live achievement (S5) is required Activate peak — not optional polish.

**DSL:** `Studio.*` · `/studio/*` · `Experience.*` · `/entry` · `/experience`

---

## 7. Other experiences (placeholders)

| Experience | Status | Notes |
|------------|--------|-------|
| Manager | Intentional gap | Do not expand until Manager profile demands it |
| Hotel Guest | Intentional gap | Same Guest DSL screens; different Profile/Pack content |
| Festival / Connector install detail | Later | Compose from same LEK-028 primitives |

Compass: if a wireframe only makes sense for one restaurant brand, it belongs in the pack — not here. These wireframes use pack **examples** to prove movement, not to centre Restaurant in the OS.

---

## 8. Derivation from this LEK

| Artifact | From |
|----------|------|
| ASCII / future Figma frames | Layout blocks |
| Angular page shells | `layout` + LEK-028 components |
| Playwright journeys | Journey maps + Actions |
| LEK-030 IA routes | `routes.path` / Navigation |
| A11y checklist | Intent + primary Action + States |
| Docs / Neo | Intent + Events |

High-fidelity visual design (Figma) comes **after** these low-fi specs are validated — LEDS tokens apply then, not before.

---

## 9. Related

| Doc | Role |
|-----|------|
| LEK-027 | What happens (Frozen) |
| LEK-028 | What components exist |
| LEK-029 (this) | How screens are composed and how people move |
| [Restaurant Pack UX Constitution](ux/restaurant-pack-ux-constitution.md) | **Frozen** guest interaction standard (browse · one sheet · cart upsell) |
| LEK-040 | How it should feel (Frozen) |
| LEK-030 | Routing / IA trees (next) |
| LEK-026 / LVES | How it looks (after wireframes validated) |

*End of LEK-029 v0.1.*
