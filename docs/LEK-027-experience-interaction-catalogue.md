# LEK-027 — Experience Interaction Specification

**Status: Frozen (v1.1)** — Experience Interaction Specification / Product Bible  
**Change policy:** Schema and layer model frozen. Content may add `Status: intentional gap` detail or correct factual errors; structural redesign requires ADR.  
**Complements:** [LEK-001](LEK-001.md) (Frozen constitution)  
**Consumes:** [docs/ux/setup-studio-payment-connector-screens.md](ux/setup-studio-payment-connector-screens.md)  
**Design track next:** [LEK-028 Component Catalogue](LEK-028-component-catalogue.md) (consumes [LEK-026 LEDS](LEK-026-leds-visual-language.md))  
**Platform track next:** [LEK-031 Entry Runtime](LEK-031-entry-runtime.md)

LEOS is about **interactions**, not merely flows. This specification is the canonical product source for journeys, screens, navigation, permissions, runtime ownership, events, and commands.

### Document hierarchy (core specification set)

| Document | Role | Status |
|----------|------|--------|
| **LEK-001** | Platform Constitution | **Frozen** (ADR-only) |
| **LEK-026** | LEDS Visual Language | Design stream (reference for 028) |
| **LEK-027** (this) | Experience Interaction Specification | **Frozen** |
| **LEK-028** | Component Catalogue | Design stream (active) |
| **LEK-029** | Experience Composition & Wireframes | Design stream (active) |
| **LEK-030** | Information Architecture | Design stream (next) |
| **LEK-031–035** | Runtime Manuals | Platform stream |
| **LEK-036–037** | Domain & API | Convergence |
| **LEK-040** | [Human Experience Engineering](LEK-040-human-experience-engineering.md) | **Frozen** |
| **North Star** | [Mission · journeys · filter](NORTH-STAR.md) | **Frozen** |
| **Delivery OS** | [Build process](LEOS-DELIVERY-SYSTEM.md) | **Frozen** |

### Intentional gaps (not TODOs)

These are acknowledged out of freeze scope. Filling them does not reopen the constitution or interaction schema.

| Area | Status | Notes |
|------|--------|-------|
| Manager Journey screens | Intentional gap | Lightweight stubs only (§6.4) |
| Hotel Experience | Intentional gap | Outline for component-reuse proof (§9) |
| Waiter Login / Floor | Intentional gap | Assistance/Close shipped; floor map later |
| Guest Receipt / dedicated Leave | Intentional gap | Close today via `/service` |
| Full LEK-028 component specs | Design stream | Index in §5; catalogue is LEK-028 |

Principles → interactions (027) → components (028) → composition (029) → navigation (030).

---

## 1. Derivation targets

Every screen should be capable of generating (today manually; later via LEOS compile):

| Derive from catalogue | Into |
|----------------------|------|
| **Intent** | Neo / AI prompts, analytics goals, a11y purpose |
| Flow **Navigation Maps** | App routes, information architecture seeds (LEK-029) |
| **Entry / Exit Conditions** | Guards, redirects, recovery journeys |
| **Component** refs | Shared UI library; full specs in LEK-028 |
| **State** matrix | Loading / empty / partial / offline / error templates |
| **Actions** (business) | API commands, permissions, unit tests |
| **Navigation** | Router links, back stacks, deep links |
| **Action → Command → Events** | Outbox, Socket.IO, Playwright assertions |
| **Owned By** | Package / pack / connector ownership reviews |
| **Visual Characteristics** | Theme tokens (intent → LEDS/LEOS tokens) |
| Full screen row | Angular route · API endpoints · Permissions · Events · Analytics · Accessibility checklist · Playwright · Unit tests · Docs · AI prompts |

**Platform Rule:** Every feature belongs in Entry Runtime, Context Runtime, Experience Runtime, Capability Runtime, Profile Engine, Experience Pack, or Connector. Every screen’s **Owned By** footer answers that immediately.

**Naming note:** Older corpus claims LEK-020 elsewhere. This is **LEK-027 — Experience Interaction Specification** (filename retained for stability).

---

## 2. Experience Design Principles (LEOS UX constitution)

1. **Every screen answers:** Where am I? What can I do? What happens next?
2. **Every screen starts with Intent** — why the experience moment exists (not only what the UI shows).
3. **Every primary business action should be obvious.** One Deep Emerald CTA for the happy path.
4. **Navigation is not a business action.** Back / Close / Continue / Open Cart are Navigation.
5. **No screen should require platform knowledge** (except Setup Studio operators).
6. **Pack terminology comes from the Experience Profile, never the runtime.**
7. **One primary action per screen** (Experience Grammar).
8. **Always recover from interruption** via System Journeys.
9. **Offline should never lose user Intent.**
10. **Every business action lists Command + Events** so UX and backend speak the same language.
11. **Escape / Navigation on every critical path.**
12. **Success is an explicit State.**

---

## 3. Layer definitions

```text
Experience
  → Journey
    → Flow
      → Screen
        → Component
        → State
        → Actions          # business actions only
        → Navigation       # movement only
        → Routes
        → Events
```

| Layer | Meaning |
|-------|---------|
| **Experience** | Named product surface family (Restaurant Dining, Setup Studio, Hotel Stay). |
| **Journey** | Role- or system-shaped path (Guest, Waiter, Kitchen, Manager, **System**, Admin). |
| **Flow** | Contiguous sequence toward one outcome. Always ends with a **Navigation Map**. |
| **Screen** | One **Intent**, one primary business **Action**. Composed of **Components**. Exists in multiple **States**. |
| **Component** | Reusable LEOS building block (Menu Item Card, Modifier Drawer, Neo Dock, Bottom Cart). Reused across Restaurant, Hotel, Festival, Golf, Marketplace. Full catalogue → **LEK-028**. |
| **State** | Canonical UI condition of the screen (see below). |
| **Actions** | Business outcomes: Join Session, Submit Order, Call Waiter, Pay, Retry. |
| **Navigation** | Movement only: Back, Close, Continue, Open Cart, View Receipt. |
| **Routes** | Path / deep-link bindings. |
| **Events** | Canonical platform events (also listed per Action). |

### Canonical States (every screen documents applicable ones)

