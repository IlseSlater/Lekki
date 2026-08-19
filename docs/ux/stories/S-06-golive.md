# Story: S-06 — Go Live

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Activate |
| **Spec** | [studio-screen-summaries.md §S-06](../studio-screen-summaries.md) · Blueprint §8.7 |
| **Evidence** | `setup-golive-engine.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Activate — make experience public |
| 2 | Which human? | Owner ready to welcome first guest |
| 3 | Reusable capability? | Entry QR · public token · same Experience Shell |
| 4 | How better? | Pride (“I did it”) · QR usable · same shell as Live |
| 5 | Another profile? | Yes — Go Live shape identical across types |

### Platform Value

| | |
|--|--|
| **User Value** | Pride — experience is live; guests can scan |
| **Platform Value** | Publish = reach only; shell unchanged |
| **Reusable Capability** | Entry QR · entryUrlForToken |
| **Future Reuse** | Print packs / multi-QR later |

### Acceptance Spec

```text
Given I completed prior Setup steps and open /studio/setup/golive
When the page loads
Then I see a QR for the guest entry URL
And copy says the experience is live / ready to welcome guests
And I never see “Deployment”, “Publish workspace”, or “100% complete”

Given I download or open the guest link
When the guest shell loads
Then it matches the Live Experience I already shaped

Given I tap Continue
When navigation completes
Then I am on /studio/operate
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Peak emotion Pride? | Yes | Not checklist |
| Live = public shell? | Yes | |

### Retrospectives

Link when done.
