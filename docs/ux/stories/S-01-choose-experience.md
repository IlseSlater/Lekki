# Story: S-01 — Choose Experience

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Create |
| **Spec** | [studio-screen-summaries.md §S-01](../studio-screen-summaries.md) · [Blueprint §3.B](../LEOS-Studio-Design-Blueprint.md) |
| **Evidence** | `studio-create.page.ts` · `experience-registry.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Create — pick hospitality shape |
| 2 | Which human? | Owner choosing venue type |
| 3 | Reusable capability? | Experience registry · startExperience seeding |
| 4 | How better? | Recognition &lt;3s · Live defaults update · Pack never shown |
| 5 | Another profile? | Yes — list is the Pack map, UI says Experience |

### Platform Value

| | |
|--|--|
| **User Value** | “I know what I’m creating.” |
| **Platform Value** | Type → Pack binding without exposing Pack |
| **Reusable Capability** | `EXPERIENCE_REGISTRY` · Live hydrate on select |
| **Future Reuse** | New types = registry rows, same screen |

### Acceptance Spec

```text
Given I am on /studio/create
When I view the list
Then I see hospitality types with label + one-sentence blurb
And I never see the word Pack

Given I select Restaurant
When selection applies
Then confidence shows You’ll create · Restaurant (ready)
And Live Experience reflects restaurant shell defaults
And Continue becomes enabled

Given I tap Continue with a selection
When startExperience runs
Then I navigate to /studio/setup/identity
And workspace has that type’s defaults
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Five questions answered? | Yes | |
| Calm · trustworthy? | Yes | Recognition emotion |
| First-time succeed? | Yes | |
| Profile reuse? | Yes | |

### Retrospectives

Link when done.
