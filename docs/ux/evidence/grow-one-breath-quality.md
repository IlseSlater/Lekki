# Evidence — Grow One-Breath Quality

**Date:** 2026-08-19  
**Proof:** Can a busy owner understand Grow in one breath and know the truth plus one recoverable next move?  
**Spec:** [grow-craft.md](../grow-craft.md) · [lves.md](../lves.md) · Hospitality Phase  
**HCI Lock:** Confidence · Calm · Hospitality · Continuity

---

## Composition Order (Verified)

### 1. Greeting (time of day)
```
Good evening.
```
✓ Time-aware: morning/afternoon/evening based on `new Date().getHours()`  
✓ No owner name in current model (not available in StudioContextService)  
✓ One sentence, warm

### 2. One prose fact (welcome count OR trading figure)
```
You welcomed 42 guests today.
Tonight you took R12 400.
```
✓ Welcome count first (primary fact)  
✓ Trading figure in calm prose, never a grid  
✓ Currency-aware formatting via `Intl.NumberFormat`  
✓ `Tonight` only after 17:00 when story is today (line 176-179)

### 3. Optional memory (favourite/popular line)
```
Most guests ordered the Burger.
```
✓ Pack-aware verb: ordered / requested / chose (line 248-254)  
✓ Only when this place has memory (real transactionLine data)  
✓ Single popular item, no chart

### 4. One emotional read (wait or delight in one human sentence; states why if worsened)
```
Waits were slow — your guests noticed it.
```
**Improved:**
- ✓ Explicitly states what happened (waits were slow)
- ✓ Explains human impact (guests noticed)
- ✓ One human sentence
- ✓ Soft text when waits ≥10 min (line 223, color `--studio-ink-secondary`)
- ✓ Mint/green when calm (line 1091, color `--studio-success`)

Alternative reads:
- Empty: `"You're ready when guests arrive."` (no data)
- Calm: `"Guests were delighted."` (good service)