| State | Meaning |
|-------|---------|
| **Loading** | Fetch / resolve in progress |
| **Empty** | No content for this context |
| **Success** | Happy outcome visible |
| **Partial** | Some content available; some missing or deferred |
| **Offline** | Cached / queued; no live link |
| **Permission denied** | Identity or role insufficient |
| **Error** | Failure with recovery path |

Pack-specific state labels are allowed as aliases (e.g. *Restaurant Closed*, *Loading Menu*) but map to the canonical set.

### Actions vs Navigation

| | Actions | Navigation |
|--|---------|------------|
| Answers | What business outcome? | Where do I go? |
| Examples | Join Session, Submit Order, Pay, Retry | Back, Close, Continue, Open Cart, View Receipt |
| Binds to | **Command** + **Events** | **Routes** |

### Action → Command → Events (mandatory for business actions)

| Action | Command | Events |
|--------|---------|--------|
| Submit Order | `CreateTransaction` | `TransactionCreated`, `FulfilmentCreated` |
| Pay | `RequestPayment` | `PaymentRequested`, … |
| Call Waiter | `CreateAssistanceRequest` | (assistance event) |

UX and backend share this table.

### Screen adjuncts

| Adjunct | Meaning |
|---------|---------|
| **Intent** | Why this moment exists (first-class; Neo / a11y / analytics / AI UI) |
| **Entry Conditions** | Requires Session / Identity / Permission / Capability / Profile / … |
| **Exit Conditions** | Session Completed / Payment Failed / Cancelled / Timeout / QR Expired / … |
| **Interaction Rules** | Behaviour that is not a field (modifier updates price; unavailable disabled) |
| **Visual Characteristics** | Intent-level: Theme, Density, Spacing, Motion, Priority, Elevation |
| **Owned By** | Runtime, Pack, Capability, Events, Permissions — **never optional** |

### Screen template

```markdown
### Screen: {Name}

**Status:** shipped | gap | mock
**Intent:** …   # why the experience moment exists

**Entry Conditions:** …
**Exit Conditions:** …

**States**
- Loading | Empty | Success | Partial | Offline | Permission denied | Error
  (+ pack aliases if useful)

**Components:** …   # LEOS blocks; detailed in LEK-028
**Fields:** …       # when inputs exist
**Validation:** …
**Interaction Rules:** …

**Actions** (business)

| Action | Command | Events |
|--------|---------|--------|
| … | … | … |

**Navigation:** Back | Close | Continue | Open Cart | …

**Routes:** …
**Events:** (screen-level observe/emit summary)

**Visual Characteristics**
- Theme / Density / Spacing / Motion / Priority / Elevation

**Owned By**
- Runtime: …
- Pack: …
- Capability: …
- Events: …
- Permissions: …
```

---

## 4. Runtime ownership guide

| Surface (examples) | Runtime | Pack | Capability |
|--------------------|---------|------|------------|
| QR / token scan, join | Entry | — | — |
| Venue / Physical Context resolve | Context | — | — |
| Session lifecycle, catalogue browse | Experience | Restaurant (content) | — |
| Menu / “order” / “bill” copy | Profile Engine | Restaurant profile | — |
| Settle / refund / provider redirect | Capability | — | `payment.*` |
| Kitchen / bar board | Experience + Capability | Restaurant | `fulfilment.*` |
| Assistance request / resolve | Experience | Restaurant | — |
| Payment connector install / activate | Capability + Connector | — | payment connector install |
| Shell chrome, Neo Dock, selection cards | LEOS shell | — | — |

Platform nouns in ownership: Physical Context, Session, Participant, Transaction, Fulfilment, Payment, Assistance Request.

---

## 5. Component index (→ LEK-028)

Components are more reusable than screens. This section is an **index** only; the full Component Catalogue is **LEK-028** (future).

Example — Guest Menu Screen composes:

- Menu Category Component  
- Menu Item Card  
- Modifier Drawer  
- Quantity Selector  
- Neo Dock  
- Bottom Cart  

Same blocks reuse across Restaurant, Hotel, Festival, Golf, Marketplace.

| Component | Role | Reused by |
|-----------|------|-----------|
| Session / Experience Header | Title, context, profile | Guest, Hotel, Setup |
| Search | Filter catalogue / providers | Menu, Provider gallery |
| Category Tabs | Horizontal category sync | Menu, Room Service |
| Menu Item Card / Product Grid | Selectable catalogue | Menu, Room Service, Marketplace |
| Modifier Drawer | Options + price update | Menu, Room Service |
| Quantity Selector | Line quantity | Cart, Menu |
| Bottom Cart / Bottom Action Bar | Sticky summary + CTA | Menu, Room Service |
| Visual Selection Card | Choice without radios | Entry, Setup routing |
| Progress Chrome | Wizard step % | Setup Studio |
| Neo Dock | Passive presence | All shells |
| Card Grid | Module / provider grids | Setup Hub, galleries |
| Timeline | Live events | Guest proof |
| Status Chip | Fulfilment / payment status | Station, payments |
| Fulfilment Ticket | Station row | Kitchen, Bar, Housekeeping |
| Payment Summary | Amount due | Settle, Receipt |
| Profile Header | Profile label chip | Guest, Staff |
| Assistance List | Open requests | Waiter, Service |
| Success / Error Banner | Explicit outcome | All Grammar screens |

---

## 6. Experience: Restaurant Dining

**Pack:** `packs/restaurant`  
**Profiles (examples):** Restaurant, Cafe  
**Current Angular ground truth:** `/entry`, `/guest`, `/service`, `/station/:stationId`

### 6.1 Guest Journey

**Navigation Map (journey)**

```text
Guest
  Entry
    ↓
  Welcome
    ↓
  Join Session
    ↓
  Menu
    ↓
  Item
    ↓
  Cart
    ↓
  Payment
    ↓
  Receipt
    ↓
  Leave
```

#### Flow G-01 — Enter

**Navigation Map**

```text
QR / Deeplink
  ↓
Resolve Context (Welcome)
  ↓
Join Session
  ↓
Menu (G-02)
```

##### Screen: QR Entry / Resolve

**Status:** shipped (simplified as Entry token cards)  
**Intent:** Admit the guest into the right venue and physical context from a single entry token.  
**Entry Conditions:** Requires valid entry token (QR / deeplink). No session yet.  
**Exit Conditions:** Context resolved → Join; QR Expired; Token Invalid; Offline Recovery; Venue closed.

