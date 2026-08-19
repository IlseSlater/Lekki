# Guest Journey — State Wireframe Specification

**Milestone:** Complete Guest journey as **state-based** wireframes (low-fidelity)  
**Fidelity:** Stage 1–3 (boxes, hierarchy, interaction) — **no** colours, typography polish, icons, shadows  
**Not:** Figma · LEDS Stage 4 · Waiter / Kitchen / Manager  
**Foundation:** [Principles](../LEOS-experience-design-principles.md) · [Restaurant Pack UX Constitution](../restaurant-pack-ux-constitution.md) (**Frozen**) · [Layout Grammar](../layout-grammar.md) · [LEK-028](../../LEK-028-component-catalogue.md)

LEOS is not a collection of pages. It is a collection of **states**. The screen barely changes; the state does.

---

## Numbering

```text
Guest Journey
  Entry
    S1 Available
    S2 Loading
    S3 Offline
    S4 Permission / Denied
    S5 Expired
  Join
    S1 Empty
    S2 Typing
    S3 Returning
    S4 Invalid
    S5 Joined
  Menu
    S1 Loading
    S2 Empty
    S3 Items
    S4 Search / Filter
    S5 Closed
    S6 Offline
  Item
    S1 Browse detail
    S2 Choosing (one sheet)
    S3 Adding
    S4 Error
  Cart                          ← Your order · People also add · Continue
    S1 Empty
    S2 Has Items
    S3 Submitting
    S4 Failed
    S5 Success
  Live Order
    S1 Waiting
    S2 Progressing
    S3 Ready cues
    S4 Offline
  Payment
    S1 Ready (manual)
    S2 Pending
    S3 Failed
    S4 Success
    S5 Cancelled
  Receipt
    S1 Paid
    S2 Waiting confirmation
    S3 Closed path
  Leave
    S1 Confirm leave
    S2 Context released
```

Wireframe id format: `Guest.{Experience}.{State}` e.g. `Guest.Menu.S3`

---

## Every wireframe answers

| Question | Meaning |
|----------|---------|
| **Intent** | Why does this state exist? |
| **User goal** | What is the user trying to accomplish? |
| **System goal** | What is LEOS trying to accomplish? |
| **Information shown** | Everything visible |
| **Actions** | Buttons, gestures, keyboard, scanner |
| **Navigation** | Where can I go? |
| **Events** | What gets emitted? |
| **Components** | Which LEK-028 components build this? |
| **Runtime ownership** | Entry / Context / Experience / Capability / Profile Engine |
| **Pack ownership** | Restaurant / none / … |
| **Error / next failure** | What if this fails? |

That is half the implementation already.

---

## Files

| Experience | Spec | Status |
|------------|------|--------|
| Entry | [entry.md](entry.md) | ⏳ |
| Join | [join.md](join.md) | ⏳ |
| Menu | [menu.md](menu.md) | **✅** |
| Item | [item.md](item.md) | **✅ G-04 complete** |
| Cart | [cart.md](cart.md) | **✅ G-05 IR** |
| Payment | [payment.md](payment.md) | **✅ G-07 IR** |
| Live Order | [live-order.md](live-order.md) | **Frozen** |
| Receipt | [receipt.md](receipt.md) | ⏳ |
| Leave | [leave.md](leave.md) | ⏳ |

**Tracker:** [Guest Experience Inventory](../guest-experience-inventory.md)

Legacy G-01 file: [G-01-entry.md](G-01-entry.md) — superseded by [entry.md](entry.md).

When every row in the Guest Experience Inventory is ✅, Phase 1 is done — then Phase 4 coding. Waiter/Kitchen only after that.
