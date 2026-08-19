# G-06 — Guest Live Order (complete interaction specification)

**Uncertainty removed:** Is everything progressing?

**Screen family:** Guest Live Order (Experience Progress)  
**Journey:** Experience Heartbeat — Observe fulfilment  
**Layout grammar:** Guest  
**Behaviour:** Proven ✓ Restaurant — *live status without refresh; Session stays open*  
**Reference Experience:** Restaurant App order tracking — adopt behaviour, not code  
**Inventory:** [Guest Experience Inventory](../guest-experience-inventory.md) — **Frozen**  
**Sprint:** [Experience Heartbeat](../sprint-1-heartbeat.md)  
**Reuse:** ★★★★☆ Core Experience Progress interaction  
**Design order:** 5th in platform-value order (after Menu, Item, Cart, Payment specs)

---

## Opening question

**What does a person need to know, at every moment, while waiting?**

1. **What is happening now** (current step)  
2. **What happens next** (upcoming step)  
3. **Whether I must act** (Pay · Assist · nothing)  
4. **That the system is still with me** (live / reconnecting / last known)

If the screen answers those four, it is Experience Progress — not a kitchen viewer.

---

## Responsibilities (define before visuals)

Live Order is where **Experience Session, event projections, Fulfilment, Payment affordances, offline, and Status Timeline** meet. It is nearly an integration test for the platform.

| | |
|--|--|
| **Intent** | Observe the live progress of commitments within the current Experience Session. |
| **User goal** | Know what is happening; know what happens next; know if action is required. |
| **System goal** | Project immutable fulfilment (and related) events into an understandable timeline. |
| **Platform Value** | Universal **Experience Progress** — Restaurant · Hotel Room Service · Festival orders · Spa treatments · Golf clubhouse · Clinics · Museums. |
| **Runtime** | Experience Runtime (surface + projections) · Capability (fulfilment source) |
| **Capability** | Fulfilment (observe); Payment only as navigation when balance due |
| **Pack** | Restaurant (step labels only — e.g. Preparing / Ready / Served) |

### Commands

| Command | When |
|---------|------|
| *(observe only)* | Primary mode — no mutate of fulfilment from Guest |
| `RequestAssistance` | Assist (optional) |
| `OpenPayment` | Soft navigation → G-07 when payable |
| `RetryConnection` | Offline / reconnecting |

### Events (observe)

| Event | When |
|-------|------|
| `FulfilmentCreated` | After Cart submit |
| `FulfilmentAssigned` | When applicable |
| `FulfilmentStatusChanged` | Progress along timeline |
| `PaymentCompleted` | May clear Pay affordance |
| *(connection)* | Offline / reconnect signals (client) |

Visual decisions support observation and calm trust — **not** kitchen board operations.

---

## Platform Value

This is **Experience Progress**, not “order tracking.”

**Pack label mapping (Status Timeline steps):**

| Platform step | Restaurant example | Hotel example |
|---------------|--------------------|---------------|
| Submitted | Order received | Requested |
| Accepted | Accepted | Assigned |
| In Progress | Preparing | Being delivered |
| Ready | Ready | At door / ready |
| Completed | Served | Delivered |

Same component. Different Experience Profile / Pack strings.

---

## Shared layout (wireframe rhythm)

```text
┌────────────────────────────┐
│ Context                    │  Session Header
├────────────────────────────┤
│ Primary Content            │  Lines · Status Timeline
├────────────────────────────┤
│ Status / Guidance          │  What’s next · live / stale
├────────────────────────────┤
│ Primary Action             │  Pay (if due) · Assist · Browse
└────────────────────────────┘
         [Neo Dock]
```

### Components (LEK-028)

