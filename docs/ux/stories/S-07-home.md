# Story: S-07 — Studio Home

| | |
|--|--|
| **Maturity** | L3+ (running — readiness front door) |
| **Journey stage** | Provider — Operate readiness |
| **Spec** | [studio-screen-summaries.md §S-07](../studio-screen-summaries.md) · Blueprint §9 |
| **Evidence** | `studio-home.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider — status after create/live |
| 2 | Which human? | Owner returning to Studio |
| 3 | Reusable capability? | Readiness home pattern (not dashboard) |
| 4 | How better? | Greeting · venue · readiness · doors; no charts/% |
| 5 | Another profile? | Yes |

### Platform Value

| | |
|--|--|
| **User Value** | “Everything is ready” / clear next door |
| **Platform Value** | Single front door for Setup · Operate · Grow |
| **Reusable Capability** | displayVenue · setupProgress without % UI |
| **Future Reuse** | Continuity greetings by name |

### Acceptance Spec

```text
Given I have no experiences
When I open /studio
Then I see Create your first experience (momentum, not guilt)
And one gold Create CTA

Given I have an experience that is not live
When I open /studio
Then readiness is almost/ready language (not Step X of Y)
And primary continues setup

Given my experience is live
When I open /studio
Then I see greeting, venue, “Everything is ready”
And Today’s Experience rows without charts
And Open Experience (gold) plus Operate · Grow text doors
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Readiness over completion? | Yes | |
| No dashboard? | Yes | |

### Retrospectives

Link when done.
