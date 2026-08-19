# Story: S-09 — Grow

| | |
|--|--|
| **Maturity** | L3 (craft in progress — trusted manager) |
| **Journey stage** | Provider — Grow |
| **Spec** | [studio-screen-summaries.md §S-09](../studio-screen-summaries.md) · [grow-craft.md](../grow-craft.md) |
| **Evidence** | `studio-grow.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider memory / calm truth |
| 2 | Which human? | Owner after service |
| 3 | Reusable capability? | Grow overview / Org Memory API |
| 4 | How better? | One breath narrative · ≤1 suggestion · no chart gallery |
| 5 | Another profile? | Yes |

### Platform Value

| | |
|--|--|
| **User Value** | Trusted manager told me the truth |
| **Platform Value** | Grow mode ≠ Insights product |
| **Reusable Capability** | getGrowOverview · suggestion heuristic |
| **Future Reuse** | Real favourites from memory — still one breath |

### Acceptance Spec

```text
Given my experience is live and I open /studio/grow
When overview loads
Then I see a greeting and human story (guests welcomed…)
And average wait as a simple figure
And at most one suggestion
And I do not see a chart grid, filter bar, or export toolbar

Given I am not live
When I open Grow
Then copy guides me to go live first
And primary returns me toward setup/home
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Against Excel SaaS? | Yes | Craft over conversation revenue KPIs |
| One suggestion max? | Yes | |

### Retrospectives

Link when done.
