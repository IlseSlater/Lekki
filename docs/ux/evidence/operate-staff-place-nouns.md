# Evidence — Operate craft deepen (staff place + help nouns)

**Proof:** Staff floor and Studio Operate speak the same place / help language as the guest path.

**Date:** 2026-08-11  
**Pillar:** Hospitality · Confidence · Calm · Continuity (Guest ↔ Staff ↔ Studio)

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Staff service | Place nouns from `getExperience` — Rooms / Pickup / Zones / Gates / Bays (not always Tables) |
| Help cards | `guestServiceAssistCopy` — Ask the counter / Ask reception / Ask crew / Ask gate service |
| Sticky / calm / clear | Same place noun throughout |
| Studio Operate | Floor pulse blurb · help row · escalations · guest activity · prep “making” for café |

## HCI

1. Am I looking at the right places? — Café Pickup / Hotel Rooms (not Tables)  
2. Does help match the guest? — Ask the counter ↔ guest Ask the counter  
3. One glance on Operate? — which rooms / pickups need you  

## Out of scope (HOLD)

Equal-split · floor map redesign · Setup · Marketplace · Neo

## Verify

1. Studio experience = Café → `/staff/service` segment **Pickup / stands** · help **Ask the counter**  
2. Hotel → **Rooms** · **Ask reception**  
3. Restaurant → **Tables** · **Request Waiter** (unchanged)  
4. Studio Operate Floor pulse uses place nouns  

## Architecture note

Reuse `getExperience` + `guestServiceAssistCopy` — no new runtimes or Continuity payment model.