**States**
- **Loading** — Resolving venue…
- **Empty** — N/A
- **Success** — Context resolved (brief)
- **Partial** — Profile picker shown before join
- **Offline** — Offline Recovery System Journey
- **Permission denied** — N/A for public QR
- **Error** — Invalid or expired token; offer Start fresh  
  Aliases: *QR Expired*, *Venue Closed*

**Components:** Experience Header · Visual Selection Card · Success/Error Banner · Bottom Action Bar · Neo Dock  
**Fields**

| Field | Type | Rules |
|-------|------|-------|
| Entry token | selection | Required; maps to Experience Profile |
| Display name | text | Required; participant label |

**Validation:** Token selected; name non-empty.  
**Interaction Rules:** Selecting a visual card updates token immediately; cyan selection glow.

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Enter experience | `StartExperience` / resolve entry | `ExperienceStarted`, `ExperienceContextResolved` |

**Navigation:** Cancel → leave entry  
**Routes:** `/entry` → success → `/guest`  
**Events:** `ExperienceStarted`, `ExperienceContextResolved`, `ParticipantJoined` (when join combined)

**Visual Characteristics:** Theme warm-minimalist · Density comfortable · Spacing generous · Motion soft card select · Priority high · Elevation body flat / cards lifted

**Owned By**
- Runtime: Entry → Context → Experience
- Pack: Restaurant (profile content only)
- Capability: none
- Events: `ExperienceStarted`, `ExperienceContextResolved`, `ParticipantJoined`
- Permissions: public guest entry

##### Screen: Join Session

**Status:** shipped (combined with Entry in Phase 1)  
**Intent:** Attach a human participant to the live session so the experience can personalise and collaborate.  
**Entry Conditions:** Requires resolved Physical Context; Requires Profile.  
**Exit Conditions:** Participant joined; Cancelled; Timeout.

**States:** Loading · Error · Success (banner then navigate) · Offline · Permission denied  
**Components:** Experience Header · Bottom Action Bar  
**Fields:** Display name (see QR Entry)  
**Interaction Rules:** None beyond Grammar  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Join Session | `JoinSession` | `ParticipantJoined` |

**Navigation:** Cancel → leave  
**Routes:** → Menu / Browse  
**Events:** `ParticipantJoined`

**Owned By**
- Runtime: Experience
- Pack: Restaurant
- Capability: none
- Events: `ParticipantJoined`
- Permissions: guest

---

#### Flow G-02 — Browse

**Navigation Map**

```text
Menu
  ↓
Category / Search
  ↓
Item (optional)
  ↓
Open Cart → Order (G-03)
```

##### Screen: Menu

**Status:** shipped (list form; grid/tabs are target LEOS shape)  
**Intent:** Help a guest discover food and add items to an active transaction.  
**Entry Conditions:** Requires Session; Requires Profile (terminology); Profile active.  
**Exit Conditions:** Open Cart / Submit; Request Assistance; Expired Session; Offline; Restaurant Closed.

**States**
- **Loading** — *Loading Menu* (catalogue fetching)
- **Empty** — *No Menu Available*
- **Success** — *Live Menu* (browse + add feedback)
- **Partial** — Some categories loaded; others deferred
- **Offline** — *Offline Cached Menu*; queue adds
- **Permission denied** — Guest not on session / *Profile Not Active*
- **Error** — Catalogue failed; Retry  
  Aliases: *Restaurant Closed*, *Profile Not Active*

**Components:** Session Header · Search · Menu Category · Menu Item Card · Modifier Drawer · Quantity Selector · Bottom Cart · Neo Dock · Timeline (proof) · Success/Error Banner  
**Fields:** none (selection via components)  
**Validation:** N/A  
**Interaction Rules**
- Selecting modifier updates price immediately (Modifier Drawer)
- Unavailable items disabled
- Category scroll sync with tabs (target)
- Cart badge animates on add
- Terminology from Profile Engine

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Add item (to cart) | `AddLineItem` (client / draft) | (local until submit) |
| Submit Order | `CreateTransaction` | `TransactionCreated`, `FulfilmentCreated` |
| Call Waiter | `CreateAssistanceRequest` | assistance requested |
| Pay | `RequestPayment` | `PaymentRequested`, … |

**Navigation:** Open Cart · View item · Dismiss message  
**Routes:** `/guest`  
**Events:** observes session timeline; emits on submit/pay/assistance

**Visual Characteristics:** Theme warm sand · Density compact (guest micro) · Spacing tight rows · Motion badge pulse · Priority medium · Elevation sticky cart raised

**Owned By**
- Runtime: Experience (session); Profile Engine (labels)
- Pack: Restaurant (catalogue content)
- Capability: none for browse; payment/fulfilment on actions above
- Events: transaction / fulfilment / payment / assistance as per Actions
- Permissions: session participant (guest)

---

#### Flow G-03 — Order

**Navigation Map**

```text
Cart review
  ↓
Submit Order
  ↓
Fulfilment → Kitchen
  ↓
Continue browsing | Payment
```

##### Screen: Cart / Submit Order

**Status:** shipped (inline on Guest)  
**Intent:** Let the guest confirm what they want and commit it as a Transaction.  
**Entry Conditions:** Requires Session; cart non-empty.  
**Exit Conditions:** Transaction created; Cancelled; Offline queued.

**States:** Loading (submitting) · Empty (return to Menu) · Success · Partial (some lines failed — target) · Offline · Error · Permission denied  
**Components:** Bottom Cart · Menu Item Card (lines) · Quantity Selector · Bottom Action Bar · Success Banner  
**Fields:** optional notes (gap)  
**Interaction Rules:** Removing last item → Empty; submit disables while in-flight  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Submit Order | `CreateTransaction` | `TransactionCreated`, `FulfilmentCreated` |
| Retry | `CreateTransaction` | same on success |

**Navigation:** Keep browsing (back to Menu) · Open Cart (self)  
**Routes:** stay `/guest`; fulfilment appears on station  
**Events:** `TransactionCreated`, `FulfilmentCreated`

