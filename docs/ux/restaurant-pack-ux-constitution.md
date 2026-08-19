# Restaurant Pack UX Constitution

**Status: Frozen**  
**Owns:** Restaurant Pack guest interaction model (browse → configure → cart → pay)  
**Governed by:** [LEK-029](../LEK-029-experience-composition.md) · [LEK-040](../LEK-040-human-experience-engineering.md) · [Experience Design Principles](LEOS-experience-design-principles.md)  
**Inherits to:** Restaurant · Café · Hotel room service · any catalogue+options Pack where applicable  
**Not this document:** Visual polish (LVES) · Component anatomy (LEK-028) · Domain schema internals  

**Change policy:** Principles frozen. Screen specs may refine details. Structural redesign requires ADR.

This is a **product interaction standard**, not “restaurant UI inspiration.” Proven delivery-app patterns inform cognitive load; Lekki’s visual language, copy, and hosted tone remain unique.

---

## LEK-040 alignment

| Principle | How this constitution obeys it |
|-----------|--------------------------------|
| **Human Confidence** | Every moment answers: Where am I? What am I ordering? What happens next? |
| **Never Ask a Human to Remember** | Required choices on one sheet; cart restates the order; no wizard memory |
| **Minimum Decisions** | Required first; optional later; search only when menus are large |
| **One Primary Action** | Browse → + add (or open sheet if choices) · Cart → Continue |
| **Preserve Flow** | Add stays on browse; upsell never blocks ordering |

---

## Seven frozen patterns

### 1. Browse should never feel like shopping

**Goal:** *I'm sitting at a table. I want to order quickly without thinking.*

Not e-commerce. Not marketplace density.

| Use | Do not |
|-----|--------|
| Large venue header | Dense product grids that feel like retail |
| Sticky category chips | Category trees / multi-level nav |
| Clean list cards — **food icon left**, copy, **+** right | Card walls competing for attention |
| Floating cart summary | Hidden cart until checkout |
| Search **only** when menus become large | Search as the default primary path |
| **+ on the row** to add / count | Navigate away to a separate “add item” page for simple items |

**Reference feel:** Honest Greens calm browse — adopt behaviour, not branding.

**Screens:** G-03 Menu

---

### 2. Modifiers live on one sheet

**No multi-step builders. No wizards. No navigation between option steps.**

Everything for one line happens on a single sheet:

```text
Chicken Burger
──────────────

Choose your side *
○ Fries
○ Salad
○ Rice

Choose your drink *
○ Coke
○ Sprite
○ Water

Extras
☐ Cheese
☐ Bacon
☐ Avocado

Special requests
______________

──────────────
Total R145
[−] 1 [+]
Add to order
```

| Rule | |
|------|--|
| One sheet | Required choices · Extras · Special requests · Qty · Live total · Add |
| No wizard | Reject Subway-style multi-screen builders for Restaurant Pack |
| Add gated | Disabled until every required group is complete |
| Live total | Base + deltas update as guest chooses |

**Screens:** G-04 Item (sheet over Browse — not a separate destination page)  
**Craft (shipped):** [g04-choices-sheet.md](g04-choices-sheet.md)

**Internal vs guest:** Domain may call these *modifier groups*. Guests never see that term (see Human Confidence copy).

---

### 3. Required first. Upsell later.

| When | What | Rule |
|------|------|------|
| **On item** | Required choices (Choose one side · Choose one drink) | Guest **cannot** Add until complete |
| **Later** | Often ordered with / People also add | Never interrupts browse or required configure |

Do not put optional pairing carousels in the path of Required. Do not force “would you like fries with that?” before Add.

---

### 4. Combos are products

Not special code. Not a parallel UI.

```text
Double Burger Meal   ← catalogue product
  contains
    Required · Choose burger
    Required · Choose side
    Required · Choose drink
```

LEOS already understands products and capabilities. A combo is **another product definition with modifier groups**. Pack content supplies slots and rules; Experience Runtime does not invent a Combo engine.

**Reuse:** Hotel meal packages · Festival bundles · Spa packages — same product+groups model.

---

### 5. Cart is the second sales opportunity

Not: Cart → Checkout only.

```text
Your order
────────────
Burger
Fries
Drink
────────────
People also add
  Garlic Bread
  Cheesecake
  Milkshake
────────────
Continue
```

| Rule | |
|------|--|
| Header | **Your order** (Pack may vary term; never cold “Cart” as the only voice) |
| Lines | Restate what was chosen — Human Confidence |
| Line control | **DoorDash qty pill** (Frozen) — see below |
| Upsell | **People also add** / Often ordered with — after lines, before Continue |
| Primary | Continue / Place order — one primary action |
| Effect | Raises AOV without slowing Browse |

