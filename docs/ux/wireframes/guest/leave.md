# Guest · Leave — States

**Layout grammar:** Guest  
**Runtime:** Experience  
**Pack:** Restaurant

---

## Guest.Leave.S1 — Confirm leave

**Intent:** End the visit deliberately.  
**User goal:** Free the table/context and go.  
**System goal:** `CompleteSession`; release Physical Context.  
**Information shown:** Confirm copy · Leave · Stay.  
**Actions:** Leave experience (primary) · Stay (nav back to Receipt/Menu).  
**Navigation:** Leave → S2 · Stay → Receipt/Menu.  
**Events:** pending `SessionCompleted`.  
**Components:** Confirmation Panel · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** close fails → Error + retry.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  Ready to leave?          │
├───────────────────────────┤
│ Stay | Leave experience   │
└───────────────────────────┘
```

---

## Guest.Leave.S2 — Context released

**Intent:** Confirm Physical Context is free.  
**User goal:** Know the visit is over.  
**System goal:** Session completed; Entry available for next guest.  
**Information shown:** Thanks · Context cleared · Done.  
**Actions:** Done.  
**Navigation:** → Entry (new visit).  
**Events:** `SessionCompleted`.  
**Components:** Confirmation Panel · Bottom Action Bar.  
**Runtime ownership:** Experience · Context.  
**Pack ownership:** Restaurant.  
**Error / next failure:** N/A.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  Thanks                   │
│  Context cleared          │
├───────────────────────────┤
│ Done                      │
└───────────────────────────┘
```
