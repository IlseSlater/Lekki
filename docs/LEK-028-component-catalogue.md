# LEK-028 — Component Catalogue

**Status:** Active — **incrementally frozen**  
**Governed by:** [LEK Build Loop](BUILDING-LEOS.md) — extract from screens; freeze before redesign  
**Title:** LEOS Platform Component Catalogue  
**Consumes:** [LVES](ux/lves.md) (look) · [LEK-040](LEK-040-human-experience-engineering.md) (feel) · [LEK-026 LEDS](LEK-026-leds-visual-language.md) (legacy tokens)  
**Used by:** Experience · Studio screens · [LEK-029](LEK-029-experience-composition.md)  
**Rule:** Platform primitives. Once a component is **Frozen**, screens adapt to it — not the reverse.

**Layering:** LEK-040 (feel) → LVES (look) → **LEK-028 (parts)** → implementation.

### Freeze registry


| Component          | Status     | Frozen from          |
| ------------------ | ---------- | -------------------- |
| Session Header     | **Frozen** | G-03                 |
| Menu Card          | **Frozen** | G-03                 |
| Search Surface     | Draft      | G-03                 |
| Filter Bar         | Draft      | G-03                 |
| Quantity Stepper   | **Frozen** | G-04                 |
| Cart Summary       | **Frozen** | G-03 / G-05 (chip)   |
| Guest Tab Bar      | **Frozen** | Guest shell          |
| Menu Card          | **Frozen** | G-03                 |
| Bottom Action Bar  | **Frozen** | G-03                 |
| Empty State        | Draft      | G-03                 |
| Offline Banner     | Draft      | G-03                 |
| Error Surface      | Draft      | G-03                 |
| Form Section       | Draft      | G-04                 |
| Action Sheet       | Draft      | G-04                 |
| Loading Surface    | Draft      | G-03                 |
| Status Chip        | Draft      | G-03                 |
| Neo Dock           | Draft      | shell                |
| Line Item Row      | **Frozen** | G-05                 |
| Order Total        | **Frozen** | G-05                 |
| Selection Card     | Draft      | G-07 (method choice) |
| Payment Summary    | **Frozen** | G-07                 |
| Status Timeline    | **Frozen** | G-06                 |
| Confirmation Panel | Draft      | G-07 / G-08          |


**Freeze means:** Intent, anatomy, props, a11y, and ownership are stable. Visual tokens (Stage 4 LEDS) may still refine without changing behaviour.

Every component specifies: Intent · When used · Anatomy · Variants · States · Accessibility · Responsive · Design tokens (LVES / LEDS) · Runtime owner · **Freeze status**.

**Complete only when:** Purpose · Primary action · Loading · Empty · Success · Error · Offline · Accessibility.

---



## Component template

```markdown
### {Name}

**Intent:** …
**When used:** …
**Anatomy:** …
**Variants:** …
**States:** default | hover/focus | selected | disabled | loading | error | success | empty | offline
**Props (logical):** …
**Accessibility:** …
**Responsive / density:** guest micro | operator | setup
**Design tokens:** (LEDS refs)
**Runtime owner:** LEOS shell | Entry | Context | Experience | Capability | Profile Engine
**Pack content:** none | labels/data only
```

---



## Catalogue



### App Shell

**Intent:** Provide the ambient LEOS chrome every experience lives inside.  
**When used:** All routed experiences.  
**Anatomy:** Ambient surface · optional top region · main · optional sticky footer slot · Neo Dock host.  
**Variants:** Guest · Operator · Setup.  
**States:** default · offline (hosts Offline Banner).  
**Props:** `density`, `showNeoDock`.  
**Accessibility:** Landmark `main`; skip link to primary action when footer used.  
**Responsive / density:** All three modes.  
**Design tokens:** `--leos-warm-sand`, `--leos-surface-ambient`, spacing scale.  
**Runtime owner:** LEOS shell  
**Pack content:** none

---



### Session Header

