# G-03 — Guest Menu (complete interaction specification)

**Uncertainty removed:** What can I do?

**Screen family:** Guest Menu  
**Journey:** Experience Heartbeat — Browse  
**Layout grammar:** Guest  
**Constitution:** [Restaurant Pack UX Constitution](../../restaurant-pack-ux-constitution.md) §1 — **Browse should never feel like shopping**  
**Behaviour:** Proven ✓ Restaurant — *catalogue is browsed before commitment* ([LEK-038](../../LEK-038-behaviour-inventory.md))  
**Reference Experience:** Honest Greens / calm table-side browse — adopt behaviour, not code  
**Runtime owner:** Experience Runtime · Profile Engine (labels)  
**Pack owner:** Restaurant Experience Pack (catalogue content)  
**Capability:** none (browse)  
**Inventory:** [Guest Experience Inventory](../guest-experience-inventory.md) — **✅**  
**Reuse:** ★★★★★ Core LEOS interaction

### Platform Value

Demonstrates catalogue discovery, filtering, deferred commitment toward a Transaction, and Experience Profile terminology — without restaurant nouns in the runtime.

**Future reuse:** Restaurant · Hotel room service · Festival vendors · Golf clubhouse · Museum shop · Retail kiosks · Spa menus

Strengthens **LEOS** (browse-before-commit), not only the Restaurant Pack.

### Browse constitution (Frozen)

| Use | Avoid |
|-----|--------|
| Large venue header | E-commerce / marketplace density |
| Sticky category chips | Multi-level category trees |
| List cards — **food icon left**, copy, + right | Competing card walls |
| **+ / qty pill on the row** | Separate add-item page for simple items |
| Floating **Your order** chip above tab bar | Hidden cart |
| Guest tab bar: Menu · Orders · Bill · Help · Leave | Separate apps / no session chrome |
| Search only when menus are large | Search as default primary path |

Goal: *I'm sitting at a table. I want to order quickly without thinking.*

**Add on Browse (Frozen · Pattern 6):** Tap `+` to add; stay on the menu; pill adjusts count. Required choices open a sheet over the menu — not a new page.

This is a **state family**, not one page. Each section is one wireframe / one implementation branch.

---

## Shared (all Menu states)

### Intent (family)

Help a guest discover catalogue items and move toward configuring or checking out — without creating a Transaction yet.

### User goal (family)

Find something to add; always know where I am (venue / context / session).

### System goal (family)

Present profile-scoped catalogue; keep Session live; never invent items; live updates without refresh.

### Layout (Guest grammar)

```text
┌───────────────────────────┐
│ Header                    │  Session Header
├───────────────────────────┤
│ Context Banner            │  when offline / closed / error
├───────────────────────────┤
│ Main Content              │  search · categories · cards
├───────────────────────────┤
│ Primary Action            │  Open cart / Assist / Leave
└───────────────────────────┘
         [Neo Dock]
```

### Components (LEK-028) — extracted here

| Component | Role on Menu |
|-----------|----------------|
| Session Header | Where am I? |
| Context Banner | Closed / offline / error |
| Search Surface | Query |
| Filter Bar | Categories |
| Menu Card (Entity Card) | Catalogue row/card |
| Cart Summary | Sticky cart affordance |
| Bottom Action Bar | Primary / escape |
| Empty State | No items / no matches |
| Offline Banner | Continuity |
| Status Chip | Unavailable / updated |
| Loading Surface | Skeleton |
| Neo Dock | Passive presence |

### Accessibility (family)

- One `h1` (purpose) in Session Header  
- Search is `role="search"` with visible label  
- Category Filter Bar is `tablist` or `toolbar` with selected state announced  
- Menu Cards are listitems; “View” / card activate has accessible name including item + price  
- Cart Summary announces count via `aria-live="polite"` when badge changes  
- Offline / Closed banners use `role="status"` or `alert` as appropriate  
- Focus moves to main on state change (Loading → Items); do not trap focus in Neo Dock  

### Navigation (family exits)

| From | To |
|------|-----|
| + simple item | stay Menu (line in draft) |
| + / open item with required choices | G-04 Item **sheet over Menu** |
| Open cart / Your order | G-05 Cart |
| Pay (if payable) | G-07 Payment |
| Leave (closed) | G-09 Leave |
| Assist | side-effect (stay Menu) |

### Runtime / Pack

| | |
|--|--|
| Runtime | Experience (surface + session) · Profile Engine (terminology) |
| Pack | Restaurant — catalogue items, categories, closed copy |
| Not | Entry, Capability (until Pay) |

---

## Guest.Menu.S1 — Loading

