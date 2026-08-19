# Story: S-05 — How guests pay (Payments)

| | |
|--|--|
| **Maturity** | L3+ (Setup v1 frozen — running) |
| **Journey stage** | Provider — Configure |
| **Spec** | [studio-screen-summaries.md §S-05](../studio-screen-summaries.md) · Blueprint §8.6 |
| **Evidence** | `setup-payments.page.ts` |
| **Questions** | — |

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey? | Provider Configure — guest pay options |
| 2 | Which human? | Owner ensuring guests can pay confidently |
| 3 | Reusable capability? | livePayMethods · pay projection mode |
| 4 | How better? | Phone checkout lists methods; no connector wizard |
| 5 | Another profile? | Yes — tip/split flags vary by type |

### Platform Value

| | |
|--|--|
| **User Value** | Trust — guests can pay |
| **Platform Value** | Guest-facing methods separate from connector install |
| **Reusable Capability** | Calm pay options UI · Live pay mode |
| **Future Reuse** | Deep connectors live elsewhere, not this step |

### Acceptance Spec

```text
Given I am on /studio/setup/payments
When I enable Card and Apple Pay
Then Live Experience pay mode lists those methods
And I never see OAuth, API keys, or “connector” copy on this page

Given at least one method is on
When confidence is ready
Then Continue navigates to /studio/setup/golive

Given no methods on
When I view Continue
Then Continue is disabled with calm waiting copy
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Calm by Default? | Yes | No 11-step wizard |
| Forbidden words absent? | Yes | |

### Retrospectives

Link when done.
