# Story: G-08 — Receipt

| | |
|--|--|
| **Maturity** | **L4 Running** |
| **Journey** | Experience — Receipt |
| **Spec** | [receipt.md](../wireframes/guest/receipt.md) (archaeology) · running: `guest.page.ts` `phase === 'receipt'` |
| **Evidence** | [evidence/guest/leave/](../evidence/guest/leave/) — shared with G-09, "Is the experience complete?" |

Receipt is the finished-visit moment: thanks, what was paid (or a prompt to settle with the team), and one action into Leave. It is not a dock tab.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — the visit is over, before Leave |
| 2 | Any diner who has finished ordering / paying |
| 3 | `receiptPaidTotal` · Pack-aware `receiptTitle` / `leavePrompt` / `leaveCta` copy (`receipt-leave-terms.ts`) |
| 4 | One primary action (leave CTA), not competing choices |
| 5 | Any Pack — copy adapts via `terms.term('close', 'leave')` (table / zone / bay / stay / board) |

### Acceptance

```text
Given a guest reaches Receipt
When they have paid
Then the paid total shows
When they have not paid
Then "Settle with the team before you go" shows instead
Given the venue's Pack sets a different close term (zone / bay / stay / board)
When Receipt renders
Then the leave prompt uses that Pack's language, not a hardcoded "table"
And the Receipt title also reads that Pack's language
     ("Your stay is complete" for Hotel, not always "You're finished")
When the guest taps the primary action
Then they move to Leave confirm (G-09), not straight out
```

**Next slice:** None named — Pack terminology on receipt shipped (`receipt-leave-terms.ts`); Receipt title, paid line, and leave prompt all read the venue's own close term.