**Intent:** Answer “Where am I?” with session / profile / context chips.  
**When used:** Guest Menu, Payment, Service, Station, Hotel Room Service.  
**Anatomy:** Title (purpose) · lead · optional profile pill · optional context chip.  
**Variants:** Compact · Comfortable.  
**States:** default · loading (skeleton) · error (session missing).  
**Props:** `purpose`, `lead`, `profileLabel`, `contextLabel`.  
**Accessibility:** Header landmark; title is `h1` or `aria-labelledby`.  
**Responsive / density:** Guest micro compact; operator larger title.  
**Design tokens:** typography hierarchy, `--leos-neutral-`*.  
**Runtime owner:** Experience · Profile Engine (labels)  
**Pack content:** terminology strings only

---



### Context Banner

**Intent:** Surface venue / physical context / venue-closed warnings without leaving the screen.  
**When used:** Entry resolve failure aliases; venue closed; station context.  
**Anatomy:** Icon slot · message · optional Navigation action.  
**Variants:** Info · Warning · Danger.  
**States:** default · dismissible.  
**Props:** `tone`, `message`, `actionLabel`.  
**Accessibility:** `role="status"` or `alert` by tone.  
**Design tokens:** `--leos-warning`*, `--leos-danger*`, `--leos-emerald-soft`.  
**Runtime owner:** Context · Entry  
**Pack content:** none

---



### Bottom Action Bar

**Intent:** Host the Grammar primary action and escape Navigation.  
**When used:** Any screen with sticky primary CTA.  
**Anatomy:** Escape slot · Primary slot · optional secondary.  
**Variants:** Single CTA · Dual (escape + primary).  
**States:** default · primary disabled · loading.  
**Props:** `primaryLabel`, `primaryDisabled`, `escapeLabel`.  
**Accessibility:** Primary is the only `aria-keyshortcuts` candidate; focus order escape then primary.  
**Responsive / density:** Sticky on guest; larger hit targets on operator.  
**Design tokens:** `--leos-emerald`, `--leos-radius-button`, `--leos-touch-min`, `--leos-shadow-emerald`.  
**Runtime owner:** LEOS shell  
**Pack content:** label terminology

---

### Menu Card

**Intent:** Catalogue row on Browse — discover and add without leaving the menu.  
**When used:** Guest Menu (G-03).  
**Anatomy:** Food thumb (left) · Name · description · price · **+** (qty 0) or Quantity Stepper pill (qty > 0).  
**Variants:** Simple (one-tap add) · Needs choices (opens G-04 sheet — future).  
**States:** default · in-order (qty > 0) · unavailable.  
**Props:** `label`, `category`, `unitPrice`, `description`, `quantity`.  
**Events:** `add` · `quantityChange` · `remove`.  
**Thumb:** Category/label food icon until Pack supplies photos. Layout: **icon left**, copy centre, action right.  
**Accessibility:** Listitem; Add / Decrease / Increase / Remove named with item.  
**Runtime owner:** Experience  
**Pack content:** labels · images · choice requirement  
**Freeze status:** **Frozen** (G-03 · add-on-browse)

---

### Guest Tab Bar

**Intent:** Persistent guest session chrome — switch Menu / Orders / Bill; Help and Leave as actions.  
**When used:** Guest with active session (all heartbeat phases).  
**Anatomy:** Five controls — Menu · Orders · Bill · Help · Leave (SVG icons + labels).  
**Variants:** none.  
**States:** active tab · leave-armed.  
**Props:** `active` (`menu` \| `orders` \| `bill`), `leaveActive`.  
**Events:** `tabSelect` · `help` · `leave`.  
**Accessibility:** `nav` labelled “Guest navigation”; each control named.  
**Design tokens:** cream bar · gold active · hairline top (LVES).  
**Runtime owner:** Experience shell  
**Pack content:** tab labels (default Restaurant Pack English)  
**Behaviour reference:** dark-culinary bottom nav — **IA/labels only**, not theme or code.  
**Freeze status:** **Frozen**

---



### Neo Dock

**Intent:** Passive intelligence presence — never interrupt.  
**When used:** All guest/staff shells.  
**Anatomy:** Cyan pulse control · optional side drawer (future).  
**Variants:** Collapsed (default) · Expanded drawer (gap).  
**States:** idle pulse · attention (soft) · disabled.  
**Props:** `attention`.  
**Accessibility:** Button name “Neo”; drawer when open is dialog.  
**Design tokens:** `--leos-electric-cyan`, `--leos-electric-cyan-soft`.  
**Runtime owner:** LEOS shell (Neo later)  
**Pack content:** none

---



### Progress Indicator