| Component | Role |
|-----------|------|
| Session Header | Where am I? (**Frozen**) |
| **Status Timeline** | Progress of commitment (**Frozen** here) |
| Status Chip | Per-line or step tone |
| Line Item Row | Read-only committed lines |
| Offline Banner | Continuity |
| Error Surface | Projection / session error |
| Loading Surface | First paint / reconnect |
| Bottom Action Bar | Pay · Assist · Keep browsing (**Frozen**) |
| Neo Dock | Passive |

### Accessibility (family)

- `h1` = progress purpose (Pack term ok)  
- Status Timeline as ordered list; current step announced  
- Live updates → `aria-live="polite"` (not assertive spam)  
- Offline / error → status or alert as appropriate  
- Pay / Assist named; disabled Pay announces why  

### Navigation

| | |
|--|--|
| Pay | → G-07 Payment (when balance due) |
| Assist | RequestAssistance side-effect; stay |
| Keep browsing | → G-03 Menu (session open) |
| Ready → leave path | usually Pay or later Leave |

### Runtime / Pack

| Runtime | Experience (UI + subscribe) · Capability (fulfilment truth) |
| Pack | Step labels · line labels |
| Do not | Expose station board, kitchen actions, or restaurant-only chrome |

---

## Guest.LiveOrder.S1 — Pending (Submitted / Accepted)

| | |
|--|--|
| **Intent** | Commitment accepted; progress not yet moving. |
| **User goal** | Know it was received; waiting is expected. |
| **System goal** | Show Timeline at Submitted/Accepted; subscribe. |
| **Information shown** | Status Timeline · lines · “What’s next” · Assist · Pay if due. |
| **Actions** | Assist · Pay · Browse |
| **Commands** | observe · optional Assist |
| **Events** | observe `FulfilmentCreated` |
| **Navigation** | stay / Payment / Menu |
| **Components** | Status Timeline · Line Item Row · Bottom Action Bar |
| **A11y** | polite status “submitted” |
| **Reference Experience** | Order received / waiting |

```text
┌────────────────────────────┐
│ Context  Progress          │
├────────────────────────────┤
│ Primary                    │
│  ● Submitted               │
│  ○ In Progress             │
│  ○ Ready                   │
│  ○ Completed               │
│  Lines…                    │
├────────────────────────────┤
│ Status  Waiting — next: …  │
├────────────────────────────┤
│ Assist | Pay (if due)      │
└────────────────────────────┘
```

---

## Guest.LiveOrder.S2 — In Progress

| | |
|--|--|
| **Intent** | Live progress without refresh. |
| **User goal** | See movement; know next step. |
| **System goal** | Project `FulfilmentStatusChanged`. |
| **Information shown** | Timeline current = In Progress · mixed line chips optional. |
| **Actions** | Assist · Pay · Browse |
| **Events** | `FulfilmentStatusChanged` |
| **Navigation** | stay / Payment |
| **Components** | Status Timeline · Status Chip · Bottom Action Bar |
| **Reference Experience** | Preparing |

---

## Guest.LiveOrder.S3 — Ready

| | |
|--|--|
| **Intent** | Emphasise ready-to-act moment calmly. |
| **User goal** | Know collection / delivery is ready. |
| **System goal** | Highlight Ready without popup spam. |
| **Information shown** | Timeline at Ready · clear guidance. |
| **Actions** | Pay (if due) · Assist · Browse |
| **Events** | status Ready |
| **Components** | Status Timeline · Status Chip · Bottom Action Bar |
| **Reference Experience** | Ready for pickup / delivery |

---

## Guest.LiveOrder.S4 — Completed

| | |
|--|--|
| **Intent** | Commitment fulfilled for this batch. |
| **User goal** | Know it’s done; settle or leave path clear. |
| **System goal** | Timeline Completed; Pay if balance remains. |
| **Information shown** | Completed step · Pay primary if due. |
| **Actions** | Pay · Browse · later Leave |
| **Navigation** | → Payment or Menu |
| **Components** | Status Timeline · Bottom Action Bar |
| **Reference Experience** | Served / delivered |

---

## Guest.LiveOrder.S5 — Offline

