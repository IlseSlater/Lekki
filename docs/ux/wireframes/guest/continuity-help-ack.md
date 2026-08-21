# Continuity — Help ack pack polish (“Is someone coming?”)

**Status:** Shipped — evidence [continuity-help-ack.md](../../evidence/continuity-help-ack.md)  
**Platform Value:** After Help, the guest knows staff heard them — and when someone is coming — without anxious filler.  
**Human question:** Is someone coming?  
**Pillar:** Confidence · Calm · Hospitality  
**Surfaces:** Guest banner (`applyHelpBanner`) · pack copy in `guestServiceAssistCopy` / `guestManagerAssistCopy` · sheet pending hints (unchanged)  
**Not:** New help product · new sheet · new states · Marketplace · Neo · Setup · Admin BI · Continuity Leave/Ready-Pay/Tip/Mid-visit reopen

---

## Intent

Help already works: open → notified banner · staff ack → onWay banner · resolve clears.  
This craft only answers the breath after tap: **they know** → **someone is coming** — in pack nouns, without “hang tight.”

## Uncertainty removed

- “Hang tight” (anxious wait instruction — not hospitality)  
- Doubt whether notified means heard vs ignored  
- Ack sounding like a different product than Help

## Goals

| | |
|--|--|
| **User** | Know the call landed; know when someone is coming. |
| **System** | Same `open` / `acknowledged` → `applyHelpBanner`; swap strings only. |
| **Emotional** | Calm assurance. No second ask. No new Help UX. |

## States (craft only — existing banner)

| Status | Banner answers | Rule |
|--------|----------------|------|
| **open** (`notified`) | They heard you | Pack noun + calm confirm · **no** “hang tight” |
| **acknowledged** (`onWay`) | Someone is coming | Pack noun + “on the way” |
| Sheet pending | Unchanged | Keep existing `pendingHint` strings |

## COPY CRAFT — exact strings

### Service — `guestServiceAssistCopy`

| Pack | `notified` (was … hang tight) | `onWay` |
|------|-------------------------------|---------|
| Restaurant (default) | **We've told your waiter** | **Your waiter is on the way** *(unchanged)* |
| Café | **We've told the counter** | **Someone from the counter is on the way** *(unchanged)* |
| Hotel | **We've told reception** | **Reception is on the way** *(unchanged)* |
| Healthcare | **We've told reception** | **Reception is on the way** *(unchanged)* |
| Festival | **We've told the crew** | **Crew is on the way** *(unchanged)* |
| Airport | **We've told gate service** | **Gate service is on the way** *(unchanged)* |

### Manager — `guestManagerAssistCopy`

| Pack | `notified` (was … hang tight) | `onWay` |
|------|-------------------------------|---------|
| Restaurant / Café / Hotel / Healthcare (default) | **We've told the manager** | **The manager is on the way** *(unchanged)* |
| Festival | **We've told the lead** | **The lead is on the way** *(unchanged)* |
| Airport | **We've told gate lead** | **Gate lead is on the way** *(unchanged)* |

### Explicit removal

Strip **“ — hang tight”** from every `notified` string. Do not replace with wait / please / hold on / sit tight.

### Do not change

- `label` · `idleHint` · `pendingHint` · `staffNoun`  
- Sheet title/blurb · choose/dismiss behaviour  
- Staff Operate ack/resolve flow

## Commands / events

| | |
|--|--|
| **Command** | Existing assistance open / acknowledge (no new model) |
| **Events** | Same banner bind: `open` → `notified` · `acknowledged` → `onWay` |
| **Do not** | New Help kinds · timers · ETA · chat · second sheet |

## Accessibility

- Banner remains polite status / existing live message pattern  
- Copy must still name the pack role (waiter / counter / …) for screen readers  
- No “hang tight” as instructional filler

## Done when

1. Every pack `notified` matches the table · zero “hang tight” in assist copy  
2. Every pack `onWay` matches the table (keep existing onWay)  
3. Evidence: Help open → banner · staff ack → onWay · restaurant + one other pack

## HOLD

Cover-from-Leave · allocation wizard · tip product · Marketplace · Neo · Setup · Admin BI · new Help surfaces

## Code seam (for EO)

`apps/web/src/app/studio/operate-status.ts` — `guestServiceAssistCopy` / `guestManagerAssistCopy` `notified` (+ confirm `onWay` unchanged).  
Consumed by `guest.page.ts` `applyHelpBanner` · sheet hints already use `pendingHint` (no change).
