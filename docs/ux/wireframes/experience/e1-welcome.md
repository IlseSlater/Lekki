# Experience · E1 Welcome (Discover)

**Layout grammar:** Experience Shell  
**Runtime:** Entry → Context  
**Pack:** labels only (venue / profile)

---

## Experience.Welcome.S1 — Available (QR resolved)

**Intent:** Confirm the guest is in the right place — no decisions.  
**User goal:** Feel welcomed and continue.  
**System goal:** Present venue + place from token resolve.  
**Uncertainty removed:** Am I in the right place?  
**Information shown:** Venue name · Pack/experience label · optional location line · Welcome · Continue.  
**Actions:** Continue (primary).  
**Navigation:** Continue → E2 Join.  
**Events:** none until Join/resolve commit (token already known).  
**Components:** Session Header · Context Banner · Bottom Action Bar.  
**Runtime ownership:** Entry · Context · Profile Engine.  
**Pack ownership:** venue branding strings.  
**Error / next:** Loading · Denied · Expired · Offline (see legacy guest/entry.md states).

```text
┌─────────────────────────────┐
│ Blue Door                   │
│ Restaurant · Waterfront     │
├─────────────────────────────┤
│ Welcome                     │
│                             │
│ [ Continue ]                │
└─────────────────────────────┘
```

**Production rule:** No venue picker. Token from QR only.

---

## Experience.Welcome.S2 — Missing token

**Intent:** Guest opened Experience without a QR.  
**User goal:** Know how to start.  
**System goal:** Do not show Studio or demo gallery.  
**Information shown:** Calm message — scan the QR at your place.  
**Actions:** none (or retry if deep-link broken).

```text
┌─────────────────────────────┐
│ Scan the QR at your place   │
│ to start this experience.   │
└─────────────────────────────┘
```
