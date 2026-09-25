# Story: S-19 — Documents

| | |
|--|--|
| **Maturity** | L0 (not started) |
| **Journey stage** | Provider — Grow (nested view, not a new nav item) |
| **Spec** | [grow-craft.md](../grow-craft.md) — calm truth, not a document manager |
| **Evidence** | None yet |
| **Questions** | — |

Uber Eats Manager's Documents area is invoice storage: number, date, store, period, amount, status, download — a small table with filters. The need is real (owners need their invoices for accounting) but the shape doesn't need to be a document management system for what is, in practice, a short and slow-growing list.

*Note on grounding:* `grow-craft.md` doesn't mention documents or invoices at all — this story applies its calm/no-filter-bar spirit by analogy, not by literal quote the way S-15/S-16/S-17 do. Reasonable, but softer-grounded — worth knowing if this ever gets challenged.

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Grow, occasional (accounting, month-end) |
| 2 | Which human benefits? | Owner or bookkeeper collecting invoices |
| 3 | Which reusable platform capability emerges? | `listInvoices` — flat list, newest first, one action each |
| 4 | How will we know it's better? | Owner finds and downloads an invoice in one scroll, no filters needed |
| 5 | Can another profile reuse it? | Yes — invoice shape is platform-level, not Pack-specific |

**Depends on:** invoice generation. Nothing in the runtime creates an invoice record today — `listInvoices` presumes a source that doesn't exist yet. This story lists invoices; it does not generate them, and generation is a separate prerequisite, not an assumed given.

### Platform Value

| | |
|--|--|
| **User Value** | My invoices are where I'd expect them, without learning a filter UI |
| **Platform Value** | One flat list capability instead of a Documents module with status filters |
| **Reusable Capability** | `listInvoices(venueId)` → `[{ period, amount, issuedAt, downloadUrl }]` |
| **Future Reuse** | Same list shape works for any future document type without new UI |

### Acceptance Spec

```text
Given my venue has taken payments
When I open the invoices view (nested in Grow)
Then I see a plain list — period, amount, one download action each
And I do not see a status filter, search bar, or bulk-select toolbar

Given the list is empty
When I open it
Then copy says invoices appear here once trading starts — calmly, not an empty table

Given I tap download
When the file is ready
Then it downloads directly — no intermediate "view" screen before download
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| Against Excel SaaS? | Target | Flat list, no filter bar |
| One glance test? | Target | Craft not started |

### Retrospectives

Link when done.
