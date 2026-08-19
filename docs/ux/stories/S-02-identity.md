# Story: S-02 — Who you are (Identity)

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Configure |
| **Spec** | [studio-screen-summaries.md §S-02](../studio-screen-summaries.md) · Blueprint §8.3 |
| **Evidence** | `setup-identity.page.ts` · Live Experience panel |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Configure — name the venue |
| 2 | Which human? | Owner establishing identity guests recognise |
| 3 | Reusable capability? | Autosave · liveRevision · confidence indicator |
| 4 | How better? | Name morphs on phone; no Save button; Continue when named |
| 5 | Another profile? | Yes — label adapts (Restaurant name / Café name…) |

### Platform Value

| | |
|--|--|
| **User Value** | Ownership — guests will recognise us |
| **Platform Value** | Venue name as shared Experience + Studio truth |
| **Reusable Capability** | touchLive · autosave flash · confidence block |
| **Future Reuse** | Logo/colour later without new journey shape |

### Acceptance Spec

```text
Given I am on /studio/setup/identity with an active experience
When I type a venue name “Blue Door”
Then the change is autosaved without a Save button
And Live Experience venue title updates (morph/pulse)
And confidence can show guests will recognise the venue

Given the name is empty
When I view Continue
Then Continue is disabled

Given a non-empty name
When I tap Continue
Then I navigate to /studio/setup/experience
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Never Ask a Human to Imagine? | Yes | Phone shows name |
| Continuity (autosave)? | Yes | |

### Retrospectives

Link when done.
