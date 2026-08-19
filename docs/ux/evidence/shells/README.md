# Evidence — Experience × Studio shells

**Proof:** Guest/Experience never shows Studio chrome; Studio ends in Live achievement.

## Checks

1. Open `/entry?token=qr-demo-restaurant` — header is **LEOS** only (no Setup / Operate / Studio nav).
2. Complete Welcome → Join → Context → `/experience` — still no Studio chrome.
3. Open `/studio` — dark **LEOS Studio** chrome; Home · Guided · Go Live · Operate · Payments.
4. Guided: Welcome → Choose → Configure → Payments → Generate QR → **Your experience is live.**
5. From Live: **Open Experience** lands on Experience Entry without Studio nav.
6. `/setup/*` redirects to `/studio/*`.
7. Demo gallery only at `/entry?demo=1` or Studio **Try Experience**.

## Routes

| Shell | Paths |
|-------|-------|
| Experience | `/entry`, `/e/:token`, `/experience`, `/guest` (alias) |
| Studio | `/studio/*` |

Demo is engineering — not the Guest product.
