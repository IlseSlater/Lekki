# Evidence — Teardown Waves 1–3

**When:** 2026-09-02
**Runtime:** http://localhost:3000
**Web:** http://localhost:4200

## Summary

| Wave | Pass | Fail |
|------|------|------|
| Wave 1 | 8 | 0 |
| Wave 2 | 6 | 0 |
| Wave 3 | 6 | 0 |

**Overall:** 20/20 passed

## Wave 1

- ✓ **guest-complete-blocked** — Guest cannot POST /payments/:id/complete
- ✓ **server-price** — Server reprices catalogue — client unitPrice ignored
- ✓ **participant-leave** — Leave one guest does not close shared session
- ✓ **decimal-migration** — Prisma baseline migration + Decimal money columns
- ✓ **mint-qr** — Go Live mint returns token ≠ qr-demo-restaurant
- ✓ **marketing-meta** — Marketing head has description + OG tags
- ✓ **robots-sitemap** — /robots.txt and /sitemap.xml exist
- ✓ **studio-team-guard** — Unsigned /studio/team redirects to sign-in

## Wave 2

- ✓ **guest-design-pay** — guestDesign.payAtTable=false returned on entry resolve
- ✓ **payfast-passphrase** — PayFast activate without passphrase is refused
- ✓ **kitchen-notes** — Special request on transaction reaches fulfilment line
- ✓ **dual-order-pay** — Two orders: requestPayment amount matches visit total
- ✓ **menu-first-entry** — First-time scan shows menu — no OTP / birthday wall
- ✓ **pay-off-ui** — Guest UI hides Bill tab when payAtTable is off

## Wave 3

- ✓ **live-venue-catalogue** — Studio Live phone shows venue catalogue item (not only Classic Burger)
- ✓ **tab-bar-calm** — Guest tab bar has ≤4 tabs and no Leave tab
- ✓ **table-people** — Second guest sees join notice / people strip
- ✓ **honest-receipt** — No •••• 4242 row; unpaid receipt says settle with team
- ✓ **muted-contrast** — Muted body text ≥ 4.5:1 on warm sand
- ✓ **reduced-motion** — Global reduced-motion guard present in guest styles

## Screenshots

See `screenshots/` in this folder.