**Owned By**
- Runtime: Experience
- Pack: Restaurant
- Capability: fulfilment create (via Experience → Capability)
- Events: `TransactionCreated`, `FulfilmentCreated`
- Permissions: session participant

---

#### Flow G-04 — Payment

**Navigation Map**

```text
Settle
  ↓
PaymentRequested
  ↓
Connector checkout | Manual
  ↓
PaymentCompleted | PaymentFailed
  ↓
Receipt → Leave
```

##### Screen: Settle Payment

**Status:** shipped (guest settle CTA + connector redirect)  
**Intent:** Collect payment for what was consumed so the session can complete fairly.  
**Entry Conditions:** Requires Session; Requires Capability `payment.settle`; payable balance.  
**Exit Conditions:** Payment Completed; Payment Failed; Cancelled; Connector Timeout; Expired Session.

**States:** Loading · Empty (nothing due) · Success · Partial (auth pending) · Offline · Permission denied · Error  
**Components:** Session Header · Payment Summary · Bottom Action Bar · Success/Error Banner  
**Fields:** none on shell (connector may collect elsewhere)  
**Interaction Rules:** Settle disabled without balance; failures → System Journeys (Capability / Connector Timeout / Retry payment)

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Pay | `RequestPayment` | `PaymentRequested`, `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed` |
| Retry | `RequestPayment` | same |

**Navigation:** Back to Menu · Dismiss · View Receipt (on success)  
**Routes:** `/guest` → external PayFast (when bound) → return URL  
**Events:** payment lifecycle above

**Visual Characteristics:** Theme warm · Density comfortable · Motion none during redirect · Priority high · Elevation CTA elevated

**Owned By**
- Runtime: Capability
- Pack: Restaurant (terminology only)
- Capability: `payment.settle` / bound connector
- Events: `PaymentRequested`, `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed`
- Permissions: session participant authorised to settle

##### Screen: Receipt

**Status:** gap  
**Intent:** Confirm payment succeeded and give a clear path to leave.  
**Entry Conditions:** Requires PaymentCompleted (or manual completed).  
**Exit Conditions:** Navigate Leave; Session still open until close.  
**States:** Success · Error (print/share gap) · Offline  
**Components:** Success Banner · Payment Summary · Bottom Action Bar  
**Actions:** none required (view-only) or Share receipt (gap)  
**Navigation:** View Receipt (self) · Leave · Close  
**Owned By**
- Runtime: Capability (payment facts); Experience (session)
- Pack: Restaurant
- Capability: payment
- Events: observes `PaymentCompleted`
- Permissions: session participant

---

#### Flow G-05 — Leave

**Navigation Map**

```text
Assistance (optional)
  ↓
Close Session
  ↓
SessionCompleted
  ↓
Physical Context free
```

##### Screen: Request Assistance

**Status:** shipped (guest CTA)  
**Intent:** Let the guest get human help without abandoning the session.  
**Entry Conditions:** Requires Session.  
**Exit Conditions:** Assistance created; Offline queued.  
**States:** Loading · Success · Offline · Error · Permission denied  
**Components:** Bottom Action Bar · Success Banner  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Call Waiter | `CreateAssistanceRequest` | assistance requested |

**Navigation:** Dismiss  
**Routes:** `/guest` (inline)  
**Events:** assistance request event  
**Owned By**
- Runtime: Experience
- Pack: Restaurant
- Capability: none
- Events: assistance request event
- Permissions: guest participant

##### Screen: Session Close (guest-facing leave)

**Status:** gap as dedicated guest screen (close today on `/service`)  
**Intent:** End the visit cleanly so the physical context is free for the next guest.  
**Entry Conditions:** Prefer PaymentCompleted or staff-closed.  
**Exit Conditions:** Session Completed.  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Leave / Close | `CompleteSession` | `SessionCompleted` |

**Navigation:** Close  
**Owned By**
- Runtime: Experience
- Pack: Restaurant
- Capability: none
- Events: `SessionCompleted`
- Permissions: guest or staff

---

### 6.2 Waiter Journey

#### Flow W-01 — Floor & Assistance

**Navigation Map**

```text
Staff Login (gap)
  ↓
Floor / Live Sessions (gap)
  ↓
Assistance Queue
  ↓
Resolve → optional Payment assist → Close Session
```

##### Screen: Waiter Login

**Status:** gap  
**Intent:** Authenticate staff identity for floor permissions.  
**Entry Conditions:** Requires Identity; Requires Permission `staff.service`.  
**Exit Conditions:** Authenticated; Permission Denied.  
**Owned By**
- Runtime: Experience (auth gate); Context (venue)
- Pack: Restaurant
- Capability: none
- Events: none required
- Permissions: `staff.service`

##### Screen: Floor / Live Sessions

**Status:** gap  
**Intent:** See open Physical Contexts / Sessions.  
**Entry Conditions:** Requires Permission `staff.service`; Requires Profile.  
**Exit Conditions:** Open session detail; Expired Session list refresh.  
**Components:** Experience Header · Item List · Neo Dock  
**Owned By**
- Runtime: Experience; Context
- Pack: Restaurant
- Capability: none
- Events: observes session lifecycle
- Permissions: `staff.service`

##### Screen: Assistance Queue / Service

**Status:** shipped (`/service`)  
**Intent:** Help staff clear guest requests and free the table when the visit is done.  
**Entry Conditions:** Requires Session context (Phase 1 ties to active guest session); Requires Permission staff (target).  
**Exit Conditions:** Assistance resolved; Session Completed; Cancelled back to guest.

**States:** Loading · Empty (no requests) · Success (resolved) · Partial · Offline · Permission denied · Error  
**Components:** Session Header · Assistance List · Success Banner · Bottom Action Bar  
**Fields:** none  
**Interaction Rules:** Resolve removes request from list; Close clears physical context for next guest  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Resolve assistance | `ResolveAssistanceRequest` | assistance resolved |
| Close Session | `CompleteSession` | `SessionCompleted` |

**Navigation:** Back to guest  
**Routes:** `/service`  
**Events:** assistance resolved; `SessionCompleted`

**Visual Characteristics:** Theme warm · Density comfortable · Spacing staff-scale · Motion none · Priority high on Close · Elevation footer raised

**Owned By**
- Runtime: Experience
- Pack: Restaurant
- Capability: none
- Events: assistance resolve; `SessionCompleted`
- Permissions: `staff.service` (target); open in Phase 1 proof

