# Story: S-03 — What guests experience

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Configure |
| **Spec** | [studio-screen-summaries.md §S-03](../studio-screen-summaries.md) · Blueprint §8.4 |
| **Evidence** | `setup-experience-step.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Configure — guest-facing options |
| 2 | Which human? | Owner deciding what guests can do |
| 3 | Reusable capability? | Guest design toggles → Experience Shell |
| 4 | How better? | Owner can explain guest journey in one sentence; phone updates |
| 5 | Another profile? | Yes — groups/labels from type defaults |

### Platform Value

| | |
|--|--|
| **User Value** | Control — I understand what guests experience |
| **Platform Value** | Design flags without capability chrome |
| **Reusable Capability** | guestDesign · Live shell projection |
| **Future Reuse** | New toggles stay human-labelled |

### Acceptance Spec

```text
Given I am on /studio/setup/experience
When I toggle a guest option (e.g. Drinks off)
Then Live Experience updates immediately
And I never see Pack or “capability” nouns

Given at least one viable guest path is on
When confidence is ready
Then I can Continue to /studio/setup/places

Given no viable path
When I view Continue
Then Continue stays disabled with calm waiting copy
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Hospitality before software? | Yes | |
| One question per page? | Yes | What can guests do? |

### Retrospectives

Link when done.
