# G-05 — Guest Cart (complete interaction specification)

**Uncertainty removed:** What am I about to commit to?

**Screen family:** Guest Cart  
**Journey:** Experience Heartbeat — Review & commit  
**Layout grammar:** Guest  
**Constitution:** [Restaurant Pack UX Constitution](../../restaurant-pack-ux-constitution.md) §5 — **Cart is the second sales opportunity**  
**Behaviour:** Proven ✓ Restaurant — *deferred commitment becomes a Transaction*  
**Reference Experience:** Your order + People also add — adopt behaviour, not code  
**Status:** Spec **Frozen** — Construction Running (Cart L5)  
**Reuse:** ★★★★★ Core transaction interaction  
**Design order:** 3rd (after Menu, Item)

---

## Responsibilities (define before visuals)

Cart is where **multiple LEOS concepts meet**: draft lines, Experience Session, Transaction aggregate, and (on submit) Fulfilment capability.

| | |
|--|--|
| **Intent** | Restate **Your order**, offer optional **People also add**, then continue — without slowing Browse. |
| **User goal** | Understand what I’m about to commit; change or continue. |
| **System goal** | Build a canonical **Transaction** from draft lines. |
| **Platform Value** | Converts selections into `CreateTransaction` — same pattern for hotel services, festival vendors, golf bookings, retail. |
| **Runtime** | Experience Runtime |
| **Capability** | On submit: fulfilment create (via Capability); not payment yet |
| **Pack** | Restaurant (line labels, “Your order” terminology) |

### Cart constitution (Frozen)

```text
Your order
────────────
lines…
────────────
People also add
────────────
Continue
```

Required choices never live here — they were gated on the Item sheet. Upsell is the **second** sales moment only.

### Commands

| Command | When |
|---------|------|
| `AddLine` | From G-04 (draft) |
| `RemoveLine` | Cart |
| `UpdateQuantity` | Cart / Quantity Stepper |
| `ApplyAllocation` | Deferred (split) — Phase 2 |
| `SubmitTransaction` | Place order → `CreateTransaction` |

### Events

| Event | When |
|-------|------|
| `TransactionDraftUpdated` | Soft/local (or future domain) on line change |
| `TransactionCreated` | Submit success |
| `FulfilmentCreated` | Submit success (capability) |

Visual decisions below support these responsibilities only.

---

## Platform Value

Cart is the **commit boundary** of Experience Computing: browse/configure stay draft; Cart owns the jump to canonical Transaction.

**Future reuse:** Hotel service basket · Festival vendor cart · Golf booking review · Spa package review · Retail checkout bag

---

## Shared layout

```text
┌───────────────────────────┐
│ Header                    │  Your order
├───────────────────────────┤
│ Context Banner            │  offline / error
├───────────────────────────┤
│ Main Content              │  lines · People also add · total
├───────────────────────────┤
│ Primary Action            │  Continue · Keep browsing
└───────────────────────────┘
```

### Components (LEK-028)

| Component | Role |
|-----------|------|
| Session Header | Purpose |
| **Line Item Row** | One draft line (label, qty, price, remove) |
| Quantity Stepper | UpdateQuantity (**Frozen**) |
| **Order Total** | Sum display |
| Cart Summary | Affordance from Menu (same totals) |
| Bottom Action Bar | Place / Browse (**Frozen**) |
| Empty State | S1 |
| Action Sheet | Modifier reopen (optional) |
| Offline Banner · Error Surface · Loading · Confirmation | States |
| Neo Dock | Passive |

### Accessibility (family)

- `h1` = review purpose  
- Lines as list; each Remove named with item  
- Total in text  
- Place order disabled reason announced when empty/submitting  
- Success → polite status then navigate  

### Navigation

| | |
|--|--|
| Keep browsing | → G-03 Menu |
| Place success | → G-06 Live Order (after Confirmation) |
| Edit line modifiers | Action Sheet or → G-04 |
| Pay (if already payable from prior tx) | usually from Live, not Cart |

### Runtime / Pack

| Runtime | Experience |
| Pack | Restaurant terminology + line content |
| Capability | Fulfilment on `SubmitTransaction` only |

---

## Guest.Cart.S1 — Empty

| | |
|--|--|
| **Intent** | Honest empty draft. |
| **User goal** | Return to browse. |
| **System goal** | Block `SubmitTransaction`. |
| **Information shown** | Empty State. |
| **Fields** | none |
| **Validation** | Place disabled |
| **Actions** | Keep browsing (primary) |
| **Commands** | none |
| **Events** | none |
| **Navigation** | → Menu |
| **Components** | Empty State · Bottom Action Bar |
| **A11y** | status |
| **Reference Experience** | Empty cart |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main  [ Empty ]           │
├───────────────────────────┤
│ Keep browsing             │
└───────────────────────────┘
```

---

## Guest.Cart.S2 — Has Items

| | |
|--|--|
| **Intent** | Review draft lines before commit. |
| **User goal** | Confirm, edit, or place. |
| **System goal** | Ready `SubmitTransaction`. |
| **Information shown** | Line Item Rows · Order Total · Place · Browse. |
| **Fields** | per-line qty (via Stepper) |
| **Validation** | qty ≥ 1; empty after removes → S1 |
| **Actions** | Place order · RemoveLine · UpdateQuantity · Keep browsing · Edit modifiers |
| **Commands** | `RemoveLine` · `UpdateQuantity` · `SubmitTransaction` |
| **Events** | draft updated (local); Place → pending create |
| **Navigation** | Place → S3 · Browse → Menu |
| **Components** | Line Item Row · Quantity Stepper · Order Total · Bottom Action Bar |
| **A11y** | list + named removes |
| **Reference Experience** | Restaurant cart review |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Your order                │
│ [img] Name      [trash 1 +] │
│       choice · $price     │
│ [img] Name      [trash 1 +] │
│       $price              │
│ Total                     │
│ People also add …         │
├───────────────────────────┤
│ Keep browsing | Place     │
└───────────────────────────┘
```