##### Screen: Waiter Payment Assist

**Status:** gap  
**Intent:** Let staff complete settlement when the guest cannot use the payment UI.  
**Entry Conditions:** Requires Session; Requires Capability payment; Requires Permission staff.  
**Exit Conditions:** PaymentCompleted | PaymentFailed.  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Pay | `RequestPayment` | `PaymentRequested`, `PaymentCompleted`, `PaymentFailed` |
| Retry | `RequestPayment` | same |

**Navigation:** Back to Floor  
**Owned By**
- Runtime: Capability
- Pack: Restaurant
- Capability: `payment.settle`
- Events: payment lifecycle events
- Permissions: `staff.service` + payment

---

### 6.3 Kitchen Journey

#### Flow K-01 — Station Board

**Navigation Map**

```text
Station Login (gap)
  ↓
Board (Pending → Preparing → Ready → Delivered)
  ↓
FulfilmentStatusChanged (live)
```

##### Screen: Kitchen / Station Board

**Status:** shipped (`/station/:stationId`)  
**Intent:** Keep fulfilment moving under pressure so guests receive what they ordered.  
**Entry Conditions:** Requires Capability `fulfilment.route` / station binding; Requires Permission station operator (target).  
**Exit Conditions:** Ticket completed (delivered); Offline Recovery; Capability Failure.

**States**
- **Loading** — Refreshing board
- **Empty** — No active tickets
- **Success** — Status applied (chip update)
- **Partial** — Some tickets stale vs live feed
- **Offline** — Last known tickets; queue status updates
- **Permission denied** — Wrong station / role
- **Error** — Status update failed

**Components:** Session Header · Fulfilment Ticket · Status Chip · Station Board Columns · Operator Touch Row · Neo Dock  
**Fields:** none  
**Interaction Rules**
- Status advances emit `FulfilmentStatusChanged`
- Refresh reloads board
- Large touch targets (operator density)

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Mark Preparing | `UpdateFulfilmentStatus` | `FulfilmentStatusChanged` |
| Mark Ready | `UpdateFulfilmentStatus` | `FulfilmentStatusChanged` |
| Mark Served | `UpdateFulfilmentStatus` | `FulfilmentStatusChanged` |
| Retry | `UpdateFulfilmentStatus` | `FulfilmentStatusChanged` |

**Navigation:** Refresh board (reload; not a business command)  
**Routes:** `/station/:stationId` (e.g. kitchen, bar)  
**Events:** `FulfilmentStatusChanged` (emitted); observes `FulfilmentCreated`

**Visual Characteristics:** Theme high-contrast under warm shell · Density operator · Spacing large · Motion minimal · Priority urgency by age (target) · Elevation flat rows

**Owned By**
- Runtime: Experience (surface); Capability (fulfilment)
- Pack: Restaurant (station labels)
- Capability: `fulfilment.*`
- Events: `FulfilmentCreated`, `FulfilmentStatusChanged`
- Permissions: station operator

---

### 6.4 Manager Journey

**Status: intentional gap** (lightweight stubs — not a freeze blocker)

#### Flow M-01 — Overview

**Navigation Map**

```text
Login → Overview → Live Sessions → Orders → Payments → Reports
```

| Screen | Intent | Entry Conditions | Owned By (summary) |
|--------|--------|------------------|--------------------|
| Manager Login | Authenticate manager | Identity + `staff.manager` | Experience |
| Overview | Venue health snapshot | Permission manager | Experience + Capability health |
| Live Sessions | Open sessions list | Permission manager | Experience / Context |
| Orders | Transaction list | Permission manager | Experience |
| Payments | Settlement / failures | Capability payment read | Capability |
| Reports | Aggregates | Permission manager | Experience (gap) |

Do not expand Manager into full screen templates until Experience Composition (LEK-029) and a Manager profile demand it. Schema for any future screen remains the frozen LEK-027 template.

---

## 7. System Journeys

Not human roles. Still UX. Nobody clicks “System” — users still **experience** these paths. Document them so recovery is designed, not improvised.

| System Journey | User feels | Owned By |
|----------------|------------|----------|
| QR Entry | Scanning in | Entry → Context → Experience |
| QR expired | Dead code / start over | Entry |
| Venue closed | Cannot start | Context |
| Reconnect session | App came back | Experience |
| Reconnect websocket | Live board paused then catches up | Experience |
| Offline sync | Work queued then applied | Experience |
| Session timeout | Asked to resume / rejoin | Experience |
| Capability unavailable | “Payments not set up” | Capability |
| Connector fails | Provider error | Capability + Connector |
| Connector timeout | Waiting too long | Capability + Connector |
| Retry payment | Second chance to pay | Capability |
| Payment webhook arrives | Status flips without tap | Connector → Capability |
| Permission upgrade | Staff unlock | Experience |

### 7.1 QR Entry / QR expired / Venue closed

Covered by Guest Flow G-01. System view: token → Context Runtime → Experience start.

**Intent:** Admit or refuse entry honestly.  
**Entry Conditions:** Valid token; venue open.  
**Exit Conditions:** Session live | QR Expired | Token Invalid | Venue closed.  
**States:** Loading · Error (*QR expired*, *Venue closed*) · Offline · Success  
**Owned By:** Entry → Context → Experience

### 7.2 Reconnect Session / Reconnect websocket

**Intent:** Restore live session and projections after tab close, process death, or socket drop without forcing a new QR scan when identity persists.  
**Entry Conditions:** Requires stored Session id; Requires Identity.  
**Exit Conditions:** Session Resume success; socket resubscribed; Session unknown → Entry.  
**Screens / overlays:** Soft restore on `/guest` or `/entry`; station board “reconnecting…”.  
**Actions:** none (system) · **Navigation:** Start fresh  
**Events:** re-subscribe to projections (no new domain event required).  
**Owned By:** Experience Runtime · Pack none · Permissions participant

### 7.3 Offline sync / Offline Recovery

**Intent:** Preserve user Intent when network drops, then sync without losing queued work.  
**Entry Conditions:** Client offline or API unreachable.  
**Exit Conditions:** Queue flushed; user cancels queued intent.  
**Screens:** Offline state on Menu, Cart, Station, Settle.  
**Interaction Rules:** Never drop queued add/submit/status; show Offline state.  
**Owned By:** Experience (client queue) · Events deferred until online · Permissions unchanged