| | |
|--|--|
| **Intent** | Last-known progress; never lose Session. |
| **User goal** | Trust stale state until sync. |
| **System goal** | Show Offline Banner; queue reconnect. |
| **Information shown** | Offline · last Timeline · Retry. |
| **Actions** | RetryConnection |
| **Components** | Offline Banner · Status Timeline (stale) |
| **Reference Experience** | Offline order status |

---

## Guest.LiveOrder.S6 — Reconnecting

| | |
|--|--|
| **Intent** | Honest mid-sync state. |
| **User goal** | Know LEOS is restoring live progress. |
| **System goal** | Rebind projections; then S1–S4. |
| **Information shown** | Loading / reconnecting guidance. |
| **Components** | Loading Surface · Offline Banner fading |
| **A11y** | aria-busy |

---

## Guest.LiveOrder.S7 — Error

| | |
|--|--|
| **Intent** | Recoverable projection / session error. |
| **User goal** | Retry without abandoning session. |
| **System goal** | Surface Error; preserve Session. |
| **Information shown** | Error Surface · Retry · Assist. |
| **Actions** | Retry · Assist |
| **Components** | Error Surface · Bottom Action Bar |
| **A11y** | alert |

---

## State transition map

```text
S1 Pending → S2 In Progress → S3 Ready → S4 Completed
                ↕
         S5 Offline ↔ S6 Reconnecting
                ↓
             S7 Error → retry → prior

Pay → G-07 (from S1–S4 when balance due)
```

---

## Event timeline (Evidence)

```text
Cart Submit
  → TransactionCreated
  → FulfilmentCreated          (enter S1)
  → FulfilmentAssigned         (optional)
  → FulfilmentStatusChanged    (S2 → S3 → S4)
  → PaymentRequested           (via G-07)
  → PaymentCompleted
  → SessionCompleted           (Leave path)
```

This screen **observes** fulfilment (and payment completion for affordances); it does not own payment.

---

## LEK-028 extracts

| Component | Status |
|-----------|--------|
| **Status Timeline** | **Frozen** — extracted here |
| Status Chip | Draft (complements Timeline) |
| Line Item Row | Draft (read-only variant) |
| Offline Banner · Loading · Error | Draft |
| Bottom Action Bar · Session Header | Already **Frozen** |

---

## Design Critique

| Prompt | Answer |
|--------|--------|
| Lose one section? | No separate “event dump” — Timeline + one guidance line only. |
| One button instead of two? | Primary = Pay when due; else Assist is secondary; Browse tertiary in bar. |
| Know what happens next? | Explicit Status / Guidance region (“Waiting — next: …”). |
| Unnecessary text? | Pack labels only; no kitchen jargon. |
| Could Neo explain? | Yes later; Neo Dock stays passive — do not implement. |
| Feels like LEOS or restaurant app? | **LEOS** — Experience Progress + Pack step labels. |
| Uncertainty removed? | **Is everything progressing?** — yes. |

**Critique status:** **Passed** — screen may Build.

---

## Experience Review

| Question | Pass |
|----------|------|
| Understandable | Yes — waiting states self-explanatory |
| Obvious | Yes — Pay when due stands out |
| Calm | Yes — no popup spam; polite live region |
| Trustworthy | Yes — Offline / reconnect honest |
| Reusable | Yes — Hotel / Festival / Spa labels swap |

**Screen status:** **Frozen** — a developer can implement G-06 without asking a UX question.  
Component **Status Timeline** Frozen with this screen.

---

## Implementation notes (Phase B — Build)

- Subscribe to fulfilment projections (Socket / poll per runtime).  
- Never invent station actions on Guest.  
- Timeline steps from platform enum; labels from Profile/Pack.  
- Pay only if balance due; otherwise primary may be Browse or Assist.  
- Upstream: Cart Submit → FulfilmentCreated before Live Order is meaningful.

*End of G-06 — Frozen.*
