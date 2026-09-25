# Story: G-09 — Leave

| | |
|--|--|
| **Maturity** | **L4 Running** — production-path green for Restaurant |
| **Journey** | Experience — Leave confirm |
| **Spec** | [leave.md](../wireframes/guest/leave.md) (archaeology) · running: `guest.page.ts` `phase === 'leave'` |
| **Evidence** | [evidence/guest/leave/](../evidence/guest/leave/) · [continuity-leave-open.md](../evidence/continuity-leave-open.md) |

Leave confirm is reached from Receipt's primary action, not from the dock — there is no Leave tab. It warns on an open balance and never deletes state on its own.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — the last decision before the session closes |
| 2 | Any diner who has requested to leave |
| 3 | `POST /sessions/:id/close` · `composeLeaveOpenCopy` (existing) |
| 4 | Open-balance warning shown before close is possible, not after |
| 5 | Any Pack — close copy adapts to the Pack's terminology (see G-08) |

### Acceptance

```text
Given a guest has an open balance
When they reach Leave confirm
Then the remaining amount shows and the title asks a Pack-aware question
     ("All done here?" / "End your stay?" / "Leave this zone?" / "Ready to board?" / "Leave the bay?")
When they tap Stay
Then they return to Live with nothing closed
When they tap the primary action
Then the session closes and the physical context frees for the next guest
```

Leave never runs off a failed or cancelled PayFast callback (§1.1 invariant, `lifecycle-and-screen-map.md`) — payment failure does not force a close.

**Next slice:** None named — Pack terminology on receipt + close CTA shipped (`receipt-leave-terms.ts`); `leaveConfirmTitle` / `leaveLabelShort` / `leavePrompt` now also cover `board`, closing the last gap against table / zone / bay / stay / board.