#### Your order — line anatomy (Frozen · DoorDash)

Adopt the **interaction anatomy**, not DoorDash branding. Lekki cream/gold stay.

```text
[thumb]  Item name                 [ trash  1  + ]
         Choice summary (optional)
         $price
```

| Control | Behaviour |
|---------|-----------|
| **+** | Increment line quantity |
| **Count** | Live quantity |
| **Trash** (when qty = 1) | Remove the line |
| **−** (when qty > 1) | Decrement |

No separate “Remove” button. Price sits under the name (unit price). Pill sits on the right. Thin separators between lines.

**Screens:** G-05 Cart

---

### 6. Add and count on the menu

Guests must not leave Browse to add a simple item.

| Item type | Behaviour |
|-----------|-----------|
| **Simple** (no required choices) | `+` on the row adds 1 · stay on menu · pill becomes trash \| count \| + |
| **Needs choices** | `+` / row opens **one sheet over the menu** (Pattern 2) — never a separate destination page |

| Rule | |
|------|--|
| Stay on Browse | No click-through “add item” page for simple products |
| Live qty on row | Same DoorDash pill as Your order |
| Floating summary | **Your order** strip updates as they add |
| Confirm counts | Your order (G-05) can still adjust |

**Reference feel:** Bolt / Zomato / Uber Eats one-tap browse — adopt behaviour, not branding.

**Screens:** G-03 Menu · G-04 as sheet

---

### 7. Guest tab bar chrome

Bottom navigation for a seated guest session (behaviour reference: dark-culinary — **labels/IA only**, Lekki theme).

| Tab / action | Maps to |
|--------------|---------|
| **Menu** | Browse (G-03) |
| **Orders** | Live order (G-06) |
| **Bill** | Payment (G-07) |
| **Help** | Assistance request (not a route) |
| **Leave** | Leave confirm (G-09) → end session |

| Rule | |
|------|--|
| Cart is not a tab | Floating **Your order** chip above the bar → G-05 |
| Theme | Lekki cream / gold — never dark glass / neon |
| Pack labels | Menu · Orders · Bill · Help · Leave (Pack may localize) |

**Screens:** Guest shell chrome across G-03…G-09

---

## Human Confidence (Lekki signature)

Every interaction answers three questions:

1. **Where am I?** — venue · context · session  
2. **What am I ordering?** — item · choices · live total  
3. **What happens next?** — Add · continue browsing · Your order · pay  

### Guest copy (frozen vocabulary)

| Avoid (system / industry) | Prefer (guest) |
|---------------------------|----------------|
| Customize | **Make it yours** (screen purpose) or the specific ask |
| Modifiers / Modifier groups | **Choose one** · **Choose up to two** · **Extras** · **Special requests** |
| Required | **Choose one** (or Choose *n*) — the asterisk / gate is enough |
| Cart (as sole label) | **Your order** |
| Add to cart | **Add to order** |
| Configure | Open the sheet with the item name; lead with the first choice |

Tiny wording changes make the product feel calmer and hosted — unmistakably Lekki.

---

## Canonical interaction model (eight human moments)

```text
Browse (+ add / count on row)
  ↓
[If required] Choose on one sheet over menu
  ↓
Optional extras (same sheet)
  ↓
Add → stay browsing
  ↓
Added ✓
  ↓
Continue browsing
  ↓
Your order (cart)
  ↓
People also add
  ↓
Pay
```

Stay on the menu for simple items. Sheet only when choices are required. Lekki freezes **this** variation — warm, calm, hosted — under LEK-040.

---

## Implementation tone

| Layer | Follow |
|-------|--------|
| Interaction model | This constitution (proven cognitive pattern) |
| Feel | LEK-040 — confidence, minimum decisions, preserve flow |
| Look | LVES — cream, gold accent, Sora + Fraunces |
| Parts | LEK-028 |
| Screens | Guest wireframes G-03 · G-04 · G-05 |

The implementation must **not** feel like a DoorDash or Uber Eats clone. Pattern yes. Personality no.

---

## Related

| Doc | Role |
|-----|------|
| [LEK-029 §3](../LEK-029-experience-composition.md) | Composition owner — this constitution is the frozen Restaurant interaction standard |
| [G-03 Menu](wireframes/guest/menu.md) | Browse |
| [G-04 Item](wireframes/guest/item.md) | One-sheet choices |
| [G-05 Cart](wireframes/guest/cart.md) | Your order + second sales |
| [LEK-038](../LEK-038-behaviour-inventory.md) | Behaviour / deferred commitment |

*End of Restaurant Pack UX Constitution. Do not expand with visual recipes — those belong in LVES / evidence.*
