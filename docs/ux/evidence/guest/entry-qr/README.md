# Evidence — Go Live QR · Entry deep-link

**Uncertainty removed:** Can a guest join from a printed QR in minutes?

| Case | Evidence |
|------|----------|
| Go Live renders QR | `/setup/golive` · `leos-entry-qr` → `/entry?token=…` |
| Entry pre-fills token | `ActivatedRoute` query `token` · banner “Token from QR” |
| Join still works | Existing `/entry/resolve` · heartbeat e2e |
| Floor Assist without guest browser | `/service` lists open assistance without `sessionId` |

Platform unchanged. Marketplace / Neo still Product-gated.
