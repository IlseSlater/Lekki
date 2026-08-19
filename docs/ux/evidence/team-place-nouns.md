# Evidence — Team Experience Assignment place nouns

**Proof:** Studio Team assignment blurbs and permissions speak pack places — same Continuity as Operate / Guest.

**Date:** 2026-08-11  
**Pillar:** Continuity · Confidence · Hospitality

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Waiter blurb | Tables → Pickup / stands · Rooms · Zones · … via `staffExperiencesForType` |
| Permissions | View own / Clear {place} · View all / Clear {places} |
| Team page | Uses active experience `typeId` |

## HCI

1. Assigning café floor? — **Pickup / stands · serve · help** (not Tables)  
2. Hotel? — **Rooms · serve · help** · Clear room  
3. Restaurant unchanged — Tables · Clear table  

## Out of scope (HOLD)

Equal-split · Live Help/Leave · PaymentCapability · Marketplace · Neo

## Verify

1. Studio experience = Café → Team → Waiter blurb **Pickup / stands · serve · help**  
2. Permissions: View own pickup / stands · Clear pickup  
3. Hotel → Rooms · Clear room  
4. Restaurant → Tables  

## Architecture note

Reuse `getExperience` — no new roles or runtimes. Equal-split still HOLD.