| | |
|--|--|
| **Intent** | Fetch catalogue without implying the menu is empty. |
| **User goal** | Wait with confidence. |
| **System goal** | Load venue/profile catalogue. |
| **Information shown** | Header · skeleton cards or spinner · no cart primary. |
| **Fields** | none |
| **Validation** | none |
| **Actions** | none (optional Cancel → Entry only if session abort allowed) |
| **Navigation** | → S2 Empty · S3 Items · S5 Closed · S6 Offline · Error→retry S1 |
| **Events** | none |
| **Components** | Session Header · Loading Surface · Neo Dock |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | `aria-busy="true"` on main; announce “Loading menu” |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main  [ Loading… ]        │
├───────────────────────────┤
│ (no primary)              │
└───────────────────────────┘
```

---

## Guest.Menu.S2 — Empty

| | |
|--|--|
| **Intent** | Honest empty catalogue. |
| **User goal** | Know there is nothing to order; get help. |
| **System goal** | Do not invent items. |
| **Information shown** | Empty message · Assist CTA. |
| **Fields** | none |
| **Validation** | none |
| **Actions** | Request assistance (primary) |
| **Navigation** | Assist → stay; rare Back → Entry |
| **Events** | `CreateAssistanceRequest` on Assist |
| **Components** | Session Header · Empty State · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant (empty copy) |
| **A11y** | Empty State `role="status"` |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main  [ No menu ]         │
├───────────────────────────┤
│ Request assistance        │
└───────────────────────────┘
```

**Reference Experience:** Restaurant empty/unavailable catalogue — same honesty, LEOS Empty State component.

---

## Guest.Menu.S3 — Categories + Items (available)

| | |
|--|--|
| **Intent** | Discover and select items (happy path). |
| **User goal** | Browse by category; open an item or cart. |
| **System goal** | Present live catalogue; Session stays active. |
| **Information shown** | Header · category chips · menu cards (name, category, price, availability) · cart summary if cart≠0 · profile pill. |
| **Fields** | none (selection is action) |
| **Validation** | Unavailable cards not activatable |
| **Actions** | Select category · View item · Open cart · Request assistance · Pay (if payable) |
| **Navigation** | View → G-04 · Cart → G-05 · Pay → G-07 |
| **Events** | optional soft `ItemViewed`; Assist → assistance event |
| **Components** | Session Header · Filter Bar · Menu Card · Cart Summary · Bottom Action Bar · Neo Dock · Status Chip (unavailable) |
| **Runtime** | Experience · Profile Engine |
| **Pack** | Restaurant catalogue |
| **A11y** | List of cards; price in accessible name; unavailable `aria-disabled` |

```text
┌───────────────────────────┐
│ Header + profile          │
├───────────────────────────┤
│ Categories                │
├───────────────────────────┤
│ [ Card ] [ Card ]         │
│ [ Card ] …                │
├───────────────────────────┤
│ Assist | Open cart (n)    │
└───────────────────────────┘
```

**Reference Experience:** Restaurant menu browse + category chips — adopt; LEOS owns Filter Bar + Menu Card.

---

## Guest.Menu.S4 — Search

| | |
|--|--|
| **Intent** | Find by text without leaving Menu. |
| **User goal** | Locate a specific item. |
| **System goal** | Filter client-side (server search later). |
| **Information shown** | Search field · match count or cards · clear. |
| **Fields** | `searchQuery` (string, optional) |
| **Validation** | Trim; empty query = S3 |
| **Actions** | Type · Clear · View item |
| **Navigation** | same as S3 |
| **Events** | none required |
| **Components** | Search Surface · Menu Card · Empty State (no matches) |
| **Runtime** | Experience (client) |
| **Pack** | Restaurant (item labels searchable) |
| **A11y** | Labelled search; results count announced politely |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Search [  query  ] [x]   │
├───────────────────────────┤
│ Main  [ Matches ]         │
├───────────────────────────┤
│ Open cart                 │
└───────────────────────────┘
```

---

## Guest.Menu.S5 — Filter (category active)

| | |
|--|--|
| **Intent** | Progressive disclosure by category. |
| **User goal** | See only one category. |
| **System goal** | Same catalogue, narrowed. |
| **Information shown** | Selected category · filtered cards · All chip. |
| **Fields** | `categoryId` (optional; empty = All) |
| **Validation** | Unknown category → All |
| **Actions** | Select category · All · View item |
| **Navigation** | same as S3 |
| **Events** | none |
| **Components** | Filter Bar · Menu Card |
| **Runtime** | Experience |
| **Pack** | Restaurant categories |
| **A11y** | Selected tab `aria-selected=true` |

*(May compose with S4 — Search + Filter together is still Menu family.)*

---

## Guest.Menu.S6 — Item selected (preview / handoff)

| | |
|--|--|
| **Intent** | Acknowledge selection before leaving Menu for Item. |
| **User goal** | Confirm which card was chosen. |
| **System goal** | Navigate to G-04 with item id. |
| **Information shown** | Selected card emphasis (cyan/selection) · optional brief sheet OR immediate nav. |
| **Fields** | none |
| **Validation** | Item must be available |
| **Actions** | Open Item (primary) · Cancel selection |
| **Navigation** | → G-04 Item.S1 |
| **Events** | optional ItemViewed |
| **Components** | Menu Card (selected) · Bottom Action Bar or auto-nav |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | Selection announced; focus moves to Item purpose on arrival |

**Note:** Prefer **immediate navigation** to G-04 (progressive disclosure). Selected highlight is optional micro-state.

---

## Guest.Menu.S7 — Closed (venue / profile inactive)

| | |
|--|--|
| **Intent** | Block ordering when experience cannot sell. |
| **User goal** | Understand why; leave or wait. |
| **System goal** | Prevent Transaction create from this surface. |
| **Information shown** | Closed Context Banner · no actionable cards (or read-only). |
| **Fields** | none |
| **Validation** | N/A |
| **Actions** | Leave (primary) · Request assistance (secondary) |
| **Navigation** | → G-09 Leave |
| **Events** | Assist only |
| **Components** | Context Banner · Empty/Error Surface · Bottom Action Bar |
| **Runtime** | Context · Experience |
| **Pack** | Restaurant (closed copy) |
| **A11y** | Banner `role="alert"` |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Closed banner             │
├───────────────────────────┤
│ Main  [ Unavailable ]     │
├───────────────────────────┤
│ Assist | Leave            │
└───────────────────────────┘
```

