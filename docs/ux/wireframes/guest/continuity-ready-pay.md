# Continuity — Ready → Pay (next-step crispness)

**Status:** Shipped — evidence [continuity-ready-pay.md](../../evidence/continuity-ready-pay.md)  
**Platform Value:** When fulfilment is Ready and money remains, the guest knows the **one** next human action — without guessing, without “finish” conflation.  
**Human question:** What do I do now that it’s ready?  
**Pillar:** Continuity · Confidence · Calm  
**Surfaces:** Guest Live (orders) · primary gold CTA · lead / ready cue  
**Not:** New pay product · tip product · Leave redesign · allocation wizard · Marketplace · Neo · Setup

---

## Intent

Receive already answers **“Is it ready?”**  
This moment answers the **next** breath when a balance is still due: **settle now** — calmly, as one primary action.

## Uncertainty removed

- Ready cue vs Pay CTA competing as two different jobs  
- “Pay & finish” implying Leave / end visit before settle  
- Guest wondering whether to wait, collect, or pay first  

## Goals

| | |
|--|--|
| **User** | Know the next tap after Ready when money remains. |
| **System** | Keep Ready as fulfilment truth; gold primary = OpenPayment only. |
| **Emotional** | “It’s ready — settle when you’re ready.” One breath. |

## States (craft only — existing Live phase)

### S1 — Ready · balance due

| | |
|--|--|
| **Title** | Ready for you (or pack-equivalent calm title already in use) |
| **Ready cue** | Existing pack `readyHint` / orders ready banner — fulfilment only |
| **Lead** | **Settle when you’re ready.** only — fulfilment stays on orders ready banner (no double job) |
| **Primary (gold)** | **Pay now** (or pack-neutral settle noun — never “finish”) |
| **Secondary** | Help / Leave stay in dock — not competing primary |

### S2 — Ready · no balance due

| | |
|--|--|
| **Primary** | Existing **Finish** → receipt path (unchanged) |
| **Ready cue** | Fulfilment calm only |

### S3 — Not ready · balance due

| | |
|--|--|
| **Primary** | Existing **Pay when ready** (unchanged) |

## Commands / events

| | |
|--|--|
| **Command** | Soft navigate → existing Bill / Payment (same as today’s `openBill`) |
| **Events** | Observe fulfilment Ready · existing balance projection |
| **Do not** | New payment model · force Leave · auto-pay |

## Accessibility

- Ready banner / lead: `aria-live="polite"` (already pattern)  
- Primary names settle, not Leave  
- One `h1` / purpose: Ready; primary announces Pay  

## Done when

1. Ready + balance due → gold CTA does **not** say finish / leave / end  
2. Lead + ready cue do not fight the primary (one next step)  
3. Ready + cleared balance → Finish path unchanged  
4. Evidence: guest Ready→Pay path (restaurant + one pack)  

## HOLD

Leave-while-visit-open · mid-visit resume polish · Help ack copy pack · tip product · Setup · Admin BI

## Code seam (for EO)

`apps/web/src/app/pages/guest.page.ts` — live primary when `phase === 'live' && balanceDue`: today `isReady ? 'Pay & finish' : 'Pay when ready'`; `lead` when `isReady` only surfaces `readyHint`.
