# Evidence — Setup step ↔ Live Experience reflection

**Date:** 2026-08-25  
**Surfaces:** Setup Engine steps · Live Experience phone  
**Pillar:** Continuity · Confidence  

## Mode map

| Step | Route | Phone mode | Reflects |
|------|-------|------------|----------|
| Create | `/studio/create` | shell | Type defaults via `startExperience` → `touchLive` |
| Who you are | `/studio/setup/identity` | **arrival** | Venue · logo · colour (CTA) · location · place fallback |
| What guests experience | `/studio/setup/experience` | **shell** | `guestDesign` tabs/categories/actions |
| Where guests join | `/studio/setup/places` | **arrival** | Focused place + venue identity |
| How guests pay | `/studio/setup/payments` | **pay** | Card / Apple / Google · tip · split · pay-at-place |
| Go Live | `/studio/setup/golive` | **shell** + public | Same shell · “Live · guests can join” |

Autosave path: step `upsertActive` / `setLive*` → `touchLive` → panel `hydrate` + pulse.

## Gap found & fixed (2026-08-25)

| Issue | Fix |
|-------|-----|
| Live arrival ≠ Guest Entry | Arrival now mirrors Entry: eyebrow · place · You’re in · muted · Browse CTA |
| “Table Table 1” | Uses `guestPlaceSpoken` (same as Guest/staff continuity) |
| Extra Studio-only chrome | Dropped stacked venue h1 / location / logo from arrival |

## Parity check

| Fact | Article configures | Live |
|------|--------------------|------|
| Venue name | Identity | Arrival eyebrow (morph) |
| Place | Places | Large place line · spoken once |
| Design toggles | Experience | Shell projection |
| Pay methods | Payments | Pay mode |
| Public live | Go Live | Shell + desk cue |

## Known HOLD (not this slice)

- Full `guest.page` embed in phone  
- Cart qty / required-choice depth already covered by projection parity evidence  
- Server-published guestDesign across devices  

## Verify

1. Identity: type name → phone venue morphs; add logo → mark appears; location → line under name.  
2. Experience: toggle Drinks off → Drinks leave Live Menu.  
3. Places: select a table → arrival place line updates.  
4. Payments: toggle Apple Pay off → pay list updates.  
5. Go Live: shell + “Live · guests can join”.
