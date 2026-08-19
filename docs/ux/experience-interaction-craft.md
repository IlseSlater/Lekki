# SECTION 3 — Experience Interaction Craft

**Status:** Authoritative for guest interaction patterns  
**Complements:** [Studio Blueprint](LEOS-Studio-Design-Blueprint.md) · [**Blueprint SECTION 3A — Studio→Live→Guest Contract**](LEOS-Studio-Design-Blueprint.md#section-3a--studio--live-experience--guest-interaction-contract) · [Current Product State](current-product-state.md) · [Restaurant Pack UX](restaurant-pack-ux-constitution.md)  
**Not to confuse with:** Blueprint SECTION 3 (Welcome & Choose) · Blueprint SECTION 3A (no-drift contract) · Current Product State SECTION 3 (HCI lock)

## Spec stack

| Layer | Governs |
|-------|---------|
| LEK-040 | How LEOS should **feel** |
| LVES | How LEOS should **look** |
| Studio Blueprint | How the business owner **moves through Studio** |
| Blueprint SECTION 3A | Studio → Live → Guest **must not drift** |
| **This document** | How the guest **actually interacts** |
| LEK-028 | Reusable parts |
| LEK-029 | Composition / capability truth |

**Key bridge:** Studio configures → Live Experience demonstrates → Guest Experience executes.

This section defines how LEOS turns configuration and capability into human interactions.

The Studio blueprint governs the business owner's journey.

The Experience interaction patterns govern what guests actually do.

The two surfaces must feel related in confidence, while remaining visually distinct.

---

# G-04 — Menu Item Customisation

**Status: Shipped**  
**Human question:** What do I want with this?  
**Craft detail:** [g04-choices-sheet.md](g04-choices-sheet.md)  
**Evidence:** [evidence/g04-choices-sheet.md](evidence/g04-choices-sheet.md)  
**Constitution:** Restaurant Pack UX

---

## Purpose

G-04 allows a guest to customise a menu item without understanding:

- modifiers
- choice groups
- catalogue structures
- schemas
- capabilities
- runtime configuration
- pricing rules

The guest should experience the interaction simply as:

> “I know what I am ordering.”

The underlying system may be complex. The guest interaction must not be.

---

## Guest Journey

```text
Restaurant QR
  → Experience
  → Browse
  → Menu item
  → Customisation
  → Add
  → Cart
  → Checkout
```

The guest remains inside the Experience Shell throughout. Studio must never appear.

---

## Entry Point

```text
Classic Burger
R120
[ + ]
```

The guest selects the item. A customisation sheet opens.

The sheet should feel like a natural continuation of the menu — not a configuration screen.

---

## Item Sheet

1. Item name  
2. Base price  
3. Required choices  
4. Optional choices  
5. Live total  
6. Primary Add action  

Ordering matters.

---

## Item Header

```text
Classic Burger
R120
```

Immediately: What is this? What does it cost?

Never display: Catalogue ID · SKU · Modifier ID · Choice group ID · Runtime capability · Configuration status.

---

## Choice Ordering

Required choices first. Optional afterward.

```text
Choose your side
Required · Choose 1
  Fries · Salad · Chips

Choose your drink
Required · Choose 1
  Coke +R20 · Water · Juice +R10

Extras
Optional
  Cheese +R15 · Bacon +R25
```

---

## Required Groups

Required groups must be visually obvious **before** selection.

Use: **Required · Choose 1**

Do not rely on: colour alone · disabled Add alone · error after submission · hidden validation · explanatory text only at the bottom.

---

## Required Interaction

Incomplete primary action: **Choose required options**

Never: Validation failed · Incomplete configuration · Please correct errors · Invalid selection.

Those phrases describe software state. They do not help a human.

---

## Required Selection

Selection becomes visibly active. The guest knows: “I have made this decision.” Total updates if price changes.

---

## Optional Groups

Optional choices never block Add. Select one, several, or none — and continue.

---

## Pricing & Price Confidence

Pricing visible at the moment of decision. Total updates immediately.

```text
Classic Burger    R120
Coke              +R20
Cheese            +R15
Total             R155
```

No save. No apply. No recalculation button.

Changing Coke → Water or removing Cheese updates the total immediately.

---

## Primary Action · One Primary Action

| State | Control |
|-------|---------|
| Incomplete | Choose required options |
| Complete | Add · R155 |

One dominant action. Do not place Add · Save · Apply · Continue · Checkout beside one another.

---

## Add Behaviour

1. Validate required choices  
2. Add configured item  
3. Preserve every selected choice  
4. Close sheet  
5. Short confirmation  
6. Return to Browse  

Preferred confirmation: **Added** (optional visual: ✓ Added). Brief. Does not interrupt browsing.

---

## Cart Restatement

The cart is a **memory of the guest’s decisions** — not merely catalogue products.

```text
Classic Burger
Side: Fries
Drink: Coke
Extras: Cheese
R155
```

Answers: “What did I actually order?” without reopening the item.

Implements: **Never Ask a Human to Remember.**

Never: configuration ID · modifierGroup · “+ modifiers”.

If quantity increases, the configured item repeats. Differing configurations must be distinct lines.

---

## Choice Language

Human nouns: Side · Drink · Extras · Sauce · Size · Toppings.

Never: Choice Group · Modifier Group · Configuration · Capability · Schema · Runtime.

---

## G-04 HCI Questions

| Moment | Question |
|--------|----------|
| Before Add | Do I know what I still need to choose? |
| During selection | Do I understand what each choice changes? |
| During pricing | Do I know what this will cost? |
| After Add | Do I know that it worked? |
| In Cart | Do I know exactly what I ordered? |
| Before Checkout | Do I know what I will pay? |

If any answer is no, the interaction is not finished.

---

## G-04 Design Principles

| Principle | How |
|-----------|-----|
| Minimum Decisions | Required first · optional never blocks |
| Human Confidence | Live price · explicit required · explicit Add |
| Never Ask a Human to Remember | Cart preserves decisions |
| Progressive Disclosure | Sheet only when the item needs choices |
| One Primary Action | Add |
| Hospitality Before Software | “What would you like with that?” — not “Configure your item.” |

---

## Blueprint Pattern

```text
Choice Groups
  → Required Choices
  → Optional Choices
  → Live Total
  → Add
  → Confirmation
  → Cart Restatement
```

Reuse for future Pack customisation unless human confidence demands another pattern.

---

## Future Pack Reuse

Nouns change. Confidence model does not.

| Pack | Example nouns |
|------|----------------|
| Restaurant | Side · Drink · Extras |
| Café | Milk · Size · Shots · Syrup |
| Hotel | Room option · Extras · Services |
| Festival | Drink · Mixer · Add-ons |

The system may remain schema-driven. The guest must never see the schema.

---

## Design Review (before shipping)

1. Does the guest know what they are choosing?  
2. Does the guest know what is required?  
3. Does the guest know what is optional?  
4. Does the price update immediately?  
5. Does Add communicate readiness?  
6. Does the guest receive confirmation?  
7. Does the cart remember their choices?  
8. Can the guest understand the order without reopening the item?  
9. Is the language human?  
10. Is there only one primary action?  

If any answer is no: not finished.

---

## Blueprint Rule

> The interface may understand modifiers.  
> The human should only understand choices.

---

## Relationship to Studio

Governed by [Blueprint SECTION 3A](LEOS-Studio-Design-Blueprint.md#section-3a--studio--live-experience--guest-interaction-contract).

When a business configures required choices · optional choices · price changes · menu structure, those decisions must appear in **Live Experience** as the guest will encounter them.

```text
Studio configures → Live Experience demonstrates → Guest Experience executes
```

The three should never drift. If they disagree, the feature is not complete.

### Studio Confidence Test

After configuring a menu item, the owner should answer visually:

- What will my guest see?  
- What choices will they make?  
- What will they pay?  
- What happens when they add it?  
- What will appear in their cart?  

---

## G-04 Completion Standard

Complete when:

- Required choices visible first  
- Optional never blocks Add  
- Price deltas visible · total updates immediately  
- Add communicates readiness and price  
- Added confirmation immediate  
- Cart preserves multi-line decisions  
- No technical vocabulary reaches the guest  
- Interaction stays in Experience Shell · Studio invisible  
- Interaction feels effortless  

---

## Canonical Interaction

```text
Classic Burger
R120

Choose your side
Required · Choose 1
  ○ Fries · ○ Salad · ○ Chips

Choose your drink
Required · Choose 1
  ○ Coke +R20 · ○ Water · ○ Juice +R10

Extras
Optional
  □ Cheese +R15 · □ Bacon +R25

Total R155
[ Add · R155 ]

→ Added

→ Cart
Classic Burger
Side: Fries
Drink: Coke
Extras: Cheese
R155
```

---

## Final HCI Statement

G-04 succeeds when the guest never has to wonder:

“Did I choose everything?” · “What did I choose?” · “How much is it?” · “Did it work?”

The interface should answer all four before the guest asks.