**Intent:** Show guided-setup or multi-step progress.  
**When used:** Setup Studio wizard.  
**Anatomy:** Track · fill · optional “N%” / step label.  
**Variants:** Percent · Steps.  
**States:** in-progress · complete.  
**Props:** `value`, `label`.  
**Accessibility:** `role="progressbar"` with valuemin/max/now.  
**Design tokens:** emerald fill on sand track.  
**Runtime owner:** LEOS shell  
**Pack content:** none

---



### Selection Card

**Intent:** Choose one option without radio rows.  
**When used:** Entry profile tokens; Setup environment; routing strategy.  
**Anatomy:** Title · description · selected ring.  
**Variants:** Two-up · Grid.  
**States:** default · selected · disabled · focus.  
**Props:** `title`, `description`, `selected`, `disabled`.  
**Accessibility:** `role="radio"` inside `radiogroup` or toggle button with pressed.  
**Design tokens:** `--leos-radius-card`, cyan selection glow, `--leos-shadow-card`.  
**Runtime owner:** LEOS shell  
**Pack content:** option copy  
**Freeze status:** Draft (G-07 method choice)  

---



### Quantity Stepper

**Intent:** Adjust line quantity before commit.  
**When used:** Guest Item sheet (G-04); Cart line edit (**Your order**); **Menu Card** row when qty > 0.  
**Anatomy (Frozen · DoorDash pill):** Left control · value · Increment.  
- Cart (`allowRemove`): at qty = min, left = **trash** (Remove line); at qty > min, left = **−**.  
- Item / no remove: left = **−** (disabled at min).  
**Variants:** Compact pill (guest cart) · Operator-large.  
**States:** default · min reached · max reached · disabled · remove-armed (trash).  
**Props:** `quantity`, `min`, `max`, `label`, `allowRemove`.  
**Events:** `quantityChange` · `remove` (when trash / decrement below min with allowRemove).  
**Accessibility:** Group labelled “Quantity”; Decrease / Increase / Remove named with item; value in live region.  
**Responsive / density:** Guest micro · touch target ≥ 44px.  
**Design tokens:** pill radius full · sand fill (Stage 4 / LVES).  
**Runtime owner:** LEOS shell  
**Pack content:** none (limits may be Pack policy)  
**Freeze status:** **Frozen** (G-04 / G-05 DoorDash cart control)  
**Extracted from:** G-04 Item ✅ · refined G-05 Cart

---



### Status Chip

**Intent:** Show fulfilment / payment / connection status at a glance.  
**When used:** Station board; payment; Setup verified.  
**Anatomy:** Label · tone fill.  
**Variants:** Neutral · Success · Warning · Danger · Info.  
**States:** static.  
**Props:** `label`, `tone`.  
**Accessibility:** Text includes status word; not colour-only.  
**Design tokens:** semantic colours.  
**Runtime owner:** Experience · Capability  
**Pack content:** status terminology

---



### Badge

**Intent:** Numeric or short attention mark (cart count).  
**When used:** Bottom Cart; notifications (future).  
**Anatomy:** Numeric label on host.  
**States:** empty (hidden) · active · animating.  
**Props:** `count`.  
**Accessibility:** `aria-label` “N items in cart”.  
**Design tokens:** emerald / cyan accent; motion pulse from LEDS.  
**Runtime owner:** Experience  
**Pack content:** none

---



### Status Timeline

**Intent:** Show ordered progress of a commitment as platform steps; Pack supplies labels.  
**When used:** Guest Live Order (G-06); reusable for Hotel Room Service, Festival, Spa, Golf progress.  
**Anatomy:** Vertical steps · current marker · optional meta (“what’s next”) · not a kitchen board.  
**Variants:** Compact (Guest) · Comfortable.  
**States:** pending · in_progress · ready · completed · stale (offline) · error.  
**Props:** `steps[]` (`id`, `label`, `state`: upcoming  current  done), `currentIndex`, `guidance?`.  
**Platform step ids (stable):** `submitted` · `accepted` · `in_progress` · `ready` · `completed`.  
**Accessibility:** Ordered list; current step in polite live region on change; not colour-only.  
**Responsive:** Guest micro; operator may reuse larger density later.  
**Design tokens:** neutral track · emerald current · muted upcoming (Stage 4).  
**Runtime owner:** Experience (render) · Capability (source status)  
**Pack content:** step labels only  
**Freeze status:** **Frozen** (G-06)  
**Not:** Order Timeline · Kitchen Timeline — those names are Pack metaphors; the primitive is Status Timeline.

