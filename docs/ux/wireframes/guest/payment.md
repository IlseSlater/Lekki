# G-07 — Guest Payment (complete interaction specification)

**Uncertainty removed:** Did payment work?

**Screen family:** Guest Payment (Settle)  
**Journey:** Experience Heartbeat — Settle  
**Layout grammar:** Guest  
**Behaviour:** Proven ✓ Restaurant — *settlement is Capability-owned; Session stays open until paid or staff-closed*  
**Reference Experience:** Restaurant App pay / settle — adopt behaviour, not code  
**Inventory:** [Guest Experience Inventory](../guest-experience-inventory.md) — **Implementation Ready**  
**Reuse:** ★★★★★ Core settlement interaction  
**Design order:** 4th (after Menu, Item, Cart)

---

## Responsibilities (define before visuals)

Payment is where **Capability settlement** meets the Guest Experience surface. Cart built the Transaction; Live Order tracks Fulfilment; Payment converts balance into a completed Payment without owning catalogue or kitchen.

| | |
|--|--|
| **Intent** | Collect settlement Intent and complete payment for what is owed. |
| **User goal** | Pay what I owe; know if it worked. |
| **System goal** | `RequestPayment` via bound connector; project Payment lifecycle events. |
| **Platform Value** | Converts an open balance into a canonical **Payment** — same surface pattern for hotel folio, festival tab, golf settlement, retail checkout. |
| **Runtime** | Capability Runtime (Experience hosts the surface) |
| **Capability** | `payment.settle` |
| **Pack** | Restaurant (terminology only — “bill”, “pay”, method labels) |

### Commands

| Command | When |
|---------|------|
| `SelectPaymentMethod` | Soft / client — method choice before Pay |
| `RequestPayment` | Pay / Retry |
| `CancelPaymentAttempt` | Cancel while Pending (if allowed) |
| `RetryPayment` | Alias of `RequestPayment` after Failed |

### Events

| Event | When |
|-------|------|
| `PaymentRequested` | Pay accepted by Capability |
| `PaymentAuthorised` | Optional intermediate (connector) |
| `PaymentCompleted` | Success |
| `PaymentFailed` | Failure (Session remains open) |
| *(impl)* attempt cancelled | User abort — no `PaymentCompleted` |

Visual decisions below support these responsibilities only. **No catalogue, no kitchen, no draft cart lines** on this screen.

---

## Platform Value

Payment is the **settlement boundary** of Experience Computing: Transaction and Fulfilment may already exist; Payment owns money movement through Capability + Connector only.

**Future reuse:** Hotel folio settle · Festival vendor tab · Golf clubhouse settle · Spa package pay · Retail checkout · Waiter payment assist (same Payment Summary + method pattern)

---

## Shared layout

```text
┌───────────────────────────┐
│ Header                    │  Settle / Pay
├───────────────────────────┤
│ Context Banner            │  offline / capability missing / error
├───────────────────────────┤
│ Main Content              │  Payment Summary · methods
├───────────────────────────┤
│ Primary Action            │  Pay · Back · Retry
└───────────────────────────┘
         [Neo Dock]
```

### Components (LEK-028)

| Component | Role |
|-----------|------|
| Session Header | Purpose |
| **Payment Summary** | Amount due + status (**Frozen** here) |
| Selection Card | Payment method choice |
| Bottom Action Bar | Pay / Back / Retry (**Frozen**) |
| Loading Surface | Pending / connector wait |
| Error Surface | Failed · capability missing |
| Offline Banner | Continuity |
| Confirmation Panel | Success (S4) |
| Status Chip | Optional on Summary |
| Permission Gate | Capability not bound |
| Neo Dock | Passive |

### Accessibility (family)

- `h1` = settle purpose  
- Amount due as text (never image-only)  
- Method group = `radiogroup` / Selection Cards with pressed  
- Pay disabled reason announced (no method, no balance, pending)  
- Pending → `aria-busy` + polite status  
- Failed → `role="alert"`  
- Success → polite status then navigate to Receipt  

