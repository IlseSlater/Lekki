# Continuity — Open-tab Place Identity

**Status:** Shipped — evidence [continuity-open-tab-place-identity.md](../../evidence/continuity-open-tab-place-identity.md)  
**Platform Value:** Seated guest always knows *whose table / tab this is* without hunting; Live shows the same place truth (not a fake preview).  
**Human question:** Whose table / tab is this?  
**Pillar:** Continuity · Confidence · Calm  
**Surfaces:** Experience shell chrome · Guest hospitality header · Live phone (Guest shell projection + pay)  
**Not:** Setup · GAP-02/07 · claim/split · Marketplace · Neo · Lekki brand after splash · new LEKs · order-density · Pay copy rewrite

---

## Intent

Mid-visit resume already answers **“Am I still in?”**  
This unlock answers the **open visit** breath: at every Menu / Orders / Bill / Help moment — **yes, this is Table 12 · this venue.**

## Uncertainty removed

- Hunting for place after scroll  
- Live phone showing a raw code while Guest says “Table 12”  
- Lekki mark/name lingering on joined Guest chrome  
- Pay Live phone with venue only and no place  

## Goals

| | |
|--|--|
| **User** | Know venue + spoken place at a glance while the visit is open. |
| **System** | One spoken form via `guestPlaceSpoken` — Guest and Live share it. |
| **Emotional** | “I’m at *this* table · this is *our* tab.” Concierge calm. |

## Persistent identity band

```text
┌ Venue mark / name (owner brand — never Lekki after join)
│ Place spoken: Table 12  (pack noun · code)
│ Phase purpose below (Browse / Orders / Bill…) — one gold primary per phase
└ Live phone mirrors the same venue + spoken place
```

### States

| State | Show | Primary |
|-------|------|---------|
| **Empty** (joined, no lines) | Venue + place · calm empty | Browse / Add (gold) |
| **Loading** | Identity band · no invented place | None |
| **Ready** | Venue + place | Phase peak |
| **Error** (no session) | Existing Entry redirect — no fake place | Go to Entry |
| **Paid / settled** | Place still named | Leave / Receipt path — no Pay gold |

### One gold primary (unchanged matrix — do not add gold)

| Phase | Gold | Quiet secondary |
|-------|------|-----------------|
| Menu | Add / cart chip | Dock · Help |
| Cart | Place order | Add more |
| Orders | Pay only if balance due | Browse · Help |
| Bill | Pay | Back |
| Help | One send/call | Cancel |

## UX Architect — geometry (LVES)

- Shell band: sticky top · venue Fraunces · place Sora caption (spoken, not badge wall)  
- Guest Warm Sand sheet keeps phase purpose; place whisper may remain in screen header for Live parity  
- Live gsp header: venue + **same** spoken place · sticky within phone frame  
- Motion: settle only · band does not pulse on every socket tick · `motion-reduce` respected  
- Gold peak rules unchanged · Guest uses `--brand` · no Lekki gold on joined shell  

## Tailwind expert — express

- Complete utilities / existing `leos-*` tokens only  
- No Preflight · no `dark:` · no runtime class construction  
- Prefer `@theme` aliases / `--leos-*` · no new hex scatter  

## Done when

1. After join, Guest chrome shows **venue** brand only — no Lekki mark/name  
2. Spoken place visible **without scroll** while visit open (shell band)  
3. Live phone spoken place matches Guest for the same focused place  
4. Pay Live mode shows place when known  
5. Exactly one gold primary per phase (no new gold fills)  
6. Evidence walk: Studio Live → Guest same place  

## Code seam

- `apps/web/src/app/studio/place-continuity.ts` — shared spoken form + Live/Guest match  
- `apps/web/src/app/shells/experience-shell.component.ts` — sticky venue + place when joined  
- `apps/web/src/app/leos/guest-shell-projection.component.ts` — spoken place line  
- `apps/web/src/app/leos/live-experience-panel.component.ts` — pass noun/code; pay mode place  
- `apps/web/src/app/leos/experience-screen.component.ts` — sticky place whisper (sheet)  

## HOLD

Order-state calm · Pay confidence sentence · GAP-02/07 · Setup · Marketplace · Neo · claim/split
