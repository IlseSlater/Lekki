# Continuity — Mid-visit session resume

**Status:** Shipped — evidence [continuity-mid-visit-resume.md](../../evidence/continuity-mid-visit-resume.md)  
**Platform Value:** A guest who reopens the experience mid-visit knows they never left — without a second Join or a false Return.  
**Human question:** Am I still in?  
**Pillar:** Continuity · Confidence · Calm  
**Surfaces:** Guest splash → Experience banner (existing `message`) · Entry welcome only if that gate appears · reuse short splash beat  
**Not:** New screen · CRM resume-cart · Welcome Back product · Help ack pack · Leave reopen · Marketplace · Neo · Setup · Admin BI

---

## Intent

Return already answers **“Welcome back?”** after Leave.  
Join answers **“Did I get in?”** on first entry.  

This moment answers the **middle** breath: phone slept · tab closed · QR scanned again while the **same visit is still open** → **yes — you’re still in.**

## Uncertainty removed

- Mid-visit re-entry sounding like a brand-new Join (“You’re in — browse when you’re ready”)  
- Mid-visit re-entry sounding like post-Leave Return (“Welcome back…”) when the guest never finished  
- Silent restore with no confidence that cart / orders / place still belong to them  

## Goals

| | |
|--|--|
| **User** | Know the open visit continues — same place, same self. |
| **System** | Keep `participantId` resume; change greeting branch only. |
| **Emotional** | “I never left.” One calm breath. No second onboarding. |

## Detection (craft rule — no new model)

**Mid-visit resume** when all are true:

1. Device already had a persisted `sessionId` + `participantId` before this entry resolve  
2. Resolve resumes that participant into the **same open** session (not a fresh ghost join after Leave)  
3. Entry is not `?done=1` / post-Leave complete path  

Otherwise keep existing branches:

| Path | When |
|------|------|
| **Join** | First open of a visit · no resumable open session |
| **Return** | After Leave · new visit / true welcome-back (`visitCount` path) |
| **Still in** | This unlock |

## States (craft only — existing splash + banner)

### S1 — Mid-visit resume (primary)

| | |
|--|--|
| **Splash** | Short beat only (same timing as return splash — not first-run 5s) |
| **Banner** | **You’re still in** · with place when known: **You’re still in — {physicalContext} {code}.** · optional first name: **You’re still in, {first}.** |
| **Quiet lead (optional, same banner fade)** | Your visit is right where you left it. |
| **Primary** | None new — land on Live / current phase as today |
| **Query / flag** | Prefer a calm resume signal (e.g. `welcome=still` or internal resume flag) — **never** `welcome=back` for this path |

### S2 — True Return (unchanged)

| | |
|--|--|
| **Banner** | Existing Welcome back strings |
| **When** | After Leave · new arrival |

### S3 — First Join (unchanged)

| | |
|--|--|
| **Banner** | Existing You’re in — browse… strings |
| **When** | First entry to a visit |

### S4 — Entry welcome gate (only if shown)

If Entry `step === 'welcome'` appears on mid-visit restore (session already local):

| | |
|--|--|
| **Reassure** | **You’re still in** (not “Ready when you are” / not “You’re in” Join) |
| **Muted** | {venue} — pick up where you left off. *(or place line if no venue name)* |
| **Primary (gold)** | **Continue** |

## Exact calm strings

```text
Banner (place known):
  You’re still in — {physicalContext} {code}.

Banner (name, no place):
  You’re still in, {first}.

Banner (fallback):
  You’re still in.

Optional quiet line (same fade window as Join/Return ~4.5s):
  Your visit is right where you left it.

Entry welcome (mid-visit only):
  Title/reassure: You’re still in{, first}.
  Muted: {venue} — pick up where you left off.
  CTA: Continue
```

Do **not** use: Welcome back · Good to see you again · Browse when you’re ready · hang tight · resume cart / CRM language.

## Commands / events

| | |
|--|--|
| **Command** | Existing `resolveEntry` with `participantId` (already on `SessionStateService.entryBody`) |
| **Events** | Observe resumed same `sessionId` · existing live refresh |
| **Do not** | New session model · cart CRM · force Browse · stack Welcome back + Still in |

## Accessibility

- Banner: existing polite live region / `message` pattern  
- One greeting per tab entry — consume a **resume** flag once (mirror `consumeReturnGreeting` / `consumeJoinGreeting`; do not steal Return’s flag)  
- Splash shortened for mid-visit same as return (respect `prefers-reduced-motion`)

## Done when

1. Re-scan / reopen with open session + persisted participant → **You’re still in** (not Welcome back, not Join browse)  
2. After Leave → next scan still **Welcome back**  
3. First visit join still **You’re in**  
4. No new screens · evidence path restaurant + one other pack profile  

## HOLD

Help ack pack polish (“Is someone coming?”) · Cover-from-Leave · tip product · Marketplace · Neo · Setup · Admin BI · allocation wizard

## Code seam (for EO)

- `apps/web/src/app/pages/guest-splash.page.ts` — today `returning = isReturningGuest()` → `welcome: 'back'`; branch **still-in** when pre-resolve session/participant resumes open visit  
- `apps/web/src/app/pages/guest.page.ts` — `showWelcomeBack` / `showJoined`; add `showStillIn` + query/flag; do not call Welcome back on mid-visit  
- `apps/web/src/app/pages/entry.page.ts` — welcome step copy when restored open session (not post-Leave)  
- `apps/web/src/app/services/onboarding.service.ts` — once-per-tab resume greeting consume (parallel to return/join keys)  
- `apps/web/src/app/services/leos-api.service.ts` — `entryBody` / `participantId` already correct; do not invent vault/CRM  