---



### Timeline (event feed)

**Intent:** Show ordered discrete events or activation checklist (complement to Status Timeline).  
**When used:** Optional event proof; Setup activation pipeline.  
**Anatomy:** Vertical list · timestamps optional · status per row.  
**Variants:** Event feed · Checklist.  
**States:** empty · loading · live.  
**Props:** `items[]`.  
**Accessibility:** List; live region when appending.  
**Design tokens:** muted meta, success ticks.  
**Runtime owner:** Experience (events) · Capability (activation)  
**Pack content:** none  
**Freeze status:** Draft — prefer Status Timeline for Experience Progress  

---



### Search Surface

**Intent:** Filter a catalogue or provider grid.  
**When used:** Menu; provider gallery.  
**Anatomy:** Field · clear · optional submit.  
**States:** empty · filled · loading results.  
**Props:** `value`, `placeholder`.  
**Accessibility:** Labelled textbox; `role="search"`.  
**Design tokens:** `--leos-radius-input`, focus sand.  
**Runtime owner:** LEOS shell  
**Pack content:** placeholder terminology

---



### Filter Bar

**Intent:** Constrain lists by category or facet.  
**When used:** Menu categories; provider chips; station filters.  
**Anatomy:** Horizontal chips / tabs.  
**Variants:** Tabs · Chips.  
**States:** one selected · multi (gap).  
**Props:** `options`, `value`.  
**Accessibility:** Tablist or toolbar.  
**Design tokens:** emerald soft selected; cyan optional.  
**Runtime owner:** Experience  
**Pack content:** category labels

---



### Cart Summary

**Intent:** Floating **Your order** chip above Guest Tab Bar — open draft review (cart is not a tab).  
**When used:** Guest with draft lines; hidden on Cart / Leave.  
**Anatomy:** Count · total · “Your order” CTA.  
**States:** empty (hidden) · active.  
**Props:** `count`, `total`, `currency`.  
**Events:** `open`.  
**Accessibility:** Button named with count and total.  
**Design tokens:** ink pill · gold CTA.  
**Runtime owner:** Experience  
**Pack content:** currency / “Your order” terminology  
**Freeze status:** **Frozen** (chip · G-03 / G-05)  
**Behaviour reference:** dark-culinary floating cart chip — structure only  

---



### Line Item Row

**Intent:** Show one draft or committed line with qty and remove/edit.  
**When used:** Guest Cart (G-05) **Your order**; Live Order line summaries.  
**Anatomy (Frozen · DoorDash):** Thumb · name · choice summary · unit price · Quantity Stepper pill. No separate Remove button — trash lives in the pill.  
**Variants:** Draft (editable) · Read-only.  
**States:** default · removing · disabled.  
**Props:** `label`, `quantity`, `unitPrice`, `currency`, `editable`, `imageUrl?`, `choiceSummary?`.  
**Accessibility:** Listitem; Remove / Decrease / Increase named with label.  
**Runtime owner:** Experience  
**Pack content:** labels · choice summaries · images  
**Freeze status:** **Frozen** (G-05 · DoorDash line anatomy)  

---



### Order Total

**Intent:** Display sum of lines before or after commit.  
**When used:** Cart · Payment Summary precursor.  
**Anatomy:** Label · amount · currency.  
**States:** default · updating.  
**Props:** `total`, `currency`.  
**Accessibility:** Text amount.  
**Runtime owner:** Experience / Capability  
**Pack content:** terminology (“Total”)  
**Freeze status:** **Frozen** (G-05)  

---



### Payment Summary

**Intent:** Show amount due and settlement Intent before Pay.  
**When used:** Settle Payment (G-07); Receipt; Setup review snippets.  
**Anatomy:** Label · amount · optional breakdown · status chip slot.  
**States:** loading · ready · pending · paid · failed · cancelled.  
**Props:** `amount`, `currency`, `status`, `breakdown?`.  
**Accessibility:** Amount as text, not image; status announced.  
**Design tokens:** neutral + success/danger by status.  
**Runtime owner:** Capability  
**Pack content:** payment terminology  
**Freeze status:** **Frozen** (G-07)  

