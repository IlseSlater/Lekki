# Continuity — Open-tab Pay confidence sentence

**Status:** Shipped — evidence [continuity-open-tab-pay-confidence.md](../../evidence/continuity-open-tab-pay-confidence.md)  
**Platform Value:** On Bill, the guest knows in **one** calm sentence that nothing is taken until they confirm — without admin chrome or a second trust line.  
**Human question:** Can I trust this pay?  
**Pillar:** Confidence · Calm · Continuity  
**Surfaces:** Guest payment lead · Bill near gold Pay · Live Bill / pay phone  
**Not:** New pay product · tip redesign · claim/split wizard · Ready→Pay (shipped) · Leave · Setup · GAP-02/07 · Marketplace · Neo · new LEKs

---

## Intent

Ready→Pay answered **what to do next** when fulfilment is Ready.  
This unlock answers the Bill breath: **nothing moves until you confirm.**

## Uncertainty removed

- Lead + body both repeating the same trust paragraph  
- Live Bill/pay with totals but no confidence sentence  
- Scope copy that reads like a policy wall  

## Goals

| | |
|--|--|
| **User** | One sentence before Pay — charge only on confirm. |
| **System** | Same helper for Guest lead and Live. |
| **Emotional** | Luxury calm — not checkout legalese. |

## Composition

```text
┌ Place identity (shipped)
│ Purpose: Your bill
│ Lead: ONE payConfidenceSentence (only)
│ Body: scopes · tip · total · gold Pay
│ No second trust paragraph under the total
└ Live Bill / pay phone: same sentence under amount
```

### Sentence matrix (craft)

| State | Sentence |
|-------|----------|
| Open visit (default) | Nothing is charged until you confirm. |
| Mine or visit open | Pay your items or the visit — nothing until you confirm. |
| Equal share offered | Pay an equal share, your items, or the visit — nothing until you confirm. |
| Share settled · visit open | You’re settled — you can still cover the visit. |
| Share settled · visit clear | You’re all set for this visit. |

Gold Pay unchanged. One primary.

## Acceptance

1. Payment phase shows the confidence sentence **once** (lead, not duplicated under total)  
2. Live Bill tab and pay phone show the default confidence sentence when pay is open  
3. Unit proof for `payConfidenceSentence`  
4. Ready→Pay CTA labels untouched  
5. No new gold · no Lekki · Place Identity retained  

## Code seam

- `apps/web/src/app/studio/pay-confidence.ts`  
- `apps/web/src/app/pages/guest.page.ts`  
- `apps/web/src/app/leos/guest-shell-projection.component.ts`  
- `apps/web/src/app/leos/live-experience-panel.component.ts`  

## HOLD

GAP-02/07 · Setup · Marketplace · Neo · claim/split · tip product
