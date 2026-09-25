# Evidence — Open-tab Pay confidence sentence

**Proof:** Bill answers “Can I trust this pay?” with one calm sentence — never duplicated under the total.

**Date:** 2026-09-22  
**Surfaces:** Guest payment lead · Live Bill tab · Live pay phone  
**Pillar:** Confidence · Calm · Continuity  
**Interaction:** [craft-open-tab-pay-confidence.md](../wireframes/guest/craft-open-tab-pay-confidence.md)

## Slice (shipped)

| Surface | Confidence |
|---------|------------|
| Guest Bill lead | `payConfidenceSentence` once |
| Bill body trust under total | Cleared (no double) |
| Live Bill tab | Default sentence when pay open |
| Live pay phone | Same under amount |

Ready→Pay CTA labels untouched.

## HCI

Nothing is charged until you confirm — one breath before gold Pay.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/pay-confidence.test.ts apps/web/src/app/studio/ready-pay-continuity.test.ts
```

1. Open Bill → one confidence lead · no second trust under total.  
2. Scope / settled states use the matrix sentences.  
3. Live Bill / pay phone show the default sentence when pay is open.  
4. Ready + balance still **Pay now** / **Settle when you’re ready.**

## Still HOLD

GAP-02/07 · Setup · Marketplace · Neo · claim/split · tip product
