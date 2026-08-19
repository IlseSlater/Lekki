# Story card template

**Delivery OS:** [LEOS-DELIVERY-SYSTEM.md](../../LEOS-DELIVERY-SYSTEM.md)  
**Backlog:** [EXPERIENCE-BACKLOG.md](../../EXPERIENCE-BACKLOG.md)  
**Only Release Manager advances maturity (L0–L6).**

---

## Story: G-0X — {Name}

| | |
|--|--|
| **Maturity** | L0 Idea |
| **Journey stage** | Provider / Experience — {Create\|…\|Fulfilment\|…} |
| **Spec** | [wireframes/guest/{file}.md](../wireframes/guest/{file}.md) |
| **Evidence** | [evidence/guest/{folder}/](../evidence/guest/) |
| **Questions** | (link Q-NNN) |

### Five questions (required before code or spec)

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | |
| 2 | Which human benefits? | |
| 3 | Which reusable platform capability emerges? | |
| 4 | How will we know it's better? | |
| 5 | Can another profile reuse it? | |

If any blank → stop.

### Platform Value

| | |
|--|--|
| **User Value** | |
| **Platform Value** | |
| **Reusable Capability** | |
| **Future Reuse** | |

### Acceptance Spec

```text
Given:
When:
Then:
```

Drives Playwright · backend tests · demo — without interpretation.

### Maturity checklist

| Level | Gate | Done |
|------:|------|------|
| L1 | Interaction complete (UX) | [ ] |
| L2 | Components complete (Component Designer) | [ ] |
| — | Product Review / Experience Review passed | [ ] |
| L3 | Acceptance Spec + Domain OK · IR | [ ] |
| L4 | Running (FE + BE) | [ ] |
| L5 | Evidence complete | [ ] |
| L6 | Frozen (Release closed) | [ ] |

### Product Review (Experience Review)

| Question | Pass? | Notes |
|----------|-------|-------|
| Five questions answered? | | |
| Understandable · obvious · calm · trustworthy? | | |
| Human Confidence (where / happening / next / recover)? | | |
| First-time user succeed? | | |
| Another profile can reuse? | | |
| Composition coherent (components)? | | |
| Makes someone's day easier? | | |

### Orchestration log (Release Manager)

| Step | Status |
|------|--------|
| Assigned Product | |
| Assigned Domain | |
| Launched FE ∥ BE | |
| Launched QA | |
| Librarian notified | |
| Experience backlog updated | |
| Architecture escalation | None / Q-NNN |

### Retrospectives

Link `../knowledge/retros/G-0X-*.md` when done.