### Navigation

| | |
|--|--|
| Back | → G-06 Live Order (primary return) |
| Pay success | → G-08 Receipt (after Confirmation) |
| Failed Retry | stay family → S1 |
| Cancelled | → S1 or Live Order |
| Capability missing | Permission / Setup journey (not invent payment) |

### Runtime / Pack

| Runtime | Capability (surface hosted by Experience) |
| Pack | Restaurant terminology only |
| Capability | `payment.settle` + bound connector |
| Connector | Provider UI / redirect / ITN — never pack-owned |

---

## Guest.Payment.S1 — Ready (method choice)

| | |
|--|--|
| **Intent** | Collect settlement Intent. |
| **User goal** | Choose how to pay; start pay. |
| **System goal** | Ready `RequestPayment` with selected method. |
| **Information shown** | Payment Summary (ready) · method Selection Cards · Pay · Back. |
| **Fields** | `method` ∈ { Manual, Card, Wallet, … as bound } |
| **Validation** | Pay disabled without balance or without method; hide unbound methods. |
| **Actions** | Select method · Pay · Back |
| **Commands** | `SelectPaymentMethod` · `RequestPayment` |
| **Events** | Pay → pending `PaymentRequested` |
| **Navigation** | Pay → S2 (or Card/Wallet path) · Back → Live Order |
| **Components** | Payment Summary · Selection Card · Bottom Action Bar |
| **A11y** | radiogroup; Pay named with amount |
| **Reference Experience** | Settle / choose tender |

```text
┌───────────────────────────┐
│ Header  Settle            │
├───────────────────────────┤
│ Main                      │
│  Payment Summary  R 120   │
│  [ Manual ]               │
│  [ Card ]                 │
│  [ Wallet ]               │
├───────────────────────────┤
│ Back | Pay                │
└───────────────────────────┘
```

---

## Guest.Payment.S1b — Card / Wallet (connector)

| | |
|--|--|
| **Intent** | Method-specific checkout without LEOS inventing provider UI. |
| **User goal** | Complete provider flow. |
| **System goal** | Binding-only connector invoke. |
| **Information shown** | Payment Summary · Loading / redirect / embedded checkout. |
| **Fields** | Provider-owned |
| **Validation** | Connector timeout → S3 / S5 |
| **Actions** | Provider-owned · Cancel return (if allowed) |
| **Commands** | in-flight `RequestPayment` |
| **Events** | connector → `PaymentAuthorised` / Complete / Failed |
| **Navigation** | return → S2 / S4 / S5 / S3 |
| **Components** | Payment Summary · Loading Surface |
| **Reference Experience** | Card / wallet redirect |

---

## Guest.Payment.S2 — Pending

