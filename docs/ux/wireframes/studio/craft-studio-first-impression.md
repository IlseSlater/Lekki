# Continuity — Studio first impression

**Status:** Shipped — evidence [continuity-studio-first-impression.md](../../evidence/continuity-studio-first-impression.md)  
**Platform Value:** Owner’s first three screens (sign-in → welcome → create) feel like one calm register — halo + settle from the frozen motion system, not a redesign.  
**Human questions:** Sign-in: Can I get in? · Welcome: Am I remembered / what’s next? · Create: What am I creating?  
**Pillar:** Confidence · Calm · Continuity  
**Surfaces:** `studio-signin` · `studio-welcome` · `studio-create`  
**Not:** Setup Engine redesign · new motion ADR · Marketplace · Neo · GAP-02/07 · Guest open-tab (shipped) · marketing first-impression (shipped)

---

## Intent

Marketing first-impression fixed the public door.  
This unlock fixes the **Studio door** — same frozen halo / settle / stagger, applied where Welcome and Create currently skip them.

## Uncertainty removed

- Welcome peak (“Good morning. Blue Door is live.”) as one flat block  
- First-time Welcome with no sense of start (no halo)  
- Sign-in success hard-cutting away with no settle  
- Demo email prefilled undercutting premium  
- Create confidence waiting → ready without settle remount  

## Craft (inside frozen tokens)

| Screen | Change |
|--------|--------|
| Welcome (returning) | Ash `leos-register-halo` on peak card · stagger greeting → venue → readiness → list (existing delay classes) |
| Welcome (first-time) | Halo on start card · appear settle |
| Sign-in | Empty email · settle 360ms before navigate |
| Create | Confidence remounts on select so `ci-settle` runs |

## Acceptance

1. Welcome returning reveals greeting → venue → ready in stagger  
2. Welcome (both) uses register halo once (not looping)  
3. Sign-in fields empty of demo address; success settles before route change  
4. Create “Looks good” settles when a type is chosen  
5. No new motion tokens / ADR · Setup Engine frozen  

## Code seam

- `studio-welcome.page.ts`  
- `studio-signin.page.ts`  
- `studio-create.page.ts`  
- optionally `studio.css` delay-3  

## HOLD

Setup step redesign · Live phone on Welcome · Marketplace · Neo
