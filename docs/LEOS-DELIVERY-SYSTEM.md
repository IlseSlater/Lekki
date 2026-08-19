# LEOS Delivery OS

**Status: Frozen** — build process only  
**Company ops:** LEO (invisible to customers)  
**Align:** [LEKKI-BUILD.md](LEKKI-BUILD.md) · [NORTH-STAR.md](NORTH-STAR.md) · [LEK-040](LEK-040-human-experience-engineering.md) · [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md)

LEO exists so Lekki ships experiences. Do not optimize the engineering organization — optimize Provider and Experience journeys.

**LEOS is built by completing experiences, not by completing documents.**

**Mantra:** One owner, one artifact, one responsibility.  
**Motto:** Every merged change should make someone's day a little easier.  
**Prefer:** Finish an in-flight interaction over starting another.  
**Release alone** changes status / maturity / Frozen.

**Never tell LEO to “Build LEOS.”** Tell it the next story — or **`Continue building LEOS`**, which means: pick the current in-flight contract and execute the next stage.

---

## Experience loop (product)

```text
Human Need → Interaction → Components → Contracts → Implementation → Evidence → Experience Review → Freeze
```

## Delivery stages (ops)

```text
Executive Orchestrator
        │
   Design → Contracts → Build → Verify → Release
```

| Stage | Means | Workers (today) |
|-------|--------|-----------------|
| **Design** | Human need · Interaction · Components · Experience Review | UX Lead · Component Designer · Product Reviewer |
| **Contracts** | Domain · Commands · Events | Domain Architect · Platform (rare) |
| **Build** | Frontend ∥ Backend | Frontend Builder · Backend Builder |
| **Verify** | Evidence + QA | Quality & Evidence |
| **Release** | Promotion | Release Manager |

Specialists may change. Stages do not.

---

## Before any story

Answer the [five North Star questions](NORTH-STAR.md#before-any-story-five-questions). Then:

1. Interaction frozen  
2. Components exist (LEK-028)  
3. Domain contracts / Acceptance Spec exist  
4. Then FE ∥ BE · evidence · Release only after evidence + Experience Review pass  

If blocked → create a **request** under `docs/questions/` — do not assume.

---

## Maturity L0–L6

Idea → Interaction → Components → IR → Running → Evidence → Frozen.  
Only Release Manager advances levels on story cards.

---

## Orchestration

Human says **`Build Story G-0X`**.

Executive Orchestrator assigns stages, routes blockers, verifies gates, notifies Release.  
Does **not** write Angular, Prisma, or LEKs.

Agents: `.cursor/agents/` · Stories: `docs/ux/stories/` · Backlog: [EXPERIENCE-BACKLOG.md](EXPERIENCE-BACKLOG.md)

---

## Out of scope for this doc

Org redesign · new philosophy LEKs · Marketplace / Neo until they improve a journey.