**Reference Experience:** Venue closed / not accepting orders — same behaviour.

---

## Guest.Menu.S8 — Offline

| | |
|--|--|
| **Intent** | Never lose browse Intent; use cache. |
| **User goal** | Keep browsing; know sync will catch up. |
| **System goal** | Show cached catalogue; queue cart Intent. |
| **Information shown** | Offline Banner · cached cards · cart. |
| **Fields** | search/filter still work on cache |
| **Validation** | same as S3 on cache |
| **Actions** | View · Open cart · Retry sync |
| **Navigation** | G-04 / G-05 |
| **Events** | deferred until online |
| **Components** | Offline Banner · Menu Card · Cart Summary |
| **Runtime** | Experience (client queue) |
| **Pack** | Restaurant |
| **A11y** | Offline `role="status"` polite |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Offline banner            │
├───────────────────────────┤
│ Main  [ Cached cards ]    │
├───────────────────────────┤
│ Open cart                 │
└───────────────────────────┘
```

**Reference Experience:** Offline menu/order queue — adopt continuity behaviour.

---

## Guest.Menu.S9 — Live menu update

| | |
|--|--|
| **Intent** | Live by default — availability changes without refresh. |
| **User goal** | See current truth (item sold out / back). |
| **System goal** | Patch catalogue projection into cards. |
| **Information shown** | Subtle update cue · Status Chip on changed cards. |
| **Fields** | none |
| **Validation** | Newly unavailable cards disable |
| **Actions** | same as S3 |
| **Navigation** | same as S3 |
| **Events** | observe catalogue/availability projections (future) |
| **Components** | Menu Card · Status Chip · (optional soft toast — prefer chip, not popup) |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | Changed availability announced politely; no modal interrupt |

**Reference Experience:** Real-time item status — LEOS prefers chip/update over interrupting popups (Neo passive).

---

## Guest.Menu — Error (fetch failed)

| | |
|--|--|
| **Intent** | Recoverable catalogue failure. |
| **User goal** | Retry. |
| **System goal** | Do not show Empty as if no menu. |
| **Information shown** | Error Surface · Retry. |
| **Actions** | Retry → S1 |
| **Navigation** | stay |
| **Events** | none |
| **Components** | Error Surface · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | `role="alert"` |

---

## State transition map

```text
                 ┌──────────┐
                 │   S1     │ Loading
                 └────┬─────┘
          ┌──────────┼──────────┬─────────┐
          ▼          ▼          ▼         ▼
        S2 Empty   S3 Items   S7 Closed  S8 Offline
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
       S4 Search   S5 Filter   S6 Selected → G-04
         │           │
         └─────► S3 ◄┘
                     │
                     ▼
              S9 Live update (overlay on S3)
```

---

## Implementation notes (for Phase 4 — not now)

- One route `/guest` phase `browse` may host all Menu states; state machine drives UI.  
- Reference components by LEK-028 name — do not redraw.  
- Pack supplies catalogue DTO; runtime does not hardcode “burger”.

*End of G-03 complete interaction specification.*
