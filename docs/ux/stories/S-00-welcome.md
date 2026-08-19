# Story: S-00 — Welcome

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Create |
| **Spec** | [studio-screen-summaries.md §S-00](../studio-screen-summaries.md) · [Blueprint §3.A](../LEOS-Studio-Design-Blueprint.md) |
| **Evidence** | Running: `apps/web/src/app/pages/studio-welcome.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider Create — first calm step into Setup |
| 2 | Which human benefits? | First-time / returning venue owner |
| 3 | Which reusable platform capability emerges? | Experience Screen anatomy · guided Create entry |
| 4 | How will we know it's better? | Owner continues in one tap; answers three-second test; zero forms |
| 5 | Can another profile reuse it? | Yes — all experience types share Welcome |

### Platform Value

| | |
|--|--|
| **User Value** | Safe start — “Let’s get your experience ready.” |
| **Platform Value** | Single Create funnel entry for every Pack (invisible) |
| **Reusable Capability** | `leos-experience-screen` · progress story list |
| **Future Reuse** | Any new market type enters here unchanged |

### Acceptance Spec

```text
Given I am signed into Studio and open /studio/welcome
When the page loads
Then I see one headline inviting me to get my experience ready
And I see a human progress story (not Step X of Y)
And I see exactly one gold primary “Continue”
And I see a text “Home” escape
And there are no forms, Pack labels, or Marketplace tiles

Given I tap Continue
When navigation completes
Then I am on /studio/create (Choose Experience)
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Five questions answered? | Yes | |
| Understandable · obvious · calm · trustworthy? | Yes | Safe emotion |
| Human Confidence? | Yes | Where / next clear |
| First-time user succeed? | Yes | One tap |
| Another profile can reuse? | Yes | |
| Makes someone's day easier? | Yes | |

### Retrospectives

Link when done.
