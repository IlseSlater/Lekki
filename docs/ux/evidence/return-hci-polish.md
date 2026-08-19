# Evidence — Return HCI polish (one calm moment)

**When:** 2026-08-11  
**Story:** Continue building Lekki — deepen Return HCI after pack chrome  
**Baseline:** [return-hci-welcome-back.md](return-hci-welcome-back.md)

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Leave | Ends at **Visit complete** (`/entry?done=1`) — no auto re-open / Welcome back |
| Splash | Returning guests: **~1.4s** beat (not 5s first-run wait); reduced-motion skips |
| Greeting | `lastVenueLabel` fallback; Entry welcome ≠ stacked Experience banner |
| Done CTA | **Scan to return** — Return only on a later scan |

Not CRM · not loyalty · not resume cart (HOLD).

## Prove

1. Dine → **I’m finished** → “You’re finished” / Visit complete — **no** Welcome back  
2. Scan same QR → short splash → one “Welcome back, {Name}… at {venue}”  
3. Refresh Experience → banner does not repeat  
4. First-time splash still ~5s  

## HCI

| Moment | Confidence |
|--------|------------|
| Complete | Am I finished? — calm end, not immediately welcomed back |
| Return | Welcome back? — one moment after a real new scan |
| Calm | Not the same first-run wait |

## Architecture note

Device Continuity only (`visitCount` / local memory). No Platform change.
