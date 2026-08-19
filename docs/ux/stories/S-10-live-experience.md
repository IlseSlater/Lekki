# Story: S-10 — Live Experience (chrome)

| | |
|--|--|
| **Maturity** | L3+ (frozen principles — running panel) |
| **Journey stage** | Provider — Configure confidence (chrome) |
| **Spec** | [studio-screen-summaries.md §S-10](../studio-screen-summaries.md) · [live-experience.md](../live-experience.md) |
| **Evidence** | `live-experience-panel.component.ts` · setup-engine-host |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Configure — remove imagination |
| 2 | Which human? | Owner shaping the guest experience |
| 3 | Reusable capability? | One Experience Shell projection |
| 4 | How better? | Instant update; same shell after Go Live; never “Preview” |
| 5 | Another profile? | Yes — shell content from Pack, chrome shared |

### Platform Value

| | |
|--|--|
| **User Value** | “If it looks like this here, guests see exactly this.” |
| **Platform Value** | Single renderer · Never Ask a Human to Imagine |
| **Reusable Capability** | liveRevision · arrival/pay modes · fullscreen |
| **Future Reuse** | Operate glance must not invent a second shell |

### Acceptance Spec

```text
Given I am on a Setup Engine step (Identity → Go Live)
When the host layout loads
Then Live Experience appears as a phone on the desk (not a Studio card)
And it is not a navigation item labelled Preview

Given I change venue name, place focus, or pay methods
When the change is saved/applied in context
Then the phone updates within motion tokens without Refresh/Save/Apply buttons

Given I go live and open the guest entry URL
When the guest shell loads
Then it is the same Experience Shell grammar projected in Studio
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Preview forbidden? | Yes | Live Experience |
| One shell? | Yes | |

### Retrospectives

Link when done.
