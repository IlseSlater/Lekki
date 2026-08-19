# G-04 — Menu Item Customisation

**Status: Shipped**  
**Human question:** What do I want with this?  
**Canonical craft:** [Experience Interaction Craft § G-04](experience-interaction-craft.md)  
**Evidence:** [evidence/g04-choices-sheet.md](evidence/g04-choices-sheet.md)  
**Constitution:** [Restaurant Pack UX](restaurant-pack-ux-constitution.md) §2–3 · [current-product-state §3.40](current-product-state.md)

This file is the short operational pointer. Full interaction craft, HCI tests, Studio→Live rules, and completion standard live in the Experience Interaction Craft section.

---

## Guest goal

Customise without understanding modifiers, schemas, or pricing rules.

> “I know what I am ordering.”

---

## Pattern

```text
Choice Groups → Required → Optional → Live Total → Add → Confirmation → Cart Restatement
```

---

## Canonical flow

```text
Classic Burger · R120 · [+]
  → Required · Choose 1 (side · drink)
  → Optional extras
  → Add · R155  (or Choose required options)
  → Added
  → Cart: Side / Drink / Extras restated
```

---

## Blueprint rule

> The interface may understand modifiers.  
> The human should only understand choices.
