# Story: S-08 — Operate

| | |
|--|--|
| **Maturity** | L3 (craft in progress — Hospitality Phase) |
| **Journey stage** | Provider — Operate |
| **Spec** | [studio-screen-summaries.md §S-08](../studio-screen-summaries.md) · [operate-craft.md](../operate-craft.md) |
| **Evidence** | `setup-operate.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider live execution under pressure |
| 2 | Which human? | Host / floor / kitchen staff |
| 3 | Reusable capability? | Fulfilment glance rows · assistance |
| 4 | How better? | One glance · one tap · one decision; clear next ticket |
| 5 | Another profile? | Yes — station terminology by type |

### Platform Value

| | |
|--|--|
| **User Value** | Everything is under control |
| **Platform Value** | Mission control without BI product |
| **Reusable Capability** | listFulfilments · listAssistance · glance row |
| **Future Reuse** | Multi-station aggregate glance |

### Acceptance Spec

```text
Given my experience is live and I open /studio/operate
When there are active fulfilments or assistance
Then I see rows of place · status · hint
And tapping a row navigates to act (station or floor)
And I see no charts, widgets, or cards-inside-cards

Given the queue is empty
When the board loads
Then I see a calm empty (e.g. kitchen is quiet — ready when guests arrive)

Given my experience is not live
When I open Operate
Then I am guided to Go Live first (calm, not punished)
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| One glance test? | Target | Craft ongoing |
| Dark ops theme absent? | Yes | Warm denser |

### Retrospectives

Link when done.
