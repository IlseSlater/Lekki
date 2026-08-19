# Guest · Receipt — States

**Layout grammar:** Guest  
**Runtime:** Capability (facts) · Experience (session)  
**Pack:** Restaurant

---

## Guest.Receipt.S1 — Paid

**Intent:** Confirm payment and show receipt facts.  
**User goal:** Keep proof; leave when ready.  
**System goal:** Show completed payment projection.  
**Information shown:** Paid banner · amount · Leave.  
**Actions:** Leave experience · optional Share (gap).  
**Navigation:** → Leave.  
**Events:** observe `PaymentCompleted`.  
**Components:** Confirmation Panel · Payment Summary · Bottom Action Bar.  
**Runtime ownership:** Capability · Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** missing receipt → S2.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  Payment complete         │
│  Receipt facts            │
├───────────────────────────┤
│ Leave experience          │
└───────────────────────────┘
```

---

## Guest.Receipt.S2 — Waiting confirmation

**Intent:** Return from gateway before ITN lands.  
**User goal:** Know confirmation is coming.  
**System goal:** Poll/observe payment status.  
**Information shown:** Waiting · Do not leave yet optional.  
**Actions:** Wait.  
**Navigation:** → S1 when complete · Payment.S3 on fail.  
**Events:** observe Complete/Failed.  
**Components:** Loading · Payment Summary.  
**Runtime ownership:** Capability.  
**Pack ownership:** Restaurant.  
**Error / next failure:** timeout → Assist.

---

## Guest.Receipt — Shared Bill Outstanding

**Intent:** Partial settlement still open.  
**User goal:** Know remaining balance.  
**System goal:** Show allocation remaining (future).  
**Information shown:** Outstanding · Pay remaining.  
**Actions:** Pay remaining.  
**Navigation:** → Payment.  
**Events:** observe payments.  
**Components:** Payment Summary · Allocation Panel · Bottom Action Bar.  
**Runtime ownership:** Capability.  
**Pack ownership:** Restaurant.  
**Error / next failure:** → Payment.S3.  
**Status:** Deferred until split bill UI.

---

## Guest.Receipt.S3 — Closed path / Thank You

**Intent:** Read-only goodbye when session already closing.  
**User goal:** Exit cleanly.  
**System goal:** No further pay.  
**Information shown:** Thanks · Done.  
**Actions:** Done → Entry.  
**Navigation:** Entry.  
**Events:** may already have `SessionCompleted`.  
**Components:** Confirmation Panel.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** N/A.
