# Story: G-04 — Choices sheet

| | |
|--|--|
| **Maturity** | **Shipped** |
| **Journey** | Experience — Choices (overlay on Browse) |
| **Spec** | [g04-choices-sheet.md](../g04-choices-sheet.md) — canonical craft, do not duplicate here |
| **Evidence** | [g04-choices-sheet.md](../evidence/g04-choices-sheet.md) — Proven |

This card exists so G-04 has a `stories/` entry matching G-01/G-05/G-06/G-07 — the actual craft, HCI rules, and completion standard live in the linked spec. Do not fork a second description here.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — customising an item before adding it |
| 2 | Any diner ordering an item with required or optional choices |
| 3 | `leos-guest-choices-sheet` component · `CatalogChoiceGroup` (existing) |
| 4 | Required groups sort first; Add is disabled until required minimums are met |
| 5 | Any Pack — choice groups are catalogue data, not Restaurant-specific |

### Acceptance

See [g04-choices-sheet.md](../g04-choices-sheet.md) for the canonical flow. Summary:

```text
Given an item with a required choice group
When no required option is selected
Then Add is disabled and shows "Choose required options"
When required minimums are met
Then Add shows the live total and confirms into the cart
```

**Next slice:** None named — shipped.