---



### Profile Card / Profile Banner

**Intent:** Show active Experience Profile without platform jargon.  
**When used:** Guest header; Setup profile proof.  
**Anatomy:** Profile name · short desc.  
**States:** default · missing profile.  
**Props:** `label`, `description`.  
**Accessibility:** Text alternative for any avatar.  
**Design tokens:** pill / soft emerald.  
**Runtime owner:** Profile Engine  
**Pack content:** profile display name

---



### Fulfilment Ticket / Ticket Card

**Intent:** Operator unit of work on a station board.  
**When used:** Kitchen / Bar / Housekeeping.  
**Anatomy:** Id · Status Chip · Operator actions.  
**Variants:** Row · Column card.  
**States:** pending · preparing · ready · delivered · error.  
**Props:** `ticketId`, `status`, `actions`.  
**Accessibility:** Group labelled by ticket id; buttons named.  
**Design tokens:** operator touch min, status chips.  
**Runtime owner:** Capability (fulfilment) · Experience (surface)  
**Pack content:** station labels

---



### Station Card

**Intent:** Represent a fulfilment station in manager/floor views (intentional gap UI).  
**When used:** Floor map; station picker.  
**Anatomy:** Name · load chip · enter action.  
**States:** idle · busy · offline.  
**Props:** `stationId`, `label`, `load`.  
**Design tokens:** entity card tokens.  
**Runtime owner:** Experience · Context  
**Pack content:** station names

---



### Form Section

**Intent:** Group fields with help under Grammar.  
**When used:** Merchant details; settlement; join identity.  
**Anatomy:** Legend · fields · inline help.  
**States:** default · invalid · disabled.  
**Props:** `title`, `help`.  
**Accessibility:** `fieldset`/`legend` or labelled region.  
**Design tokens:** input radius, muted help.  
**Runtime owner:** LEOS shell  
**Pack content:** field labels

---



### Stepper

**Intent:** Discrete step progress for wizards (alternate to percent Progress).  
**When used:** Setup Studio.  
**Anatomy:** Steps · current highlight.  
**States:** upcoming · current · done.  
**Props:** `steps`, `currentIndex`.  
**Accessibility:** Progress semantics or tablist.  
**Design tokens:** emerald current.  
**Runtime owner:** LEOS shell  
**Pack content:** none

---



### Confirmation Panel

**Intent:** Explicit Success State after a business Action.  
**When used:** Merchant verified; Payment success; Session closed.  
**Anatomy:** Success mark · title · facts · continue Navigation.  
**States:** success only (errors use Error Surface).  
**Props:** `title`, `facts[]`.  
**Accessibility:** `role="status"`.  
**Design tokens:** `--leos-success`*.  
**Runtime owner:** LEOS shell  
**Pack content:** copy

---



### Action Sheet

**Intent:** Secondary operator actions without leaving the board.  
**When used:** Station ticket overflow; future mobile sheets.  
**Anatomy:** Scrim · sheet · action list.  
**States:** closed · open.  
**Props:** `actions[]`.  
**Accessibility:** Dialog; focus trap; Escape closes (Navigation).  
**Design tokens:** elevated surface, button radius.  
**Runtime owner:** LEOS shell  
**Pack content:** action labels

---



### Permission Gate

**Intent:** Block UI when Entry Conditions fail on permission.  
**When used:** Staff surfaces; Setup; settle without capability.  
**Anatomy:** Message · optional upgrade Navigation.  
**States:** denied (maps screen Permission denied).  
**Props:** `message`, `requiredPermission`.  
**Accessibility:** `role="alert"`.  
**Design tokens:** warning/danger.  
**Runtime owner:** Experience (authZ)  
**Pack content:** none

---



### Offline Banner

**Intent:** Preserve Intent visibility when Offline.  
**When used:** Any screen Offline state.  
**Anatomy:** Banner · queued hint.  
**States:** offline.  
**Props:** `queuedCount`.  
**Accessibility:** `role="status"` polite.  
**Design tokens:** warning.  
**Runtime owner:** Experience (client queue)  
**Pack content:** none

---



### Error Surface

