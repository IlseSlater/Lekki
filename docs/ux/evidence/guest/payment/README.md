# Evidence — G-07 Payment

**Uncertainty removed:** Did payment work?

| Case | Evidence |
|------|----------|
| Amount due visible | `leos-payment-summary` |
| Pay / Retry | Primary disabled while settling; retry label on error |
| Failure recoverable | `paymentError`; session not closed |
| Gateway | `form_post` checkout hand-off |
| Success | → receipt → Leave |

API: `POST /payments/request/:sessionId` · `POST /payments/:id/complete` (manual) · PayFast ITN path unchanged.
