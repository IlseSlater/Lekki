# Guest · Join — States

**Layout grammar:** Guest  
**Runtime (default):** Experience  
**Pack:** Restaurant (terminology)

---

## Guest.Join.S1 — Empty

**Intent:** Collect participant identity before joining.  
**User goal:** Tell the session who they are.  
**System goal:** Prepare `JoinSession` payload.  
**Information shown:** Welcome · empty name field · Continue disabled or soft.  
**Actions:** Focus name · Continue (disabled until valid).  
**Navigation:** Back → Entry.  
**Events:** none.  
**Components:** Session Header · Form Section · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** → S4 Invalid.

```text
┌───────────────────────────┐
│ Header  Welcome           │
├───────────────────────────┤
│ Main                      │
│  [ Name ______ ]          │
├───────────────────────────┤
│ Continue (disabled)       │
└───────────────────────────┘
```

---

## Guest.Join.S2 — Typing

**Intent:** Reflect in-progress input.  
**User goal:** Enter name (and optional fields).  
**System goal:** Validate locally.  
**Information shown:** Partial name · helper text.  
**Actions:** Type · Clear · Continue when valid.  
**Navigation:** Back → Entry.  
**Events:** none.  
**Components:** Form Section · Bottom Action Bar.  
**Runtime ownership:** Experience (client).  
**Pack ownership:** Restaurant.  
**Error / next failure:** → S4.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  [ Name Ilse| ]           │
├───────────────────────────┤
│ Continue                  │
└───────────────────────────┘
```

---

## Guest.Join.S3 — Returning

**Intent:** Recognise returning participant on same device/session.  
**User goal:** Skip re-typing when safe.  
**System goal:** Prefill display name from prior participant.  
**Information shown:** Prefill name · Continue.  
**Actions:** Continue · Edit name · Start fresh.  
**Navigation:** Continue → S5 Joined → Menu.  
**Events:** `ParticipantJoined` on confirm if not already joined.  
**Components:** Session Header · Form Section · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** → S4 / Offline.

```text
┌───────────────────────────┐
│ Header  Welcome back      │
├───────────────────────────┤
│ Main                      │
│  [ Name prefilled ]       │
├───────────────────────────┤
│ Continue                  │
└───────────────────────────┘
```

---

## Guest.Join.S4 — Invalid

**Intent:** Show validation failure without losing typed Intent.  
**User goal:** Fix input.  
**System goal:** Reject bad join; keep Session if already created by Entry.  
**Information shown:** Error on field · preserved value.  
**Actions:** Edit · Retry Continue.  
**Navigation:** stay Join.  
**Events:** none.  
**Components:** Error Surface · Form Section · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** remain until valid.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  [ Name ]                 │
│  ! Enter a name           │
├───────────────────────────┤
│ Continue                  │
└───────────────────────────┘
```

---

## Guest.Join.S5 — Joined

**Intent:** Confirm participant is on the Session; move forward.  
**User goal:** Get to the menu.  
**System goal:** Emit join; open browse.  
**Information shown:** Success flash · auto-advance.  
**Actions:** none required (auto) · optional Continue.  
**Navigation:** → Menu.S1/S3.  
**Events:** `ParticipantJoined`.  
**Components:** Confirmation Panel · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** if emit fails → S4 / Offline.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main                      │
│  [ You're in ]            │
├───────────────────────────┤
│ Continue to menu          │
└───────────────────────────┘
```

---

## Guest.Join — Already In Session

**Intent:** Join already completed; avoid duplicate join.  
**User goal:** Go to Menu.  
**System goal:** Idempotent join.  
**Information shown:** Already joined · Go to menu.  
**Actions:** Go to menu.  
**Navigation:** → Menu.  
**Events:** none new.  
**Components:** Confirmation Panel · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** none.  
**Error / next failure:** stale → Entry resume/clear.

---

## Guest.Join — Offline

**Intent:** Preserve join Intent offline.  
**User goal:** Know join will sync.  
**System goal:** Queue `JoinSession` if Session id exists.  
**Information shown:** Offline banner · Retry.  
**Actions:** Retry.  
**Navigation:** stay.  
**Events:** deferred.  
**Components:** Offline Banner · Bottom Action Bar.  
**Runtime ownership:** Experience.  
**Pack ownership:** Restaurant.  
**Error / next failure:** remain Offline.
