# LEK Build Loop

**Status:** Building Lekki — Phase 2 vertical slice  
**Daily board:** [LEKKI-BUILD.md](LEKKI-BUILD.md)  
**Mission:** [NORTH-STAR.md](NORTH-STAR.md) (**Frozen**)  
**Backlog:** [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md)  
**HXE:** [LEK-040](LEK-040-human-experience-engineering.md) (**Frozen**)  
**Delivery (LEO, invisible):** [LEOS-DELIVERY-SYSTEM.md](LEOS-DELIVERY-SYSTEM.md) (**Frozen**)  
**Acceptance:** [REFERENCE-IMPLEMENTATION-CHECKLIST.md](REFERENCE-IMPLEMENTATION-CHECKLIST.md)

**Motto:** Every merged change should make someone's day a little easier.  
**Orchestrate:** **`Continue building Lekki`** or **`Build Story G-0X`**.

### Current state

| Layer | Status |
|-------|--------|
| Vision (LEK-001 · 027 · 040 · North Star · Delivery OS) | **Frozen** |
| Architecture / runtimes | **Frozen** |
| Experience backlog | Active — [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md) |
| Interaction (LEK-029) | In progress |
| Components (LEK-028) | Growing |
| Implementation | Starting |

**No new philosophy LEKs.** Progress = better experiences via LEK-029 · LEK-028 · running software · evidence.  
Daily question: *Which experience are we shipping this week?*
---

## Build loop

```text
Human Need
    ↓
Interaction (LEK-029)
    ↓
Components (LEK-028)
    ↓
Contracts
    ↓
Implementation
    ↓
Evidence
    ↓
Experience Review
    ↓
Freeze
```

Not screens first — a **human need**. LEK-040 keeps that at the top.

Delivery OS maps Design → Contracts → Build → Verify → Release onto this loop.

---

## Before any story (five questions)

1. Which journey does this improve?  
2. Which human benefits?  
3. Which reusable platform capability emerges?  
4. How will we know it's better?  
5. Can another profile reuse it?  

---

## North Star — Guest Experience Frozen

**Exit gate:** Designer · FE · BE · zero clarification for the Guest heartbeat.

```text
Guest Experience Frozen → Guest Running → Guest Proven (Café) → Expand
```

**Dashboard:** [platform-maturity.md](ux/platform-maturity.md) · **Board:** [sprint-1-heartbeat.md](ux/sprint-1-heartbeat.md) · **Backlog:** [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md)

---

## Five workstreams (parallel)

### 1 — Product Design (highest priority)

Freeze remaining Guest screens (platform-value order):

G-06 ✓ · G-05 · G-07 · G-03 · G-04 · G-01 · G-02 · G-08 · G-09  

Per screen: human need → finish interaction → extract LEK-028 → Design Critique → Experience Review → **Freeze**.

### 2 — Design System

Every frozen screen: *Did we discover a reusable primitive?* → LEK-028 immediately.

### 3 — Heartbeat Code (**parallel with freezing**)

```text
Frozen screen → Angular → Nest → Runtime → Playwright → Evidence
```

### 4 — Evidence (first-class)

Interaction · Components · Running UI · Playwright · Event Trace · Review Notes → `docs/ux/evidence/guest/{screen}/`

### 5 — Platform Proof

After Guest Running: **Café** · same heartbeat · zero core changes.

---

## Daily loop

1. Pick a box on the [Experience Backlog](EXPERIENCE-BACKLOG.md)  
2. Answer the five questions  
3. Advance Human Need → … → Freeze (or ship a Frozen stage)  
4. Update the backlog when a stage is measurably better  

---

## Uncertainty removed

| Screen | Removes |
|--------|---------|
| Entry | Am I in the right place? |
| Join | Am I part of this experience? |
| Menu | What can I do? |
| Item | What am I choosing? |
| Cart | What am I about to commit to? |
| Live Order | Is everything progressing? |
| Payment | Did payment work? |
| Receipt | Is the experience complete? |
| Leave | Am I done? |

---

## Screen Frozen means

Spec complete · components in LEK-028 · Design Critique passed · Experience Review passed · inventory **Frozen**.

---

## Rules

1. Improve a journey stage — or don't ship  
2. Extract components — never invent / never duplicate  
3. Build only **Frozen** screens (parallel OK)  
4. No runtime/architecture change unless implementation forces it  
5. Freeze the smallest permanent thing today  
6. No Phase E before Guest Proven  

---

## Trackers

| | |
|--|--|
| Experience backlog | [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md) |
| **Lekki daily board** | [LEKKI-BUILD.md](LEKKI-BUILD.md) |
| North Star | [NORTH-STAR.md](NORTH-STAR.md) (**Frozen**) |
| HXE | [LEK-040](LEK-040-human-experience-engineering.md) (**Frozen**) |
| Delivery OS | [LEOS-DELIVERY-SYSTEM.md](LEOS-DELIVERY-SYSTEM.md) (**Frozen**) |
| LEOS hub | [LEOS.md](LEOS.md) |
| Stories | [ux/stories/](ux/stories/) |
| Questions / RFC | [questions/](questions/) |
| Knowledge | [ux/knowledge/](ux/knowledge/README.md) |
| Four dashboards | [platform-maturity.md](ux/platform-maturity.md) |
| Freeze board | [sprint-1-heartbeat.md](ux/sprint-1-heartbeat.md) |
| Screens | [guest-experience-inventory.md](ux/guest-experience-inventory.md) |
| Components | [LEK-028](LEK-028-component-catalogue.md) |
| Evidence | `docs/ux/evidence/guest/` |
| Heartbeat acceptance | [REFERENCE-IMPLEMENTATION-CHECKLIST.md](REFERENCE-IMPLEMENTATION-CHECKLIST.md) |
