# Evidence — Open-tab Place Identity

**Proof:** While a visit is open, Guest and Live speak the same venue + place without hunting.

**Date:** 2026-09-21  
**Surfaces:** Experience shell · Guest hospitality header · Live phone (shell + pay)  
**Pillar:** Continuity · Confidence · Calm  
**Interaction:** [craft-open-tab-place-identity.md](../wireframes/guest/craft-open-tab-place-identity.md)

## Slice (shipped)

| Surface | Identity |
|---------|----------|
| Experience shell (joined) | Venue mark/name · spoken place sticky · **no Lekki** |
| Guest sheet header | Spoken place sticky with phase purpose |
| Live shell projection | Venue · spoken place (`Table 12`) — not raw code |
| Live pay | Venue · spoken place when known |

## HCI

Guest always knows *whose table / tab this is*. Live matches Guest place truth (§3A).

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/place-continuity.test.ts
```

1. Studio Live phone focused on a place → spoken place matches Guest for that code.  
2. Guest joined → shell shows venue + place without scroll; Lekki mark gone.  
3. Pay Live mode → place line when place known.  
4. No second gold primary introduced.

## Still HOLD

Order-state calm · Pay confidence sentence · GAP-02/07 · Setup · Marketplace · Neo · claim/split
