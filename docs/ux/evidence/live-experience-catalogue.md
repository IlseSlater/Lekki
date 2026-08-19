# Evidence — Live Experience sample catalogue (pack chips)

**Proof:** Studio Live browse chips and sample rows match the experience — not restaurant Food/Drinks leftovers.

**Date:** 2026-08-11  
**Pillar:** Continuity · Confidence · Live Experience is real  
**Follows:** [live-experience-fidelity.md](live-experience-fidelity.md) (dock nouns)

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Projection catalogue | Pack samples per type (café coffee · hotel room service · …) |
| Category chips | Registry experienceCategories (Coffee & treats · Room service · …) |
| Live panel | Passes `experienceTypeId` into shell projection |

Equal-split still HOLD. No Setup redesign.

## HCI

1. Designing a café? — Live shows Flat white · Coffee & treats (not Classic Burger · Food)  
2. Hotel? — In-room breakfast · Spa · Laundry  
3. Restaurant unchanged — Food · Drinks · burger  

## Verify

1. Studio Setup · Café → Live browse chips **Coffee & treats** · Flat white  
2. Hotel → **Room service** · In-room breakfast  
3. Restaurant → Food · Classic Burger  
4. Dock nouns still Board/Tab etc. from prior fidelity slice  

## Architecture note

Lite projection samples only — still not embedding `guest.page`. Continuity of nouns + browse feel.
