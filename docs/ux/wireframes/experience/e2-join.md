# Experience · E2 Join

**Layout grammar:** Experience Shell  
**Runtime:** Experience  
**Pack:** terminology for participant

---

## Experience.Join.S1 — Name

**Intent:** Attach a human so the session can personalise.  
**User goal:** Say who I am.  
**System goal:** Capture display name before session start/resume.  
**Uncertainty removed:** Who am I here?  
**Information shown:** Prompt · name field · Continue.  
**Actions:** Edit name · Continue.  
**Navigation:** Continue → E3 Context (or resolve+start then E3).  
**Events:** `ParticipantJoined` (on commit).  
**Components:** Form Section · Bottom Action Bar.

```text
┌─────────────────────────────┐
│ What should we call you?    │
│ [ James____________ ]       │
│ [ Continue ]                │
└─────────────────────────────┘
```
