# Evidence — Pay Continuity (Studio Pay → Guest Bill / dock)

**Proof:** Guest answers “Can I pay here?” from the same Setup `payAtTable` truth Live already uses — no hardcoded Bill-on.

**Date:** 2026-08-21  
**Surfaces:** Setup Experience (Pay) · Studio Live · Guest dock / Bill / Live Pay CTA  
**Pillar:** Continuity · Confidence · Calm  
**Contract:** Blueprint Studio→Live→Guest · No Drift Rule

## Slice (shipped)

| Human fact | Meaning |
|------------|---------|
| Pay off | Guest dock hides Bill · no Pay primary · payment phase unreachable |
| Pay on | Bill tab + settle as today |
| Live ↔ Guest | Both honour `guestDesign.payAtTable` (Live dock · `resolveAllowPay` for Guest) |
| Pack defaults | Hotel / healthcare demo tokens default Pay off without workspace override |

## HCI

Owner toggles Pay in Setup Experience. Guest dock matches Live in one breath. No new payment product.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/pay-continuity.test.ts
```

1. Restaurant workspace · Pay off → Guest has no Bill tab · Ready shows Finish not Pay.  
2. Pay on → Bill returns; Live phone Bill tab returns.  
3. `qr-demo-hotel` with no workspace → Pay off (pack default).

## Still HOLD

Split Continuity · Call Staff Continuity · Marketplace · Neo · Setup redesign · allocation wizard · cross-device guestDesign publish.