### 7.4 Capability unavailable / Capability Failure

**Intent:** Explain that a required capability is missing or misbound (e.g. no payment connector).  
**Entry Conditions:** Action requires Capability; resolver fails.  
**Exit Conditions:** User backs out; Admin configures capability (Setup Studio).  
**States:** Error · Permission denied · Empty  
**Owned By:** Capability Runtime · Pack none

### 7.5 Connector fails / Connector timeout

**Intent:** Recover when a connector errors or does not respond in time.  
**Entry Conditions:** Capability invoke started; connector error or timeout.  
**Exit Conditions:** Retry payment; PaymentFailed; Cancelled.  
**Screens:** Error on Settle; timeout overlay.  
**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Retry | `RequestPayment` | `PaymentRequested`, `PaymentFailed`, `PaymentCompleted` |

**Events:** `PaymentFailed` (or connector-specific failure)  
**Owned By:** Capability + Connector

### 7.6 Payment webhook arrives

**Intent:** Reflect connector truth (ITN / webhook) into the session without requiring another guest tap.  
**Entry Conditions:** Inbound connector notification verified.  
**Exit Conditions:** PaymentCompleted | PaymentFailed projected to clients.  
**Screens:** Settle / Receipt transition to Success or Error automatically.  
**Events:** `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed`  
**Owned By:** Connector → Capability · Permissions system

### 7.7 Retry payment

**Intent:** Give the guest or staff a clear second attempt after failure without restarting the whole journey.  
**Entry Conditions:** Prior PaymentFailed or timeout; Session still open.  
**Exit Conditions:** PaymentCompleted | Cancelled.  
**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Retry | `RequestPayment` | payment lifecycle |

**Navigation:** Back to Menu · Close  
**Owned By:** Capability

### 7.8 Permission Upgrade

**Intent:** Elevate from guest-only to staff or manager surfaces when needed.  
**Entry Conditions:** Requires Identity challenge.  
**Exit Conditions:** Permission granted; Denied.  
**States:** Loading · Success · Permission denied · Error  
**Owned By:** Experience (authZ) · Pack Restaurant roles · Permissions target role

### 7.9 Session timeout / Session Resume

**Intent:** Continue after idle timeout or expired session with clear re-entry — never strand the user.  
**Entry Conditions:** Prior session expired or closed; user returns.  
**Exit Conditions:** New Join; or read-only receipt of prior visit (gap).  
**Owned By:** Experience · Events `SessionCompleted` already emitted if closed

---

## 8. Experience: Setup Studio (Admin)

**Journey:** Configure Payments  
**Source inventory:** [docs/ux/setup-studio-payment-connector-screens.md](ux/setup-studio-payment-connector-screens.md)  
**Routes:** `/setup`, `/setup/payments` (UI mock until API phase)  
**Guided Setup:** Discover → Understand → Configure → Validate → Complete

### Flow S-01 — Configure Payments

**Navigation Map**

```text
[0] Setup Hub
  ↓
[1] Choose Provider
  ↓
[2] Connector Overview
  ↓
[3] Merchant Details
  ↓
[4] Connecting (transient)
  ↓
[5] Merchant Verified
  ↓
[6] Settlement Account
  ↓
[7] Routing Strategy
  ↓
[8] Routing Configuration
  ↓
[9] Review
  ↓
[10] Activation
  ↓
[11] Success
```

Shared wizard chrome: **Progress Chrome** · Back escape · Visual Selection Cards · Neo Dock · Warm Sand / Deep Emerald / Electric Cyan intent.

---

##### Screen 0: Setup Hub

**Status:** mock  
**Intent:** Pick a business capability module to configure.  
**Entry Conditions:** Requires Identity (admin — target); Requires Permission `setup.studio`.  
**Exit Conditions:** Open Payments; Leave Setup.

**States:** Success (Payments available) · Empty/disabled modules (“Coming soon”) · Permission denied · Error  
**Components:** Experience Header · Visual Selection Card · Card Grid · Neo Dock  
**Fields:** none  
**Interaction Rules:** Non-ready modules not selectable  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Open Payments module | `OpenSetupModule` (client) | none (config surface) |

**Navigation:** Leave Setup  
**Routes:** `/setup` → `/setup/payments`  
**Events:** none (config surface)

**Visual Characteristics:** Theme warm · Density comfortable · Spacing sectioned · Motion card select · Priority medium · Elevation cards lifted

**Owned By**
- Runtime: Capability (configuration entry); Profile Engine (copy)
- Pack: none (platform Setup Studio)
- Capability: setup modules
- Events: none
- Permissions: `setup.studio`

---

##### Screen 1: Choose Payment Provider

**Status:** mock  
**Intent:** Help the operator choose the payment provider they already use or want.  
**Entry Conditions:** Requires Permission `setup.studio`.  
**Exit Conditions:** Provider selected → Overview; Cancel → Hub.

**States:** Loading · Empty (no providers) · Success (selection) · Partial · Offline · Permission denied · Error  
**Components:** Search · Category Tabs · Card Grid · Progress Chrome  
**Fields:** Search query (optional)  
**Interaction Rules:** Coming-soon cards disabled; verified badge informational; cyan glow on selection  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Select provider | `SelectPaymentProvider` (draft) | none until install |

**Navigation:** Cancel to hub · Continue to overview  
**Routes:** wizard step 1 → 2  
**Events:** none until install accepted

**Owned By**
- Runtime: Capability
- Pack: none
- Capability: payment connector catalogue
- Events: none
- Permissions: `setup.studio`

---

##### Screen 2: Connector Overview

**Status:** mock  
**Intent:** Make capabilities and permissions understandable before any credentials are stored.  
**Entry Conditions:** Provider selected.  
**Exit Conditions:** Accept & Install → Merchant Details; Cancel → Provider gallery.

**States:** Loading · Success · Error · Permission denied  
**Components:** Experience Header · Bottom Action Bar · Progress Chrome  
**Fields:** none (consent action)  
**Interaction Rules:** Accept implies permission consent for connector  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Accept & Install | `AcceptConnectorInstall` | install accepted (API phase) |