**Intent:** Recoverable failure with Retry Action.  
**When used:** Catalogue error; payment fail; connector timeout.  
**Anatomy:** Message · Retry Action · optional escape Navigation.  
**States:** error.  
**Props:** `message`, `retryable`.  
**Accessibility:** `role="alert"`.  
**Design tokens:** `--leos-danger`*.  
**Runtime owner:** owning runtime of failed command  
**Pack content:** none

---



### Empty State

**Intent:** Honest Empty when there is nothing to show.  
**When used:** No menu; no tickets; no assistance.  
**Anatomy:** Message · optional Navigation.  
**States:** empty.  
**Props:** `message`.  
**Accessibility:** status text.  
**Design tokens:** muted.  
**Runtime owner:** LEOS shell  
**Pack content:** empty copy

---



### Capability Card

**Intent:** Describe a capability module (Payments, Messaging) for Setup Hub.  
**When used:** Setup Studio hub.  
**Anatomy:** Name · status · open action.  
**Variants:** Available · Coming soon.  
**States:** default · disabled.  
**Props:** `name`, `available`.  
**Design tokens:** Selection/Entity card tokens.  
**Runtime owner:** Capability  
**Pack content:** none

---



### Allocation Panel

**Intent:** Show how payment amount is split (future split bill).  
**When used:** Payment screen composition (LEK-029).  
**Anatomy:** Lines · totals.  
**States:** gap (spec only).  
**Runtime owner:** Capability  
**Status:** intentional stub for composition

---



## Index (quick)


| Component                                      | Runtime owner               |
| ---------------------------------------------- | --------------------------- |
| App Shell                                      | LEOS shell                  |
| Session Header                                 | Experience / Profile Engine |
| Context Banner                                 | Entry / Context             |
| Bottom Action Bar                              | LEOS shell                  |
| Neo Dock                                       | LEOS shell                  |
| Progress Indicator / Stepper                   | LEOS shell                  |
| Selection Card / Entity Card / Capability Card | LEOS shell + data owner     |
| Status Chip / Badge                            | Experience / Capability     |
| Status Timeline                                | Experience / Capability     |
| Timeline (event feed)                          | Experience / Capability     |
| Search / Filter Bar                            | LEOS shell / Experience     |
| Cart Summary                                   | Experience                  |
| Payment Summary / Allocation Panel             | Capability                  |
| Profile Banner                                 | Profile Engine              |
| Fulfilment Ticket / Station Card               | Experience + Capability     |
| Form Section                                   | LEOS shell                  |
| Confirmation Panel                             | LEOS shell                  |
| Action Sheet                                   | LEOS shell                  |
| Permission Gate                                | Experience                  |
| Offline Banner / Error Surface / Empty State   | LEOS shell + owning runtime |


---



## Heartbeat-required subset (extracted from Guest design)

Extract components **as screens are designed** — do not invent a full library up front.  
**Source of truth for first bulk extract:** [G-03 Menu](ux/wireframes/guest/menu.md) ✅


| Component            | First proven on         | Notes                                 |
| -------------------- | ----------------------- | ------------------------------------- |
| Session Header       | Menu (+ Entry)          | Context first                         |
| Context Banner       | Menu Closed / Offline   |                                       |
| Search Surface       | Menu S4                 |                                       |
| Filter Bar           | Menu S3/S5              | Categories                            |
| **Menu Card**        | Menu S3                 | Entity Card specialised for catalogue |
| **Quantity Stepper** | Item S2                 | Draft line qty                        |
| Action Sheet         | Item S2 (dense)         | Modifiers overflow                    |
| Cart Summary         | Menu → Cart             | Badge + total                         |
| Bottom Action Bar    | Menu / Item             | Primary Action Bar                    |
| Empty State          | Menu S2                 |                                       |
| Offline Banner       | Menu / Item             |                                       |
| Loading Surface      | Menu S1                 |                                       |
| Status Chip          | Menu / Item unavailable |                                       |
| Error Surface        | Menu / Item             |                                       |
| Form Section         | Item S2                 | Modifier groups                       |
| Neo Dock             | All Guest               |                                       |


After G-05 Cart expect: line list patterns.  
After G-07 Payment expect: Payment Summary · Confirmation Panel.

Screens **reference** these names — they do not redraw them.

---

*End of LEK-028 v0.1 — grows with Guest Experience Inventory.*