**Qty pill (DoorDash · Frozen):** at qty 1 left = trash (remove line); at qty > 1 left = −; right = + always.

---

## Guest.Cart.S3 — Modifier Open

| | |
|--|--|
| **Intent** | Edit configuration without leaving Cart family. |
| **User goal** | Change modifiers/qty on a line. |
| **System goal** | `UpdateQuantity` / draft modifier update. |
| **Information shown** | Action Sheet over cart. |
| **Fields** | same as Item.S2 subset |
| **Validation** | Pack rules |
| **Actions** | Save · Dismiss |
| **Commands** | draft update |
| **Events** | TransactionDraftUpdated (soft) |
| **Navigation** | stay S2 |
| **Components** | Action Sheet · Form Section · Quantity Stepper |
| **Reference Experience** | Edit cart line |

---

## Guest.Cart.S4 — Submitting

| | |
|--|--|
| **Intent** | In-flight `SubmitTransaction`. |
| **User goal** | Wait for commit. |
| **System goal** | `CreateTransaction` + FulfilmentCreated. |
| **Information shown** | Loading · Place disabled. |
| **Actions** | none |
| **Commands** | `SubmitTransaction` / `CreateTransaction` |
| **Events** | pending `TransactionCreated`, `FulfilmentCreated` |
| **Navigation** | → S6 Success · S5 Failed |
| **Components** | Loading Surface · Bottom Action Bar disabled |
| **A11y** | aria-busy |
| **Reference Experience** | Place order spinner |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main  [ Submitting… ]     │
├───────────────────────────┤
│ Place (disabled)          │
└───────────────────────────┘
```

---

## Guest.Cart.S5 — Failed

| | |
|--|--|
| **Intent** | Recoverable submit failure; preserve draft. |
| **User goal** | Retry without rebuilding cart. |
| **System goal** | Keep lines; no partial Transaction. |
| **Information shown** | Error Surface · Retry · Browse. |
| **Actions** | Retry (`SubmitTransaction`) · Browse |
| **Events** | none on fail |
| **Navigation** | stay / Menu |
| **Components** | Error Surface · Bottom Action Bar |
| **A11y** | alert |
| **Reference Experience** | Order submit error |

---

## Guest.Cart.S6 — Success

| | |
|--|--|
| **Intent** | Explicit success before Live Order. |
| **User goal** | Know commitment landed. |
| **System goal** | Clear draft; hand off to fulfilment projections. |
| **Information shown** | Confirmation · Continue. |
| **Actions** | Continue (auto ok) |
| **Events** | observe `TransactionCreated`, `FulfilmentCreated` |
| **Navigation** | → G-06 Live Order |
| **Components** | Confirmation Panel · Bottom Action Bar |
| **A11y** | status |
| **Reference Experience** | Order placed |

---

## Guest.Cart.S7 — Offline

| | |
|--|--|
| **Intent** | Preserve submit Intent when offline. |
| **User goal** | Know order will sync. |
| **System goal** | Queue `SubmitTransaction`. |
| **Information shown** | Offline Banner · lines · Queue / Retry. |
| **Actions** | Queue place · Browse |
| **Events** | deferred |
| **Navigation** | stay or Live when synced |
| **Components** | Offline Banner · Line Item Row · Bottom Action Bar |
| **Reference Experience** | Offline order queue |

---

## State transition map

```text
S1 Empty ←→ S2 Has Items ←→ S3 Modifier
                ↓
             S4 Submitting
              ↓        ↓
           S6 Success  S5 Failed
                ↓
          G-06 Live Order

S7 Offline overlays S2/S4
```

---

## LEK-028 extracts

| Component | Status |
|-----------|--------|
| Line Item Row | Draft — extracted here |
| Order Total | Draft — extracted here |
| Quantity Stepper | Already **Frozen** |
| Bottom Action Bar | Already **Frozen** |
| Confirmation Panel | Promote on G-08; used in S6 |

---

## Implementation notes (code — when picking up IR)

- Draft cart ≠ Transaction until S4 succeeds.  
- `CreateTransaction` body = current lines.  
- On success clear draft; open Live Order.  
- Do not collect payment on Cart (that’s G-07).

*End of G-05 — Implementation Ready.*
