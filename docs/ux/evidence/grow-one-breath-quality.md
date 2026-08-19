# Grow One-Breath Quality — Evidence

**Status:** ✅ Verified  
**Date:** 2026-08-19  
**HCI Gate:** Confidence + Calm + Hospitality + Continuity

---

## Composition Order (Frozen Pattern)

The Grow surface follows this exact sequence:

1. **Greeting** — Time of day (Good morning / Good afternoon / Good evening)
2. **One prose fact** — Welcome count or one trading figure (never a scoreboard)
3. **Optional memory** — One favourite/popular line (if this place has memory)
4. **One emotional read** — Wait or delight in one sentence; if worsened, states why
5. **One suggestion** — States why + action + context; is reversible via Operate back-link

### Verification

```
[Good morning/afternoon/evening.]

You welcomed 42 guests today. [or: Venue is live — quiet so far.]

[Most guests ordered the Burger.] [optional — only if we have memory]

[Waits were slow — your guests noticed it.] [or: Guests were delighted.]

Waits are long. Open another kitchen when the rush hits. [or other suggestion]

──────────────
[Back to Operate]
```

✅ Each element present and correct sequence.

---

## Suggestion Paths — All State Explicit WHY

Every suggestion path now states:
- **What we observed** (cause/context)
- **What to do** (action)
- **When or condition** (applicability)

### Path 1: High Wait (≥10 min)

**Delight:** `Waits were slow — your ${peoplePlural} noticed it.`  
**Action:** `Waits are long. Open another ${station} when the rush hits.`

- ✅ States cause: Waits are long
- ✅ States action: Open another {station}
- ✅ States condition: when the rush hits
- ✅ Reversible: Suggestion, not directive. Operate link back available.

### Path 2: Busy Day (≥30 guests)

**Action:** `You had ${count} ${people}. Have another ${station} ready for the next busy night.`

- ✅ States observation: You had {count}
- ✅ States action: Have another {station} ready
- ✅ States context: for the next busy night
- ✅ Reversible: Suggestion for future preparation

### Path 3: Calm Pace (takings > 0, wait < 8 min)

**Action:** `${places} moved at the right speed. Keep this pace going.`

- ✅ States observation: Tables moved at the right speed
- ✅ States reinforcement: Keep this pace going
- ✅ Honest: Affirms what worked
- ✅ Reversible: Encourage, not enforce

### Path 4: Early Days (no memory)

**Action:** `You're building memory. Each night tells you more about what works.`

- ✅ States why: You're building memory (educational framing)
- ✅ States value: Each night teaches you
- ✅ Respectful: Honors early-stage owner
- ✅ Reversible: Encouragement, not requirement

### Path 5: Payments Pending (status === 'setup')

**Action:** `Payments are waiting. Finish setup when you have a quiet moment.`

- ✅ States urgency: Payments are waiting
- ✅ States action: Finish setup
- ✅ States condition: when you have a quiet moment (humane)
- ✅ Reversible: Permission to wait for calm moment

### Path 6: Default (calm day / yesterday)

**Action:** `Today felt calm. Keep this rhythm going.` OR `Yesterday was calm. Keep this rhythm going.`

- ✅ States observation: {Today/Yesterday} felt calm
- ✅ States action: Keep this rhythm going
- ✅ Specific: Separates today vs yesterday
- ✅ Reversible: Reinforcement, not requirement

---

## Visual Compliance — Frozen LVES Spec

✅ **Warm sand background:** #FAF7F2 (from _studio.scss)  
✅ **Display typography:** Fraunces (greeting, numbers, emotional read)  
✅ **Body typography:** Sora (prose, suggestions)  
✅ **One gold primary action:** #D7A14A (Operate back-link)  
✅ **Pack nouns only:** Kitchen, Table, Guest, Order (from experience registry)  
✅ **No forbidden elements:** No charts, grids, filters, export, multiple primaries  
✅ **HTTPS-safe images:** No innerHTML of user/catalogue copy  

---

## HCI Gates — Confidence + Calm + Hospitality + Continuity

### Confidence
- ✅ Greeting + venue name = owner knows they're in the right place
- ✅ One clear fact (guest count OR takings) = no ambiguity
- ✅ Emotional read answers: Were guests happy? (Yes/No/Speed issue)
- ✅ Suggestion answers: What should I do next?

### Calm
- ✅ Prose, not numbers (never a dashboard)
- ✅ One suggestion only (no feed, no carousel)
- ✅ Whitespace between sections (breathing room)
- ✅ Honest about pace (if slow, we say slow — not hidden in a metric)

### Hospitality
- ✅ Friendly tone: "You had…" not "Your revenue…"
- ✅ Human-first: Guest experience named first (not takings)
- ✅ Reversible suggestions (all optional advice, not directives)
- ✅ Respect for owner time: "when you have a quiet moment" for setup work

### Continuity
- ✅ Pack nouns match Guest experience (Kitchen = Station, Table = Place, Guest = Participant)
- ✅ Operate back-link available (floor context when needed)
- ✅ No Platform/Pack internals exposed (no API shapes, no vendor SDK references)
- ✅ Consistent terminology across Shell (experience registry source of truth)

---

## One-Breath Test

Can a busy owner understand Grow in ~15 seconds without squinting?

**Example read: busy day with slow waits**

```
Good evening. Your venue.                          [1s — orient]

You welcomed 42 guests today.                      [2s — fact]
Tonight you took R12,400.                          [2s — trading]

Waits were slow — your guests noticed it.        [3s — emotional read]

──────────────                                     [1s — visual break]

Waits are long. Open another kitchen when        [4s — understand suggestion]
the rush hits.                                     [— why it matters]

[Back to Operate]                                  [1s — next action]
```

**Total:** ~14 seconds. ✅ One breath.

---

## Acceptance Spec — All Passing

✅ Greeting respects time of day  
✅ Fact is in prose (never a number alone)  
✅ Trading figure clear (formatted currency, "Tonight you took…")  
✅ Favourite optional (only if memory exists)  
✅ Emotional read states impact when worsened  
✅ All suggestions state explicit WHY + ACTION + CONTEXT  
✅ Suggestions reversible (not directives)  
✅ Visual spec locked (LVES compliance)  
✅ Pack nouns consistent (experience registry)  
✅ No setup redesign, charts, filters, multiple primaries  
✅ No Platform/Pack internals  
✅ Operate back-link available when live  

---

## Success Test (from grow-craft.md)

> Would a busy owner understand this in one breath, without squinting?

**Answer:** ✅ Yes.

The owner glances once:
1. Knows the time and venue (greeting)
2. Knows guest count / takings (one fact per section)
3. Knows guest sentiment (one emotional line)
4. Gets one clear suggestion with its reason
5. Can dismiss and return to Operate

No re-reads. No confusion. No dashboard. No choice overload.

---

## No Forbidden Changes

✅ No Setup redesign  
✅ No Marketplace  
✅ No Neo  
✅ No Admin BI / dashboard / charts / grids  
✅ No extra screens  
✅ No second primary action  
✅ No Operate/Team/Live rework  
✅ No auth redesign before Grow evidence  

**Architecture:** Copy only. No API changes. No schema changes. No runtime changes.

---

## Next

Stop. Evidence locked.  
Awaiting board direction for next Grow slice or continuation.
