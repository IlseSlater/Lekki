# Evidence — Guest first impression

**Proof:** QR → Lekki splash → venue landing → Get started → menu is one owned walk.  
**Date:** 2026-09-21  
**Surfaces:** `/splash` · `phase === 'arrival'` · Studio Identity Live phone  
**Pillar:** Confidence · Continuity  
**Story:** [G-01-entry.md](../stories/G-01-entry.md)

## Uncertainty removed

*Am I in the right place?* — one screen after splash. Not “You’re in” plus landing.

## Slice

| Beat | Owner |
|------|--------|
| Splash 4s, tap skip, Lekki name | `guest-splash.page` · `GUEST_SPLASH_MAX_MS` |
| Join during splash | `resolveEntry` |
| Venue landing | `leos-venue-arrival` · `parseVenueArrival` |
| Same facts in Studio | Live Experience `mode === 'arrival'` |
| Get started → menu | `enterMenu` → `browse` · `preferSpecialsLanding` off |
| Return / still-in | Skip landing (`splashWelcomeQuery`) |

## HCI

| Axis | |
|------|--|
| CX | Place and venue on landing; Lekki gone; one gold-path CTA |
| DX | Decision in `guest-entry-gate` — no new runtime |
| OX | Unchanged |
| PX | Identity look still drives the phone |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/guest-entry-gate.test.ts apps/web/src/app/studio/venue-arrival.test.ts
```

1. First QR → splash → landing (no “You’re in” banner) → Get started → menu.
2. Studio Identity colour/logos match the guest landing.
3. Re-scan mid-visit → skip landing.

## Hold

Marketplace · Neo · extra Setup · E1 Continue → Join as a second wall.
