# Evidence — First-time owner → live QR walk

**Proof:** A new business can enter Studio, configure beside Live Experience, Go Live, and open the guest entry — same grammar they shaped.  
**Date:** 2026-08-11  
**Method:** Playwright walk (`docs/ux/evidence/_walk-owner-qr.cjs`) against `http://localhost:4200`  
**Pillar:** Confidence · Continuity · [Blueprint §3A](../LEOS-Studio-Design-Blueprint.md#section-3a--studio--live-experience--guest-interaction-contract)  
**Roadmap step:** Evidence walk (after Shell · Live · Setup visual pass)

## Result

**24 / 25 assertions passed** on first automated walk.  
**1 Continuity-safe gap found and fixed** before board flip.

| Area | Result |
|------|--------|
| Welcome purpose + Continue | Pass |
| Choose + Live beside + Looks good | Pass |
| LEKKI top bar · Live on Identity | Pass |
| Venue → Live arrival (Welcome · Blue Door Evidence) | Pass |
| Experience / Places / Payments Looks good | Pass |
| Places Live “You’re joining” | Pass |
| Go Live human checklist (not Identity/Experience nouns) | Pass |
| Go Live Live state | Pass |
| Open Experience href | **Fail → fixed** |

## Fix shipped

Go Live set `entryUrl` only after async `resolvePublicWebOrigin()`, so **Open Experience** could render with an empty `href` for a beat (or longer if LAN lookup stalled).

**Now:** sync fallback uses `window.location.origin` immediately; LAN origin still upgrades when ready.

`setup-golive-engine.page.ts`

## Explicitly not

- Claim-from-table · Marketplace · Neo · Setup redesign · Admin BI  
- Embedding full `guest.page` in Live phone  

## Re-run

```text
# requires Playwright + Chrome channel
cd <dir-with-playwright>
node path/to/_walk-owner-qr.cjs
```

Artifacts land in `%TEMP%/lekki-evidence-walk` (`report.json` · step screenshots).

## HCI

Owner never wonders whether Open Experience / QR is ready — the link exists as soon as Go Live opens.
