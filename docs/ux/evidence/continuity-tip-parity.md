# Evidence — Tip Continuity (Studio Tips → Guest Bill)

**Proof:** Guest Bill answers “Does this place take tips?” from the same Setup `tipStaff` truth Live already uses — no hardcoded tips-on.

**Date:** 2026-08-21  
**Surfaces:** Setup Payments (Tips) · Studio Live · Guest Bill  
**Pillar:** Continuity · Confidence · Calm  
**Contract:** [Blueprint § Example — Tip](../LEOS-Studio-Design-Blueprint.md) · No Drift Rule

## Slice (shipped)

| Human fact | Meaning |
|------------|---------|
| Tips off | Guest Bill shows no tip chips · no tip line · tip amount stays 0 |
| Tips on | Same calm tip moment on existing Bill |
| Live ↔ Guest | Both read `guestDesign.tipStaff` (Live panel · `resolveAllowTip` for Guest) |
| Pack defaults | Festival / airport / healthcare demo tokens default tips off without workspace override |

## HCI

Owner toggles Tips in Setup Payments. Guest checkout matches Live in one breath. No new tip product surface.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/tip-continuity.test.ts
```

1. Restaurant workspace · Tips off → Guest Bill has no Service / Tip chips.
2. Tips on → tip chips return; Live still shows “Add a tip” when Tips on.
3. `qr-demo-festival` with no workspace → tips off (pack default).
4. Pay with Tips off → `tipAmount` is 0.

## Still HOLD

Loyalty · wallets · allocation wizard · Marketplace · Neo · Setup redesign · Admin BI · tip as a new product · server-published guestDesign for cross-device (same-origin Studio workspace + pack defaults). First paint defaults tips off until resolve.
