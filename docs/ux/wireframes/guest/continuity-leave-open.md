# Continuity — Leave while visit still open

**Status:** Interaction freeze — craft for EO (same session as Ready → Pay)  
**Platform Value:** A guest whose own path is done can leave without wondering whether others’ open balance traps them.  
**Human question:** Can I leave if others still owe?  
**Pillar:** Continuity · Confidence · Calm  
**Surfaces:** Existing Guest leave confirm (`phase === 'leave'`) · title · lead · optional visit-open line · primary  
**Not:** New screen · allocation wizard · Cover-the-visit from Leave · tip product · Ready → Pay reopen · Setup · Admin BI

---

## Intent

Leave confirm already answers **“Am I ending my session?”**  
This moment answers the **next** breath when the visit still has money open: **yes — you may leave; others can settle.**

## Uncertainty removed

- Fear that leaving is blocked while others still owe  
- Conflating **end my session** with **settle the whole visit**  
- Silent leave confirm that ignores `visitRemaining`

## Goals

| | |
|--|--|
| **User** | Know they can leave even if the visit remains open for others. |
| **System** | Same `CompleteSession` / leave path; surface visit-open truth calmly. |
| **Emotional** | “I’m finished — others can catch up.” One breath. |

## States (craft only — existing leave confirm)

### S1 — Leave · visit still open (`visitRemaining > 0`)

| | |
|--|--|
| **Title** | **You’re free to leave** |
| **Lead** | Others can still settle what’s left — your session ends here. |
| **Quiet line** | Visit still open: {amount} *(same calm pattern as social settle)* |
| **Primary (gold)** | **I’m finished** |
| **Secondary** | **Stay** (unchanged) |

### S2 — Leave · visit cleared

| | |
|--|--|
| **Title** | Existing pack `leaveConfirmTitle` (e.g. All done here?) |
| **Lead** | Stay if you still need anything. |
| **Quiet line** | None |
| **Primary (gold)** | **I’m finished** |
| **Secondary** | **Stay** |

## Commands / events

| | |
|--|--|
| **Command** | Existing leave / `CompleteSession` (no new model) |
| **Events** | Observe `visitRemaining` on leave confirm |
| **Do not** | Force settle · open bill from leave · allocation · new leave phase |

## Accessibility

- Title answers the human question when visit is open  
- Visit-open amount: `role="status"` / polite live region (match settle moment)  
- Primary remains session-end, not “pay for everyone”

## Done when

1. `visitRemaining > 0` on leave confirm → title/lead affirm leave is allowed; open amount shown; primary still **I’m finished**  
2. Visit cleared → existing leave title/lead/primary unchanged  
3. Evidence: leave-while-open path (restaurant + one pack)

## HOLD

Allocation wizard · new leave screens · Cover from Leave · tip product · Ready → Pay · mid-visit resume · Setup

## Code seam (for EO)

`apps/web/src/app/pages/guest.page.ts` — `phase === 'leave'`: `leaveConfirmTitle`, `lead` (`case 'leave'`), confirm body, primary **I’m finished**; branch on `(visitRemaining ?? 0) > 0.001` like `shareSettledMoment`.