**Navigation:** Cancel  
**Routes:** → Screen 3  
**Events:** connector install accepted (when API-backed)

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector install
- Events: install lifecycle (API phase)
- Permissions: `setup.studio`

---

##### Screen 3: Merchant Details

**Status:** mock  
**Intent:** Capture merchant credentials safely and prove the connector can talk to the provider.  
**Entry Conditions:** Install accepted.  
**Exit Conditions:** Test success → Connecting; Back.

**States:** Loading (during test) · Empty fields · Success (inline ✓ Connected) · Partial · Offline · Permission denied · Error (validation/test fail)  
**Components:** Visual Selection Card (Sandbox/Production) · Progress Chrome · Success/Error Banner · Bottom Action Bar  
**Fields**

| Field | Type | Rules |
|-------|------|-------|
| Environment | card select | Required |
| Merchant ID | text | Required |
| API Key / Merchant Key | secret text | Required |
| Webhook Secret / Passphrase | secret text | Optional per provider |

**Validation:** Non-empty required secrets; Continue locked until test succeeds.  
**Interaction Rules:** Test Connection is a business Action; Continue is Navigation unlocked after Success; never show raw vault implementation details  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Test Connection | `VerifyPaymentMerchant` | verify success / failure (API phase) |
| Retry | `VerifyPaymentMerchant` | same |

**Navigation:** Continue (locked→unlocked) · Back  
**Routes:** → Screen 4 then 5  
**Events:** connection test result (API phase)

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector
- Events: verify/test
- Permissions: `setup.studio`

---

##### Screen 4: Connecting (transient)

**Status:** mock  
**Intent:** Show validation in progress without implying a business outcome yet.  
**Entry Conditions:** Test Connection started.  
**Exit Conditions:** Success → Verified; Failure → Merchant Details Error; Cancel test (optional).

**States:** Loading (then auto-advance) · Error (on failure return)  
**Components:** Progress Chrome  
**Actions:** none (system verify in flight)  
**Navigation:** Cancel test (optional)  
**Routes:** auto → Screen 5  
**Events:** none UI-only in mock

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector
- Events: verify in flight
- Permissions: `setup.studio`

---

##### Screen 5: Merchant Verified

**Status:** mock  
**Intent:** Confirm the merchant identity so the operator trusts what comes next.  
**Entry Conditions:** Connection validated.  
**Exit Conditions:** Continue → Settlement; Back → Merchant Details.

**States:** Success · Error · Offline  
**Components:** Success Banner · Progress Chrome · Bottom Action Bar  
**Fields:** read-only — Business name; MID; Country; Settlement currency; Status=Verified  
**Actions:** none  
**Navigation:** Continue · Back  
**Routes:** → Screen 6  
**Events:** merchant verified (API phase)

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector
- Events: verify success
- Permissions: `setup.studio`

---

##### Screen 6: Settlement Account

**Status:** mock  
**Intent:** Capture where settled funds should land.  
**Entry Conditions:** Merchant verified.  
**Exit Conditions:** Continue → Routing strategy; Back.

**States:** Empty · Success (valid form) · Error (validation) · Offline · Permission denied  
**Components:** Progress Chrome · Bottom Action Bar  
**Fields:** Bank name; Account holder; Branch code; Account number; Account type; Settlement currency; optional Settlement reference; checkbox validate-with-registry  
**Validation:** Required bank fields non-empty  
**Actions:** none until activate (draft save gap)  
**Navigation:** Continue · Back  
**Routes:** → Screen 7  
**Events:** none until save/activate

**Owned By**
- Runtime: Capability
- Pack: none
- Capability: payment settlement config
- Events: none yet
- Permissions: `setup.studio`

---

##### Screen 7: Routing Strategy

**Status:** mock  
**Intent:** Choose how payment routing fits the business shape (global, venue, or location).  
**Entry Conditions:** Settlement captured.  
**Exit Conditions:** Strategy selected → Routing config; Back.

**States:** Empty (no selection) · Success (selected) · Error if Continue without selection  
**Components:** Visual Selection Card · Progress Chrome · Bottom Action Bar  
**Interaction Rules:** Pictures/cards over radios; one selection  
**Actions:** none (selection is draft state)  
**Navigation:** Continue · Back  
**Routes:** → Screen 8 (or brief confirm for Global)  
**Events:** none

**Owned By**
- Runtime: Capability; Context (venue/location semantics)
- Pack: none
- Capability: payment routing
- Events: none
- Permissions: `setup.studio`

---

##### Screen 8: Routing Configuration

**Status:** mock  
**Intent:** Map merchants and settlement accounts onto venues or locations.  
**Entry Conditions:** Strategy selected.  
**Exit Conditions:** Continue → Review; Back → Strategy.

**States:** Empty mock rows · Partial · Error on incomplete matrix (target) · Success  
**Components:** Progress Chrome · Card Grid / matrix · Bottom Action Bar  
**Actions:** none until activate  
**Navigation:** Continue · Back  
**Routes:** → Screen 9  
**Events:** none until activate

**Owned By**
- Runtime: Capability; Context
- Pack: none
- Capability: payment routing
- Events: none
- Permissions: `setup.studio`

---

##### Screen 9: Review

**Status:** mock  
**Intent:** Confirm configuration before the system becomes live.  
**Entry Conditions:** Prior steps complete.  
**Exit Conditions:** Activate → Activation; Edit → earlier step.

**States:** Success-ready summary · Error · Permission denied  
**Components:** Progress Chrome · Payment Summary · Bottom Action Bar  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Activate | `ActivatePaymentConnector` | activation requested (API phase) |

**Navigation:** Edit configuration → earlier step  
**Routes:** → Screen 10; Edit → Screen 7 or earlier  
**Events:** activation requested (API phase)

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector activate
- Events: activate request
- Permissions: `setup.studio`

---

##### Screen 10: Activation

**Status:** mock  
**Intent:** Show provisioning progress so activation never feels like a black box.  
**Entry Conditions:** Activate confirmed.  
**Exit Conditions:** All checklist steps done → Success; Connector Timeout / Capability Failure on error (target).

