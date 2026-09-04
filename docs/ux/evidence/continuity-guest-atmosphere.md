# Continuity — Guest atmosphere (sweetgreen craft)

## Intent
Guest first viewport reads as concierge hospitality: place → Fraunces greeting → calm lead → food as hero — not Studio utility + pill place.

## Shipped
- `leos-experience-screen` hospitality mode: place hero, Fraunces purpose, open card field
- Guest: `placeSpoken` via `guestPlaceSpoken` (same form as Kitchen)
- Removed pill/meta context banner (place lives in header)
- Browse: calm category chips, quieter search, larger menu thumbs with soft lift
- Live lead: hosted prose (“we’ll let you know…”) instead of system “updates appear here”
- Warm Sand atmosphere field + reduced-motion safe rise/CTA motion

## Density Continuity (relook)
~2.5 rows at browse top was an HCI miss for 50+ catalogues. Browse now:
- Place as quiet Sora whisper (not tall Fraunces stack)
- Lead hidden on browse
- Search collapsed until tapped
- Thumbs ~4.25rem · 1-line desc · tighter row padding
- Sticky category chips for long scroll
Target: ≥4 full rows visible at scroll-top on phone.

## Refs
- Wireframe: `docs/ux/wireframes/guest/craft-mid-visit-atmosphere.md`
- Mobbin sweetgreen steal/leave (rewards/maps left out)

## Proof
`node --import tsx --test apps/web/src/app/studio/place-continuity.test.ts`
