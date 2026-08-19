# Evidence — Continuity equal share

**Proof:** With two or more **distinct guests**, **Equal share** pays remaining ÷ unpaid people — calm third scope beside Mine · Visit. One person at the table never sees a split.

**Date:** 2026-08-11 · polish 2026-08-18  
**Pillar:** Continuity · Confidence · Calm · Hospitality

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Runtime | `scope: 'equal'` on `requestPayment` · amount = remaining ÷ unpaid **distinct** guests · last slot clears remainder · one equal pay per person |
| Join | `startOrResume` reuses the same participant on QR re-scan (id · identity · name) — no ghost seats |
| API | Payment request accepts `equal` + `participantId` · entry may send `participantId` to resume |
| Guest bill | Third calm tab **Equal share** when distinct guests ≥ 2 and visit open |
| Settle | Reuses social settle moment when visit still open after equal pay |

## HCI

1. Can I pay just my even share? — Equal share amount shown before confirm  
2. Did my equal share clear? — Equal · paid · settle moment if visit open  
3. Does rounding strand anyone? — Last unpaid slot pays remaining visit  
4. Am I paying for empty chairs? — Re-joining the same table does not mint extra people; R125 for one guest is the visit, not R25

## Still HOLD

Claim-from-table picker · Allocation Panel wizard · wallets · loyalty · Marketplace · Neo

## Verify

1. Two+ distinct guests · open visit → bill shows Visit · Mine · Equal share  
2. Guest A Pay Equal share → settle moment · visit remaining reduced by ~½ (or 1/N)  
3. Guest A cannot pay Equal again (tab Equal · paid)  
4. Last unpaid guest Equal → clears visit → receipt  
5. Single guest (including after several QR re-scans) → Equal share tab hidden · Visit = full remaining  
6. Five re-joins named the same · bill R125 → Equal hidden, not R25

## Architecture note

Reuses Payment.scope string + participantId — no new settlement model or wizard. Equal counts people, not join rows.