**States:** Loading through checklist · Success · Partial (step failed) · Error (target)  
**Components:** Progress Chrome · Timeline (checklist)  
**Interaction Rules:** No Navigation escape while running; auto-advance  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| (system) Activate pipeline | `ActivatePaymentConnector` | binding active / failure |

**Navigation:** none while running  
**Routes:** auto → Screen 11  
**Events:** connector activated; capability binding hot-swap (API phase)

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector
- Events: binding active
- Permissions: `setup.studio`

---

##### Screen 11: Success

**Status:** mock  
**Intent:** Confirm payments are ready and offer a clear next step.  
**Entry Conditions:** Activation complete.  
**Exit Conditions:** Open Dashboard/Guest; Install another → Provider gallery.

**States:** Success  
**Components:** Success Banner · Bottom Action Bar  
**Sections:** Capabilities list (Accept, Refunds, Settlement, Reporting, Reconciliation)  

**Actions**

| Action | Command | Events |
|--------|---------|--------|
| Install Another Connector | `ResetPaymentSetupWizard` (client) | none |

**Navigation:** Open Dashboard / Go to Guest · Close  
**Routes:** exit Setup or → Screen 1 (reset)  
**Events:** observes active binding

**Owned By**
- Runtime: Capability + Connector
- Pack: none
- Capability: payment connector
- Events: health/active
- Permissions: `setup.studio`

---

## 9. Experience: Hotel (outline)

**Status: intentional gap** (outline only — not a freeze blocker)  
**Pack:** Hotel (future)  
**Point:** Prove component reuse without restaurant nouns. Full journeys wait for LEK-028/029 and a Hotel Experience Profile.

### Journeys (stubs)

| Journey | Flows (titles) | Shared LEOS components |
|---------|----------------|------------------------|
| Guest Stay | Check-in → In-room → Room Service → Checkout | Header, Search, Category Tabs, Product Grid, Bottom Cart, Visual Cards |
| Housekeeping | Board → Room status | Station Board Columns |
| Front Desk | Arrivals → Folio → Payment | Settle Payment (Capability), Assistance List |
| System | Session Resume, Offline Recovery, Connector Timeout | same System Journeys |

**Room Service Menu** reuses Restaurant Menu components; Profile Engine supplies hotel terminology (“room”, “order”, “folio”) — never hardcoded in runtime.

**Owned By (Room Service screen summary)**
- Runtime: Experience; Profile Engine
- Pack: Hotel
- Capability: fulfilment + payment as needed
- Events: same canonical set
- Permissions: in-stay guest

---

## 10. Shared screen index

Define once; cross-reference from journeys.

| Screen | Journeys | Notes |
|--------|----------|-------|
| Settle Payment | Guest, Waiter assist, Front Desk | Capability-owned; shared |
| Assistance Queue | Waiter, Service | Experience-owned |
| Station Board | Kitchen, Bar, Housekeeping | Same component, different stationId |
| Menu / Catalogue | Guest Restaurant, Hotel Room Service | Shared components; pack content |
| Session Resume / Reconnect | All | System Journeys |
| Offline Recovery | All | System Journeys |
| Capability Failure | Guest settle, Setup, Station | System Journeys |
| Setup Hub | Admin | Setup Studio |

---

## 11. Derivation checklist

When implementing or testing from this catalogue, each screen should yield:

1. **Intent** → analytics goal, a11y purpose, Neo/AI prompt seed  
2. **Flow Navigation Map** → route table + e2e happy path + LEK-029 IA seed  
3. **Entry Conditions** → guards / capability resolver checks  
4. **Exit Conditions** → redirects and System Journeys  
5. **States** → Loading / Empty / Success / Partial / Offline / Permission denied / Error templates  
6. **Components** → shared LEOS blocks (full specs in LEK-028); do not fork per pack  
7. **Fields** → form model + DTO validation  
8. **Interaction Rules** → client behaviour tests  
9. **Actions** → Angular handlers + **API commands** + permission checks  
10. **Action → Command → Events** → outbox names, subscribers, Playwright assertions  
11. **Navigation** → router links / back stack (not mixed into Actions)  
12. **Routes** → `app.routes.ts` entries  
13. **Permissions** → authZ matrix  
14. **Analytics** → intent + action instrumentation  
15. **Accessibility checklist** → name from Intent; focus order; state announcements  
16. **Playwright tests** → Navigation Map + States + primary Action  
17. **Unit tests** → Command handlers / reducers  
18. **Documentation** → screen excerpt in ops/runbooks  
19. **AI prompts** → Intent + Components + States for generative UI (future)  
20. **Owned By** → fail PR review if footer missing or Platform Rule violated  
21. **Terminology** → Profile Engine only for pack nouns  

Eventually LEOS may compile many of these automatically from the catalogue.

---

## 12. Relationship to other documents

| Document | Relationship |
|----------|----------------|
| **LEK-001** | Constitution — **Frozen** (ADR-only) |
| **LEK-026** | LEDS visual language — consumed by components |
| **LEK-027** (this) | Interaction Specification — **Frozen** |
| **LEK-028** | Component Catalogue — Design stream |
| **LEK-029** | Experience Composition & Wireframes — how people move |
| **LEK-030** | Information Architecture — planned |
| **LEK-031** | Entry Runtime manual — Platform stream |
| LEK-022 / UX inventory | Setup Studio payment screens — consumed into §8 |
| LEK-025 Dynamic UI Renderer | Future consumer of Components + Intent |
| `docs/LEOS.md` | Dual-stream roadmap pointer |
| `apps/web` routes | Ground truth; catalogue may list intentional gaps |

---

## Appendix A — Canonical events (reference)

`ExperienceStarted`, `ExperienceContextResolved`, `ParticipantJoined`, `TransactionCreated`, `FulfilmentCreated`, `FulfilmentStatusChanged`, `PaymentRequested`, `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed`, `SessionCompleted`

---

## Appendix B — Current Angular route map

| Route | Catalogue screens |
|-------|-------------------|
| `/entry` | QR Entry / Join |
| `/guest` | Menu, Cart/Submit, Settle, Assistance request |
| `/service` | Assistance Queue / Session Close |
| `/station/:stationId` | Kitchen / Station Board |
| `/setup` | Setup Hub |
| `/setup/payments` | Configure Payments Screens 1–11 |

---

*End of LEK-027 Experience Interaction Specification (Frozen v1.1).*
