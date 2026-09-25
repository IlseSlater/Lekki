# Studio stories (S-00 … S-20, not continuous — S-13/S-14 unused)

**Summaries:** [studio-screen-summaries.md](../studio-screen-summaries.md)  
**Constitution:** [LEOS-Studio-Design-Blueprint.md](../LEOS-Studio-Design-Blueprint.md)  
**Guest stories:** G-0X remain separate — G-01 through G-09 are all documented, see [guest-experience-inventory.md](../guest-experience-inventory.md).

| ID | Story | Stage |
|----|-------|-------|
| [S-00](S-00-welcome.md) | Welcome | Create |
| [S-01](S-01-choose-experience.md) | Choose Experience | Create |
| [S-02](S-02-identity.md) | Who you are | Configure |
| [S-03](S-03-experience.md) | What guests experience | Configure |
| [S-04](S-04-places.md) | Where guests join | Configure |
| [S-05](S-05-payments.md) | How guests pay | Configure |
| [S-06](S-06-golive.md) | Go Live | Activate |
| [S-07](S-07-home.md) | Studio Home | Readiness |
| [S-08](S-08-operate.md) | Operate | Operate |
| [S-09](S-09-grow.md) | Grow | Grow |
| [S-10](S-10-live-experience.md) | Live Experience chrome | Configure confidence |
| [S-11](S-11-team.md) | Staff shift (Team → PIN → tickets) | Staff |
| [S-12](S-12-catalogue.md) | Catalogue (what guests order) | Continuity |
| [S-15](S-15-payouts.md) | Payouts — one trading figure, not a ledger | Grow |
| [S-16](S-16-feedback.md) | Feedback — "Guests were delighted," not a review console | Grow |
| [S-17](S-17-reports.md) | Answers, not Reports — ask a question, not export a CSV | Grow · **Shipped** |
| [S-18](S-18-marketing.md) | One Suggestion — not a campaign builder | Grow |
| [S-19](S-19-documents.md) | Documents — flat invoice list, not a document manager | Grow |
| [S-20](S-20-payment-attention.md) | Payment attention — failed payments in the existing Operate board | Operate |

Setup v1 screens are **frozen** — deepen Operate/Grow craft; do not reopen Setup redesign.

**S-15…S-20 provenance:** translated from an Uber Eats Manager capability audit (2026-09-22) — the capability (payouts, feedback, reports, marketing, documents) is real and missing; the screen model (ledgers, review grids, export toolbars, campaign builders) is explicitly Hold per [grow-craft.md](../grow-craft.md)'s Never list. Each story keeps the capability, drops the dashboard. **Shipped:** S-15 (Payouts door), S-16 (Feedback door + guest leave capture), S-17 (Answers — email, capability-before-vendor via `EmailConnectorDefinition`, no sheet), S-20 (Operate payment attention). **L0:** S-18–19 — each blocked on a named product/external dependency.
