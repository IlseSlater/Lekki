# Story: S-17 — Answers (not Reports)

| | |
|--|--|
| **Maturity** | **L4 Running** |
| **Journey stage** | Provider — Grow (nested view, not a new nav item) |
| **Spec** | [grow-craft.md](../grow-craft.md) — "Never ship ... export toolbars" |
| **Evidence** | [grow-answers.md](../evidence/grow-answers.md) — `grow-answers.test.ts` (4/4) + `csv.test.ts` (5/5) + live walk |
| **Questions** | — |

Uber Eats Manager's Reports module is a CSV export center: pick a report type (Order History, Payment Details, Downtime, Feedback, …), pick a date range up to 31 days, generate, download. That's a filter-bar-and-export-toolbar surface — the exact thing `grow-craft.md` names as a Don't.

The real need underneath "Reports" isn't a spreadsheet — it's a specific question an owner has ("what did we sell last month," "what's my order history for accounting"). This story answers questions on request, one at a time, instead of building an export center.

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Grow, occasional (month-end, accounting) |
| 2 | Which human benefits? | Owner or bookkeeper who needs a record, not a dashboard |
| 3 | Which reusable platform capability emerges? | `requestVisitRecord(period)` → `POST /grow/answers` — one named record, emailed, not opened in-app |
| 4 | How will we know it's better? | Owner taps one thing ("Email last week's orders") and it arrives — no report picker, no filter bar |
| 5 | Can another profile reuse it? | Yes — the record shape (visits, totals, dates) is Pack-agnostic |

### Platform Value

| | |
|--|--|
| **User Value** | I can get my records without learning a reporting tool |
| **Platform Value** | One export capability instead of a Reports module with six report types — built on the outbox (`VisitRecordRequested` → `AnswersMailerService`), not a synchronous send inside the request |
| **Reusable Capability** | `requestVisitRecord(venueId, period)` → emails a CSV, returns a calm confirmation immediately (the send itself is async) |
| **Future Reuse** | `EmailConnectorDefinition` (capability-before-vendor, mirrors `PaymentConnectorDefinition`) means a future provider swap is a new connector package, not a rewrite |

### Acceptance Spec

```text
Given I want a record of last week's trading
When I open Grow and tap "Email last week's orders"
Then LEOS confirms calmly, inline on the door itself ("On its way to you@venue.com")
And I never see a report-type picker, a date-range filter bar, or a table to scroll

Given I want a different period
When I tap "Email this month's orders" instead
Then it's a second, separate door — plain terms, no custom date-range picker with a 31-day cap

Given the record is ready
When it arrives
Then it's a plain CSV attachment, not an in-app table with export/download buttons
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Against Excel SaaS? | Yes | No report picker, no filter bar, no sheet even — two doors, inline confirm |
| Feels like a trusted manager? | Yes | Answers a question, doesn't hand over a spreadsheet tool |

### Retrospectives

Link when done.
