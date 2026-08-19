# Evidence — Return HCI (Welcome back)

**When:** 2026-08-07  
**Story:** Continue building Lekki — Next Proof Return HCI

## Shipped

- Onboarding Continuity: `visitCount` · `lastVisitAt` · `lastVenueLabel` (local memory)
- **Leave** bumps `visitCount` and clears return-greeting session flag
- Returning guest (completed + visitCount ≥ 1): Splash → Experience with `?welcome=back`
- Entry welcome: “Welcome back, {Name}.” · Continue CTA
- Experience banner once per tab session: “Welcome back, {Name} — good to see you at {venue}.”

Not CRM · not loyalty tiers · not phone-account sync — device Continuity only.

## Prove
1. Complete onboarding → dine → **I’m finished** (Leave)  
2. Scan same QR again → Splash skips onboarding → “Welcome back…” on Experience  
3. Refresh Experience → banner does not repeat  

## HCI
Return / Complete → ✓ Welcome back (device memory)
