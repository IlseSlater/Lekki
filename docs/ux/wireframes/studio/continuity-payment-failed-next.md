# Continuity — Payment failed · what do I do?

**Moment:** Owner sees a failed payment on Operate.  
**Human question:** What do I do now?  
**One primary:** Open that table in Floor monitor.  
**Secondary:** Got it — leave the board once I’ve acted (guest will retry).  
**Never:** Refund wizard · Claim-as-assistance · invent payment status theatre.

**Surfaces:** Studio Operate “Needs you” · Staff Floor embed  
**Pillars:** Confidence · Calm · Continuity  
**Builds on:** S-20 visibility (read-only) → this craft adds the next step only.

## Acceptance

```text
Given a payment-attention row on Operate
When it is the first Needs-you row
Then the gold primary is “Open table” (or place noun) — not Claim
And tapping it opens the Floor monitor focused on that session

Given I have spoken to the guest / they will retry
When I tap Got it
Then the row leaves the Needs-you board
And the payment status is unchanged (money truth intact — only operatorNotedAt)

Given a manager Claim row ranks first
When the board renders
Then gold Claim stays on that row — payment Open table is quiet text
```
