# Evidence — S-16 Feedback (Grow door)

**Proof:** Guest can leave one optional feeling on leave; Grow shows one sentiment sentence and at most one flagged comment in a sheet — not a review console.

**Date:** 2026-09-22  
**Surfaces:** Guest receipt → leave · Studio Grow (`/studio/grow`)  
**Pillar:** Confidence · Calm · Hospitality  
**Related:** [S-16-feedback.md](../stories/S-16-feedback.md) · [S-15 payouts door](grow-payouts-and-payment-attention.md) · GAP-11

## Slice (shipped)

| Surface | What it shows | What it deliberately doesn't |
|---|---|---|
| Guest leave (when `guestDesign.feedback`) | “How was it?” — lovely / something felt off · optional one sentence | Star ratings · category tabs · review threads |
| Grow breath delight line | Real feedback sentiment, or “Quiet night — no feedback yet.” | Fake “delighted” from wait heuristics when feedback exists |
| Grow → “How guests felt →” sheet | Same sentiment · at most one flagged quote · **Got it** | Review list · reply CRM · star breakdown |

**Storage:** reuses `AssistanceRequest` with `kind=feedback` — not a new CRM table. Floor Operate / Staff filter to `service` / `manager` only so feedback never looks like a help ticket.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/grow-feedback.test.ts
```

5/5 pass — quiet · delighted · mixed+flagged · encode/parse · no review-list shape.

## Still open

- Guest-visible owner reply (story left unresolved) — **Got it** only marks heard for the owner.
- S-17–19 remain L0 (email / invoice / promo pricing deps).
- Existing venues whose stored `guestDesignJson` omitted `feedback` must toggle Feedback on in Setup Experience once.
