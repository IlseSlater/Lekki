# G-04 — Guest Item (complete interaction specification)

**Status: Shipped** — craft: [g04-choices-sheet.md](../../g04-choices-sheet.md) · evidence: [g04-choices-sheet](../../evidence/g04-choices-sheet.md)

**Uncertainty removed:** What am I choosing?

**Screen family:** Guest Item (Configure before commit)
**Journey:** Experience Heartbeat — Configure Item  
**Layout grammar:** Guest  
**Constitution:** [Restaurant Pack UX Constitution](../../restaurant-pack-ux-constitution.md) §2–4 — **One sheet · Required first · Combos are products**  
**Behaviour:** Proven ✓ Restaurant — *lines can be configured before becoming transactions* (Deferred Commitment, [LEK-038](../../LEK-038-behaviour-inventory.md))  
**Reference Experience:** One-sheet choice pattern (Uber Eats / Zomato behaviour) — **reject** multi-step Subway-style builders  
**Runtime owner:** Experience Runtime  
**Pack owner:** Restaurant Experience Pack (choice groups, images, rules; combos = products with groups)  
**Capability:** none until cart commits to Transaction  
**Inventory:** [Guest Experience Inventory](../guest-experience-inventory.md) — **✅**  
**Reuse:** ★★★★★ Core transaction interaction  
**Design order:** 2nd (after G-03 Menu)

### Platform Value

Defines how LEOS turns a catalogue entity into a **draft line** before `CreateTransaction`. Configuration, quantity, and live price are platform patterns; choice groups (“Choose one side”) are Pack content. Combos are ordinary products with required groups — not special runtime code.

**Future reuse:** Hotel room-service options · Festival merch variants · Golf lesson add-ons · Spa treatment upgrades · Museum ticket add-ons

Strengthens **LEOS** deferred-commitment model, not only restaurant choices.

### One-sheet constitution (Frozen)

- All choices on **one sheet** — no wizard, no step navigation  
- **Required first** — Add disabled until complete  
- **Extras** and **Special requests** after required  
- Guest copy: *Choose one · Choose up to two · Extras · Special requests · Add to order*  
- Internal term *modifier groups* never shown to guests  
- Upsell (**People also add**) belongs on Cart — not on this sheet

---

## Shared (all Item states)

### Intent (family)

Let the guest configure a catalogue item and add a draft line to the cart — without creating a Transaction yet.

### User goal (family)

Understand the item; set options and quantity; add with confidence.

### System goal (family)

Capture a valid draft line; update price live; never commit until Cart submit.

### Layout (Guest grammar)

```text
┌───────────────────────────┐
│ Header                    │  item purpose / name
├───────────────────────────┤
│ Context Banner            │  error / offline
├───────────────────────────┤
│ Main Content              │  media · modifiers · qty · price
├───────────────────────────┤
│ Primary Action            │  Add to cart / Back
└───────────────────────────┘
         [Neo Dock]
```

### Components (LEK-028)

| Component | Role |
|-----------|------|
| Session Header | Purpose = item name or “Configure item” |
| Context Banner | Offline / error |
| Menu Card / media slot | Image + base facts |
| Form Section | Choice groups (guest: Choose one / Extras) |
| **Quantity Stepper** | Qty ± |
| **Action Sheet** | Overflow / dense modifier sheet (optional) |
| Bottom Action Bar | Add to cart · Back |
| Confirmation flash | Added |
| Error Surface | Add failed |
| Offline Banner | Offline configure |
| Neo Dock | Passive |

### Accessibility (family)

- `h1` = item name  
- Modifier groups as fieldsets with legends  
- Required groups announced  
- Live price region `aria-live="polite"`  
- Quantity Stepper has accessible name “Quantity” and value  
- Add to cart includes price in accessible name when helpful  
- Focus to Add after successful configure path  

### Navigation (family)

| From | To |
|------|-----|
| Back | G-03 Menu |
| Add success | G-03 Menu (cart updated) or G-05 Cart (optional) |
| Unavailable item | G-03 Menu |

### Runtime / Pack

| | |
|--|--|
| Runtime | Experience (draft cart) |
| Pack | Modifier schema, images, exclusion rules, base price |
| Not | Capability / Entry |

---

## Guest.Item.S1 — Browse detail

| | |
|--|--|
| **Intent** | Show item truth before configuration. |
| **User goal** | Decide if this is the right item. |
| **System goal** | Present Pack content; no draft yet. |
| **Information shown** | Name · image · description · base price · availability. |
| **Fields** | none |
| **Validation** | Item must exist and be available |
| **Actions** | Continue to configure · Back · Add (if no modifiers required) |
| **Navigation** | → S2 if modifiers required · Add → S3 · Back → Menu |
| **Events** | optional ItemViewed |
| **Components** | Session Header · media · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | Price in text, not image-only |
| **Reference Experience** | Restaurant item open — same honesty |

```text
┌───────────────────────────┐
│ Header  {Item name}       │
├───────────────────────────┤
│ Main                      │
│  [ Image ]                │
│  Description              │
│  Base price               │
├───────────────────────────┤
│ Back | Configure / Add    │
└───────────────────────────┘
```

