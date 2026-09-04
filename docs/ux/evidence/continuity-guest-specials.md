# Continuity — Guest Specials page

## Intent
Studio can add or remove a Guest **Specials** surface (`guestDesign.specials`) — carousel of today’s specials + most-ordered menu items guests can order directly. Inspired by [sweetgreen Featured](https://mobbin.com/screens/9dc1fbb0-a7a4-4e92-b9ca-08dd16175c1d).

## Shipped
- Studio Setup → What they see → **Specials page** toggle
- Confidence: *Guests get a Specials tab for today’s picks.*
- Guest tab **Specials** when on; lands there once
- Horizontal specials carousel (+ add) · **Most ordered** list
- Specials rows leave the full Menu when the Specials page is on
- **Live Experience** projection: Specials tab + Today carousel + Most ordered (parity)
- Seed: Chef’s Bowl · Weekend Roast (`packs/restaurant` Specials category) — demo DB re-seeded

## Proof
`node --import tsx --test apps/web/src/app/studio/specials-continuity.test.ts`
