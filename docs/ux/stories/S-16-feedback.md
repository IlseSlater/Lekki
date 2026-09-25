# Story: S-16 — Feedback

| | |
|--|--|
| **Maturity** | **L4 Running** |
| **Journey stage** | Provider — Grow (nested view, not a new nav item) · Guest leave moment |
| **Spec** | [grow-craft.md](../grow-craft.md) — "Guests were delighted." |
| **Evidence** | [grow-feedback.md](../evidence/grow-feedback.md) · `grow-feedback.ts` / `grow-feedback.test.ts` · `GrowController.feedback` |
| **Questions** | — |

Uber Eats Manager gives Feedback four tabs (Overview, Store, Menu Items, Delivery Handoff), star breakdowns per category, a review list with tags and reply threads, and rating trend charts. That's a review-management console.

`grow-craft.md`'s own example copy already answers what LEOS wants here: *"Guests were delighted."* One sentence, not a console. This story builds the smallest thing that earns that sentence honestly, plus a way to see and answer an individual guest's words without turning into a CRM.

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Grow, after service · Guest leave |
| 2 | Which human benefits? | Owner who wants to know how the night went, and who wants to say thank you |
| 3 | Which reusable platform capability emerges? | `GET /grow/feedback` + guest `AssistanceRequest kind=feedback` |
| 4 | How will we know it's better? | Owner reads one sentence and, only if something needs attention, one comment — never a list to triage |
| 5 | Can another profile reuse it? | Yes — sentiment is Pack-agnostic |

**Guest capture:** leave-moment sheet when Studio `guestDesign.feedback` is on (default on for new designs). Owner reply to the guest is still unresolved — **Got it** marks heard for the owner only.

### Platform Value

| | |
|--|--|
| **User Value** | I know how guests felt without reading a spreadsheet of reviews |
| **Platform Value** | One sentiment-reading capability instead of a Feedback module |
| **Reusable Capability** | `composeFeedbackCopy` · sheet door pattern from S-15 |
| **Future Reuse** | Same shape feeds the Grow one-breath narrative |

### Reach model

Reuses the S-15 sheet pattern (`leos-feedback-sheet`). Door link: **How guests felt →**.

### Acceptance Spec

```text
Given guests left feedback this period
When I open Grow
Then one sentence tells me how it went ("Guests were delighted.")
And I do not see star breakdowns, category tabs, or a review list

Given one guest left a comment worth my attention (concern with text)
When I open the feedback view
Then I see that one comment, in the guest's words, with Got it
And I do not see every review — only the one that needs me

Given no feedback came in this period
When I open Grow
Then the sentence says so calmly ("Quiet night — no feedback yet.")
And there is no empty chart or "0 reviews" stat card
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|--------|
| Against Excel SaaS? | Yes | Sheet · one flagged max |
| One suggestion / one comment max? | Yes | Never a triage list |

### Retrospectives

Link when done.
