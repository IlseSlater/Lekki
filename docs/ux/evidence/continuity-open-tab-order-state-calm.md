# Evidence — Open-tab Order-state calm

**Proof:** Cart and live orders feel like a living tab — not a Guest status dashboard.

**Date:** 2026-09-21  
**Surfaces:** Guest Orders · Browse draft whisper · Live Orders tab  
**Pillar:** Calm · Confidence · Continuity  
**Interaction:** [craft-open-tab-order-state-calm.md](../wireframes/guest/craft-open-tab-order-state-calm.md)

## Slice (shipped)

| Before | After |
|--------|--------|
| Gold Active/History pills | Quiet ink **Now / Earlier** only when history exists |
| Four-dot status legend | Removed |
| Status chip on every line | Spoken status once · lines are labels × qty |
| Order · shortId hero | Time + spoken status |
| Live status beside sample line | Spoken status below sample |

## Acceptance (UX Lead checklist)

- [x] Cart reads as calm draft review  
- [x] Orders answers “what’s happening now?” with one prose line (`progressGuidance` / lead)  
- [x] No status-legend strip on Guest Orders  
- [x] No Active/History competing in first breath (Now/Earlier only when history exists · ink, not gold)  
- [x] No default order+line chip stack  
- [x] One gold primary per moment  
- [x] Live Orders meaning matches Guest  
- [x] Place Identity still present; no Lekki after join  
- [x] Pay confidence sentence untouched  
- [x] Evidence walk: Studio Live → Guest cart/Orders  

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/order-state-calm.test.ts
```

1. Guest Orders — no gold filter · no legend · spoken status.  
2. Cart chip still opens Your order · Place remains gold on Cart.  
3. Browse with draft — quiet “N items in Your order” lead.  
4. Live Orders tab — spoken status, no chip wall.  
5. Live phase lead carries `timelineGuidance` once (not duplicated under the list).

## Still HOLD

Pay confidence sentence · GAP-02/07 · Setup · Marketplace · Neo · claim/split
