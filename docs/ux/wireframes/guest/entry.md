# Guest · Entry — States

**Layout grammar:** Guest  
**Runtime (default):** Entry → Context  
**Pack:** Restaurant (labels/branding only)

---

## Guest.Entry.S1 — Available

**Intent:** Offer a trusted way in when entry is possible.  
**User goal:** Start the visit.  
**System goal:** Capture token + identity hint before resolve.  
**Information shown:** Header · profile/venue cards · name field · Continue.  
**Actions:** Select profile card · Edit name · Continue (primary) · Cancel (nav).  
**Navigation:** Continue → Join loading path · Cancel → leave app.  
**Events:** none until Continue.  
**Components:** Session Header · Selection Card · Form Section · Bottom Action Bar · Neo Dock.  
**Runtime ownership:** Entry (token) · Profile Engine (card labels).  
**Pack ownership:** Restaurant.  
**Error / next failure:** → S2 then S4/S5 on failure.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Context Banner            │
├───────────────────────────┤
│ Main                      │
│  [Card] [Card]            │
│  [Name]                   │
├───────────────────────────┤
│ Continue                  │
└───────────────────────────┘
```

---

## Guest.Entry.S2 — Loading

**Intent:** Show resolve in progress; block double-submit.  
**User goal:** Wait for admission.  
**System goal:** Run `ResolveEntry` / context resolve.  
**Information shown:** Header · loading indicator · disabled primary.  
**Actions:** none (optional Cancel if safe).  
**Navigation:** success → Join · fail → S4/S5/S3.  
**Events:** pending `ExperienceStarted`, `ExperienceContextResolved`.  
**Components:** Session Header · Bottom Action Bar (disabled) · Empty/Loading surface.  
**Runtime ownership:** Entry · Context.  
**Pack ownership:** none for chrome.  
**Error / next failure:** S4 Denied · S5 Expired · S3 Offline.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  [ Loading ]              │
├───────────────────────────┤
│ Continue (disabled)       │
└───────────────────────────┘
```

---

## Guest.Entry.S3 — Offline

**Intent:** Never lose Intent when network is down.  
**User goal:** Know they can retry without re-entering everything.  
**System goal:** Preserve form + queue retry.  
**Information shown:** Offline banner · preserved cards/name · Retry.  
**Actions:** Retry when online · Edit fields.  
**Navigation:** stay Entry.  
**Events:** none until online resolve.  
**Components:** Context Banner · Offline Banner · Form Section · Bottom Action Bar.  
**Runtime ownership:** Entry (client) · Experience queue patterns.  
**Pack ownership:** Restaurant copy.  
**Error / next failure:** remain Offline until network returns.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Offline banner            │
├───────────────────────────┤
│ Main (preserved)          │
├───────────────────────────┤
│ Retry                     │
└───────────────────────────┘
```

---

## Guest.Entry.S4 — Permission / Denied

**Intent:** Refuse entry honestly (venue closed, blocked token policy).  
**User goal:** Understand they cannot enter; leave or get help.  
**System goal:** Do not create a Session.  
**Information shown:** Denied message · Leave.  
**Actions:** Leave · optional Help.  
**Navigation:** Leave → exit.  
**Events:** none (or audit-only; not Session events).  
**Components:** Context Banner · Error Surface · Bottom Action Bar.  
**Runtime ownership:** Entry · Context.  
**Pack ownership:** Restaurant (closed copy).  
**Error / next failure:** N/A — terminal for this attempt.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Denied banner             │
├───────────────────────────┤
│ Main                      │
│  [ Cannot enter ]         │
├───────────────────────────┤
│ Leave                     │
└───────────────────────────┘
```

---

## Guest.Entry.S5 — Expired

**Intent:** Explain QR/token expiry; allow Start fresh.  
**User goal:** Recover with a new scan/token.  
**System goal:** Clear stale token; no Session.  
**Information shown:** Expired message · Start fresh.  
**Actions:** Start fresh · optional re-scan gesture.  
**Navigation:** → S1 Available.  
**Events:** none.  
**Components:** Error Surface · Bottom Action Bar.  
**Runtime ownership:** Entry.  
**Pack ownership:** Restaurant.  
**Error / next failure:** → S4 if new token also invalid.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Expired banner            │
├───────────────────────────┤
│ Main                      │
│  [ Token expired ]        │
├───────────────────────────┤
│ Start fresh               │
└───────────────────────────┘
```

---

## Guest.Entry — Already Joined (S5b / resume)

**Intent:** Returning device already has a live Session.  
**User goal:** Resume without re-scanning.  
**System goal:** Reconnect websocket; skip new Entry resolve if session valid.  
**Information shown:** “Session active” · Continue to Menu · Start fresh.  
**Actions:** Continue · Start fresh.  
**Navigation:** Continue → Menu · Start fresh → clear → S1.  
**Events:** reconnect projections (no new domain event required).  
**Components:** Confirmation Panel · Bottom Action Bar.  
**Runtime ownership:** Experience (resume).  
**Pack ownership:** none.  
**Error / next failure:** stale session → S5 Expired path / clear.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  [ Session active ]       │
├───────────────────────────┤
│ Continue | Start fresh    │
└───────────────────────────┘
```