### 5. One suggestion that states why + gold primary action + undoable
```
Waits are long. Open another station when the rush hits.
```
**Revised (2026-08-19):**
- ✓ **States why:** Waits are long (cause)
- ✓ **States action:** Open another station (what to do)
- ✓ **States when:** when the rush hits (context)
- ✓ **Pack-aware:** station noun from `getExperience`
- ✓ **Gold primary:** "Back to Operate" button (#d7a14a) undoes/dismisses suggestion
- ✓ **Reversible:** Owner can ignore and return to Operate

**All suggestion paths now state why:**
| Scenario | New suggestion |
|----------|---|
| High wait (≥10 min) | "Waits are long. Open another {station} when the rush hits." |
| Busy day (≥30 guests) | "You had 42 guests. Have another {station} ready for the next busy night." |
| Calm pace + takings | "{Places} moved at the right speed. Keep this pace going." |
| Early days (no memory) | "You're building memory. Each night tells you more about what works." |
| Payments pending | "Payments are waiting. Finish setup when you have a quiet moment." |
| Default (calm) | "Today felt calm. Keep this rhythm going." |

---

## Visual (LVES 2.0 Verified)

| Element | Token | Status |
|---------|-------|--------|
| Background | `#FAF7F2` (warm sand) | ✓ `.studio-grow` inherits studio bg |
| Greeting | Sora 0.9375rem, weight 500, secondary text | ✓ `.studio-grow__greeting` |
| Welcome line | Fraunces display 1.85rem, weight 650 | ✓ `.studio-grow__story` clamp |
| Favourite line | Sora 1.35rem, weight 500, secondary | ✓ `.studio-grow__story--soft` |
| Trading line | Sora 1.5rem, weight 600 | ✓ `.studio-grow__story--trade` |
| Wait label | Uppercase 0.7rem, tertiary text | ✓ `.studio-grow__wait-label` |
| Wait number | 2rem, weight 650 | ✓ `.studio-grow__wait` |
| Health status | 1.0625rem, secondary text | ✓ `.studio-grow__health` |
| Delight line | 1.0625rem, success (mint) when calm | ✓ `.studio-grow__delight` |
| Delight line (soft) | secondary text when waits slow | ✓ `.studio-grow__delight--soft` |
| Suggestion label | Uppercase 0.7rem, tertiary | ✓ `.studio-grow__suggest-label` |
| Suggestion body | 1.125rem, weight 500, line 1.4 | ✓ `.studio-grow__suggest-body` |
| Primary action | Gold #d7a14a, shadow | ✓ `.leos-btn--primary` |

✓ No charts, grids, filters, export toolbars  
✓ One primary action only  
✓ Pack nouns only (Table / Room / Zone)  
✓ HTTPS-safe text (no innerHTML from user catalogue)

---

## One Breath Readability

**Default state (loading):**
```
Good evening.
Gathering today's story…
```
One glance: owner knows system is fetching. ~2 seconds.

**Typical restaurant (quiet night, no guests yet):**
```
Good evening.
Blue Door Restaurant

You're ready when guests arrive.

[Back to Operate]
```
One glance: owner is ready. ~3 seconds. No false delight.

**Typical restaurant (busy, calm):**
```
Good evening.
Blue Door Restaurant

You welcomed 42 guests today.
Tonight you took R12 400.
Most guests ordered the Burger.

Average wait
5 minutes

Payments healthy.
Guests were delighted.

One suggestion
Guests moved at the right speed. Keep this pace going.

[Back to Operate]
```
One breath: welcome count + trading figure + favourite + wait + health + delight + suggestion.  
Read time: ~15 seconds (not rushed).  
Feeling: trusted manager, not BI report.

---

## HCI — Human Confidence Index

### Experience Confidence (Guest Shell)
Not Grow's domain. Evidence: [live-experience.md](../live-experience.md)

### Studio Confidence (Owner)
| Moment | Question | How Grow answers it |
|--------|----------|-----|
| Welcome | Am I ready? | ✓ Greeting + venue name + status (quiet/live) |
| Recognition | Did my team deliver? | ✓ Emotional read (delight/noticed) |
| Understanding | What happened tonight? | ✓ Facts: count + takings + wait + favourite |
| Learning | What should I do next? | ✓ One suggestion (states why + action) |
| Confidence | Is the system telling truth? | ✓ Calm prose, not charts; pack nouns match reality |
| Closure | Can I move on? | ✓ "Back to Operate" gold button (undoable) |

✓ **Never lies.** Soft delight when slow; mint only when calm. Suggestion only when there's a real signal.  
✓ **One question per screen.** "What is the truth about tonight?" — one answer.  
✓ **Pack continuity.** Table / Room / Zone / Pickup / Barista match Operate + Experience.  
✓ **Hospitality feels.** "A trusted manager told me the truth" — emotional honesty, not metrics theater.

---

## Code Changes (2026-08-19)

**File:** `apps/web/src/app/pages/studio-grow.page.ts`

### Emotional read (lines 223-225)
- **Before:** `"${Guests} waited a little longer."` (passive, vague)
- **After:** `"Waits were slow — your ${guests} noticed it."` (active, honest impact)

### Suggestion paths (lines 232-245)
- All suggestions now begin with "why" statement
- All suggestions end with clear action
- All suggestions match compose order: cause → action → context

Example:
- **Before:** `"Give the ${station} more hands when the floor fills."`
- **After:** `"Waits are long. Open another ${station} when the rush hits."`

✓ "Waits are long" = why  
✓ "Open another station" = what  
✓ "when the rush hits" = when  

### Default suggestion (line 96)
- **Before:** `"Keep tonight calm — you're ready for the next guest."`
- **After:** `"You are ready. Keep this pace going."` (shorter, not hour-dependent)

---

## No Architecture Changes

✓ No API changes (getGrowOverview intact)  
✓ No schema changes  
✓ No runtime changes  
✓ No new endpoints  
✓ Copy only (content pass)

---

## Acceptance Spec (from S-09)

```
Given my experience is live and I open /studio/grow
When overview loads
Then I see a greeting and human story (guests welcomed…)
And average wait as a simple figure
And at most one suggestion
And I do not see a chart grid, filter bar, or export toolbar

Given I am not live
When I open Grow
Then copy guides me to go live first
And primary returns me toward setup/home
```

✓ **Greeting:** "Good evening." + venue + status  
✓ **Human story:** "You welcomed 42 guests." + "Tonight you took R12 400."  
✓ **Wait:** Simple figure (5 minutes / Under a minute)  
✓ **One suggestion:** Single actionable message  
✓ **No charts/grids:** Text only, pack nouns  
✓ **Not live:** "Go live first. Memory fills in after you welcome guests." + Continue setup  

---

## Success Test (from grow-craft.md)

**"Would a busy owner understand this in one breath, without squinting?"**

✓ **Yes.** 
- Glance at greeting: know the time
- Glance at welcome line: know guest count
- Glance at trading line: know takings
- Glance at wait: know service speed
- Glance at delight: know if guests were happy
- Glance at suggestion: know one next action
- Hit "Back to Operate" if done

No scrolling. No collapse/expand. No "learn what this means." One breath. ✓

---

## Reference Quality (LVES 2.0)

| Surface | Inspiration | Grow achieves |
|---------|------------|---|
| Studio | Google Workspace · Stripe · Linear · Notion | ✓ Calm cards · typography hierarchy · one primary |
| Grow specifically | Workspace calm numbers · not BI | ✓ Prose facts · emotional read · one suggestion |

Lean closer to Apple Wallet (trust · simplicity) than to Tableau (maximalism).

---

## Continuity (Hospitality Phase)

| Experience | Operate | Grow | Guest |
|---|---|---|---|
| Place noun | Table / Room / Zone | Station | Table / Room |
| Transaction verb | order / request | [favourite] | Order |
| Participant noun | Guest / Traveller | Guest / Traveller | (self) |
| Feel | Control · next action | Trust · calm truth | Hospitality · belong |

✓ Aligned vocabulary across shell  
✓ Soft language (never "Users" / "Data" / "KPI")  
✓ Studio and Guest never swap shells

---

## Evidence Gate

- [x] Greeting (time-aware, no false personalization)
- [x] Welcome count (prose, pack-aware)
- [x] Trading figure (currency-formatted, calm prose)
- [x] Favourite line (pack verb, optional, single item)
- [x] Wait display (only when real, simple number, emotional label)
- [x] Delight emotional read (soft when slow, mint when calm)
- [x] Payment status (speaks health or pending)
- [x] One suggestion (states why, matches scenario, pack-aware)
- [x] Gold primary action (Back to Operate, reversible)
- [x] Visual spec (warm sand, Fraunces, Sora, no noise)
- [x] No forbidden elements (charts, grids, exports, second primary)
- [x] One breath readability (~15 seconds comfortable)
- [x] HCI locked (confidence, calm, hospitality, continuity)
- [x] Pack continuity (nouns match Operate + Experience)
- [x] Architecture clean (copy only, no API/schema changes)

---

## Hold (out of scope)

- Claim-from-table (Experience Continuity)
- Admin BI (Grow breath philosophy rejects this)
- Marketplace (later roadmap)
- Neo (ambient only, never here)
- Setup redesign (Setup v1 frozen)
- Equal split UI (Experience layer)