| | |
|--|--|
| **Intent** | Waiting for authorisation / ITN / manual complete. |
| **User goal** | Know payment is in flight. |
| **System goal** | Await `PaymentCompleted` / `PaymentFailed`. |
| **Information shown** | Payment Summary (pending) · optional Cancel. |
| **Actions** | Wait · Cancel (`CancelPaymentAttempt` if allowed) |
| **Commands** | none new (await) |
| **Events** | optional `PaymentAuthorised` · then Complete / Failed |
| **Navigation** | → S4 · S3 · S5 |
| **Components** | Loading Surface · Payment Summary · Bottom Action Bar |
| **A11y** | aria-busy · status |
| **Reference Experience** | Waiting for payment confirmation |

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  Summary (pending)        │
│  [ Pending… ]             │
├───────────────────────────┤
│ Cancel (optional)         │
└───────────────────────────┘
```

---

## Guest.Payment.S3 — Failed

| | |
|--|--|
| **Intent** | Recoverable payment failure; Session stays open. |
| **User goal** | Retry or change method. |
| **System goal** | Emit / observe `PaymentFailed`; preserve balance. |
| **Information shown** | Error Surface · Payment Summary · Retry · Back. |
| **Actions** | Retry (`RequestPayment`) · Back to Live Order · change method → S1 |
| **Commands** | `RetryPayment` / `RequestPayment` |
| **Events** | `PaymentFailed` |
| **Navigation** | S1 or Live Order |
| **Components** | Error Surface · Payment Summary · Bottom Action Bar |
| **A11y** | alert |
| **Reference Experience** | Payment declined / failed |

---

## Guest.Payment.S4 — Success

| | |
|--|--|
| **Intent** | Explicit paid success before Receipt. |
| **User goal** | Know they are settled. |
| **System goal** | Confirm `PaymentCompleted`. |
| **Information shown** | Confirmation · amount · Continue. |
| **Actions** | Continue (auto ok) |
| **Events** | observe `PaymentCompleted` |
| **Navigation** | → G-08 Receipt |
| **Components** | Confirmation Panel · Payment Summary (paid) · Bottom Action Bar |
| **A11y** | status |
| **Reference Experience** | Payment successful |

---

## Guest.Payment.S5 — Cancelled

| | |
|--|--|
| **Intent** | User aborted checkout; no charge. |
| **User goal** | Return without payment. |
| **System goal** | No `PaymentCompleted`; Session open. |
| **Information shown** | Banner · Try again · Back to live. |
| **Actions** | Try again → S1 · Back → Live Order |
| **Events** | none or impl-defined cancel |
| **Navigation** | S1 or Live Order |
| **Components** | Context Banner · Bottom Action Bar |
| **Reference Experience** | Cancelled checkout |

---

## Guest.Payment.S6 — Capability missing

| | |
|--|--|
| **Intent** | Honest failure when settle Capability / connector not bound. |
| **User goal** | Know they cannot pay here; escape. |
| **System goal** | Block inventing payment; surface Permission / Capability journey. |
| **Information shown** | Permission Gate / Error · Back. |
| **Actions** | Back · Assist (optional) |
| **Commands** | none |
| **Events** | none |
| **Navigation** | Live Order / Assistance |
| **Components** | Permission Gate · Error Surface · Bottom Action Bar |
| **Reference Experience** | Payments not configured |

---

## Guest.Payment.S7 — Offline

| | |
|--|--|
| **Intent** | Preserve settle Intent when offline (queue or block per policy). |
| **User goal** | Know pay cannot complete online yet. |
| **System goal** | Do not fake `PaymentCompleted`; queue or disable Pay. |
| **Information shown** | Offline Banner · Summary · disabled or Queue. |
| **Actions** | Queue (if allowed) · Back |
| **Events** | deferred `PaymentRequested` when online |
| **Navigation** | stay |
| **Components** | Offline Banner · Payment Summary · Bottom Action Bar |
| **Reference Experience** | Offline pay hold |

---

## State transition map

```text
S6 Capability missing ──→ escape Live / Assist

S1 Ready ──Pay──→ S1b Connector? ──→ S2 Pending
                      ↓
                   S2 Pending
                    ↓        ↓        ↓
                 S4 Success  S3 Failed  S5 Cancelled
                    ↓           ↓
              G-08 Receipt    S1 Retry

S7 Offline overlays S1 / S2
```

---

## LEK-028 extracts

| Component | Status |
|-----------|--------|
| **Payment Summary** | **Frozen** — extracted and stabilised here |
| Selection Card | Draft — method choice |
| Confirmation Panel | Draft — used in S4; freeze with G-08 |
| Bottom Action Bar | Already **Frozen** |
| Loading / Error / Offline | Already drafted |

---

## Implementation notes (code — when picking up IR)

- Never complete payment in Experience Runtime — Capability + Connector only.  
- Manual method still emits `PaymentRequested` → `PaymentCompleted` (or staff-complete path).  
- Failed / Cancelled keep Session and prior Transaction/Fulfilment.  
- Entry from Live Order (balance due); not from Cart (Cart only submits Transaction).  
- Webhook / ITN may flip S2 → S4 / S3 without further taps (System Journey).

*End of G-07 — Implementation Ready.*
