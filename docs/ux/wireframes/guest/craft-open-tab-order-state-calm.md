# Continuity — Open-tab Order-state calm

**Status:** Shipped — evidence [continuity-open-tab-order-state-calm.md](../../evidence/continuity-open-tab-order-state-calm.md)  
**Platform Value:** While the visit is open, cart and live orders feel like a living tab — not a status dashboard.  
**Human question:** What’s happening with my order? (Orders) · What am I about to place? (Cart)  
**Pillar:** Calm · Confidence · Continuity  
**Surfaces:** Guest Orders · Your order chip · Live phone Orders tab  
**Not:** Pay confidence rewrite · Place Identity (shipped) · Setup · GAP-02/07 · Marketplace · Neo · Kitchen board on Guest · new LEKs

---

## Intent

Place Identity answered **whose table**.  
This unlock answers **where the tab is** — draft vs living — without POS legend density.

## Uncertainty removed

- Active/History gold pills (gold stolen from Pay / Place)  
- Four-dot status legend (admin training)  
- Status chip on every line (dashboard)  
- Order ID as the hero (“Order · a1b2”)  
- Live Orders tab sounding colder than Guest  

## Goals

| | |
|--|--|
| **User** | See active orders as a calm living list; know draft is “Your order”. |
| **System** | Same fulfilment statuses — spoken, not stamped. |
| **Emotional** | Concierge update, not ticket board. |

## Composition

### Cart (draft)

```text
Floating chip: N items · total · Your {order}
Primary on Cart phase: Place {order} (gold)
Secondary: Add more (quiet)
```

No second gold. Chip is the living draft signal on Menu.

### Orders (live)

```text
┌ Purpose + one prose lead (progressGuidance / timeline)
│ Spoken status for this order (Preparing / Ready…)
│ Line labels × qty — no per-line chips
│ Quiet time · ready banner when Ready
│ History: quiet Now/Earlier when past orders exist — never gold fill
└ One phase gold: Pay only if balance due (unchanged)
```

Do not duplicate the prose lead under the list.

### Live phone

Same meaning: reassure + sample line + current status — no legend, no Active/History chrome.

## States

| State | Show |
|-------|------|
| Empty active | Calm empty → Menu |
| Sending / offline | Existing banner |
| Ready | Ready banner + spoken Ready |
| History | Past visit orders behind quiet toggle |
| Draft chip | Visible when cart count > 0 |

## What NOT to show

Status legend · gold Active tab · per-line status chips · kitchen tickets · Lekki · Pay copy rewrite · claim wizard

## Acceptance

1. Guest Orders Active control is **not** gold fill  
2. No status legend on Guest Orders  
3. One spoken status per order; lines are labels × qty only  
4. Cart chip still opens Your order; Place remains sole gold on Cart  
5. Live Orders tab has no legend / Active-History chrome  
6. Unit proof for calm helpers  

## Code seam

- `apps/web/src/app/studio/order-state-calm.ts`  
- `apps/web/src/app/leos/guest-orders.component.ts`  
- `apps/web/src/app/leos/cart-summary.component.ts` (chip copy only if needed)  
- `apps/web/src/app/leos/guest-shell-projection.component.ts` Orders tab  

## HOLD

Pay confidence sentence · GAP-02/07 · Setup · Marketplace · Neo · claim/split
