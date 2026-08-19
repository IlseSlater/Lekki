# Evidence — Claim-from-table (See → Claim → Confirm)

**Proof:** Guest claims without understanding allocation — tap **Claim** on the bill, item is yours, pay Mine.  
**Date:** 2026-08-12 (HCI polish)  
**Pillar:** Continuity · Minimum Decisions · LEK-040

## Flow

```text
Pay → Visit tab (when others’ items exist)
  → see line + Claim
  → tap Claim → ✓ Yours + 4s Undo toast + Mine badge pulse
  → Mine tab updates → Pay
```

No picker screen · no checklist · no wizard · no auto-navigation to Mine.

## HCI enhancements

| Friction | Enhancement |
|----------|-------------|
| Accidental tap | 4s inline Undo toast on Visit tab |
| Double-claim at table | `LinesClaimed` socket → “Claimed by [Name]” chip; Claim fades |
| “Where did it go?” | Line stays on Visit with ✓ Yours flash; Mine scope tab pulses (220ms) |

## Layers

| Layer | Change |
|-------|--------|
| Runtime | `POST /sessions/:id/claim-lines` returns `undo`; emits `LinesClaimed`; supports null participantId (unassign on Undo) |
| Bill | Ownership chips · ✓ Yours · Mine scope pulse |
| Guest | Undo toast · live refresh on `LinesClaimed` |

## Success test

Can a guest claim an item without having to understand how allocation works? **Yes** — one word, one tap, with immediate undo and live attribution.

## Explicitly not

Allocation wizard · % splits · wallets · new Payment.scope
