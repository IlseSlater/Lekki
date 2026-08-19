# Story: S-04 — Where guests join (Places)

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Configure |
| **Spec** | [studio-screen-summaries.md §S-04](../studio-screen-summaries.md) · Blueprint §8.5 |
| **Evidence** | `setup-places.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Configure — join places |
| 2 | Which human? | Owner defining where guests arrive |
| 3 | Reusable capability? | Place sections · bulk create · liveFocusPlace |
| 4 | How better? | Arrival phone shows section + place; “n places ready” |
| 5 | Another profile? | Yes — Rooms / Counters / Zones by type |

### Platform Value

| | |
|--|--|
| **User Value** | Certainty — guests know where they are |
| **Platform Value** | Physical context codes for Entry |
| **Reusable Capability** | placeSections · arrival Live mode |
| **Future Reuse** | Bulk patterns per terminology.place |

### Acceptance Spec

```text
Given I am on /studio/setup/places
When I add or bulk-create places (e.g. Table 1–20)
Then confidence can report places ready in human language
And I never see “entities created”

Given I focus Table 12
When Live Experience is in arrival mode
Then the phone shows You’re joining with that place

Given at least one place is ready
When I tap Continue
Then I navigate to /studio/setup/payments
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Never Ask a Human to Imagine? | Yes | Arrival preview is Live |
| Readiness language? | Yes | places ready |

### Retrospectives

Link when done.