---

## Guest.Item.S2 — Choosing (one sheet)

| | |
|--|--|
| **Intent** | One sheet: required choices → extras → special requests → qty → live total. |
| **User goal** | Make it theirs without thinking about “configuration.” |
| **System goal** | Build valid draft line; recompute price. |
| **Information shown** | Choice groups · Quantity Stepper · live total. |
| **Fields** | `modifierSelections[]` · `quantity` (int ≥ 1) · `notes?` (optional) |
| **Validation** | Required groups complete · qty ≥ 1 · exclusions respected (Pack rules) |
| **Actions** | Toggle choice · Qty ± · Add to order (disabled until valid) · Back |
| **Navigation** | Add → S3 · Back → S1 or Menu |
| **Events** | none until add |
| **Components** | Form Section · Quantity Stepper · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant choice rules (incl. combo slots as groups) |
| **A11y** | Live price polite; invalid Add announced |
| **Reference Experience** | One-sheet required/optional groups — never multi-step builder |

```text
┌───────────────────────────┐
│ Header  {Item name}       │
├───────────────────────────┤
│ Main                      │
│  Choose your side *       │
│  Choose your drink *      │
│  Extras                   │
│  Special requests         │
│  Quantity [ − 1 + ]       │
│  Total (live)             │
├───────────────────────────┤
│ Back | Add to order       │
└───────────────────────────┘
```

---

## Guest.Item.S3 — Adding

| | |
|--|--|
| **Intent** | In-flight append to draft cart. |
| **User goal** | Know add succeeded. |
| **System goal** | Append line; bump Cart Summary badge. |
| **Information shown** | Brief success / spinner · primary disabled. |
| **Fields** | none |
| **Validation** | N/A |
| **Actions** | none (auto) |
| **Navigation** | → Menu S3 (default) |
| **Events** | none domain (draft only) |
| **Components** | Loading / Confirmation flash · Cart Summary (badge) |
| **Runtime** | Experience (client) |
| **Pack** | Restaurant |
| **A11y** | “Added to cart” status |
| **Reference Experience** | Restaurant add-to-cart feedback |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main  [ Adding… ]         │
├───────────────────────────┤
│ Add (disabled)            │
└───────────────────────────┘
```

---

## Guest.Item.S4 — Error

| | |
|--|--|
| **Intent** | Recoverable configure/add failure. |
| **User goal** | Fix or retry without losing selections. |
| **System goal** | Preserve field Intent. |
| **Information shown** | Error Surface · preserved modifiers/qty. |
| **Fields** | preserved |
| **Validation** | show field-level or banner |
| **Actions** | Retry · Back to Menu |
| **Navigation** | stay S2 · or Menu |
| **Events** | none |
| **Components** | Error Surface · Form Section · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | `role="alert"` |
| **Reference Experience** | Restaurant validation errors on required modifiers |

---

## Guest.Item.S5 — Unavailable

| | |
|--|--|
| **Intent** | Item no longer available (live update from Menu). |
| **User goal** | Choose something else. |
| **System goal** | Block add. |
| **Information shown** | Unavailable banner · Back to menu. |
| **Actions** | Back to Menu |
| **Navigation** | → G-03 |
| **Events** | none |
| **Components** | Context Banner · Status Chip · Bottom Action Bar |
| **Runtime** | Experience |
| **Pack** | Restaurant |
| **A11y** | alert |
| **Reference Experience** | Sold-out items |

---

## Guest.Item.S6 — Offline

| | |
|--|--|
| **Intent** | Configure from cache; queue add Intent. |
| **User goal** | Keep configuring. |
| **System goal** | Never lose draft Intent. |
| **Information shown** | Offline Banner · cached modifiers if known. |
| **Actions** | Add (queued) · Back |
| **Navigation** | Menu / Cart |
| **Events** | deferred |
| **Components** | Offline Banner · Form Section · Quantity Stepper |
| **Runtime** | Experience (queue) |
| **Pack** | Restaurant |
| **A11y** | status polite |
| **Reference Experience** | Offline configure/add queue |

---

## State transition map

```text
Menu.S6 Selected
       ↓
   Item.S1 Browse
       ↓
   Item.S2 Configuring ←→ S4 Error
       ↓
   Item.S3 Adding → Menu (cart+)
       
   S5 Unavailable → Menu
   S6 Offline overlays S1/S2
```

---

## LEK-028 extracts from this screen

| Component | New / reinforced |
|-----------|------------------|
| **Quantity Stepper** | New — extracted here |
| **Action Sheet** | Reinforced — dense modifiers |
| Form Section | Reinforced |
| Menu Card / media | Reinforced |

---

## Implementation notes (Phase 4 — not now)

- Draft cart is client/session state until G-05 submits `CreateTransaction`.  
- Modifier schema lives in Pack / catalogue — not Experience Runtime.  
- Live price = base + modifier deltas (Pack rules).

*End of G-04 complete interaction specification.*
