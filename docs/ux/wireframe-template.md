# Wireframe Template & Fidelity

**Status:** Active  
**Use with:** [Screen Inventory](screen-inventory.md) · [Layout Grammar](layout-grammar.md) · [Guest state specs](wireframes/guest/README.md)

LEOS is designed as **states**, not pages. One wireframe = one behavioural state.

---

## Every wireframe must answer

| Question | Meaning |
|----------|---------|
| **Intent** | Why does this state exist? |
| **User goal** | What is the user trying to accomplish? |
| **System goal** | What is LEOS trying to accomplish? |
| **Information shown** | Everything visible |
| **Actions** | Buttons, gestures, keyboard, scanner |
| **Navigation** | Where can I go? |
| **Events** | What gets emitted? |
| **Components** | Which LEK-028 components build this state? |
| **Runtime ownership** | Entry / Context / Experience / Capability / Profile Engine |
| **Pack ownership** | Restaurant / Hotel / none |
| **Error / next failure** | What happens if this fails? |
| **Reference Experience** | Restaurant-proven or LEOS-native |
| **Platform Value** | How this strengthens LEOS beyond one pack; future reuse |
| **Uncertainty removed** | What confidence does this state give the user? |

Constitutional test ([LEK-001](../LEK-001.md)): *Is this screen strengthening LEOS or only the Restaurant Pack?*

---

## Experience Review (required before Freeze)

| # | Question |
|---|----------|
| 1 | Understandable — usable without instructions? |
| 2 | Obvious — next action stands out? |
| 3 | Calm — no unnecessary noise? |
| 4 | Trustworthy — user always knows what is happening? |
| 5 | Reusable — works in another Experience Pack? |

If #5 is no → Restaurant screen, not LEOS. See [BUILDING-LEOS](../BUILDING-LEOS.md#experience-review-before-freeze).

## Design Critique (required before Build)

~10 min after IR: lose a section? one button? know next step? unnecessary text? Neo could explain (not implement)? Feels like LEOS or a restaurant app? **What uncertainty does this remove?**

See [BUILDING-LEOS](../BUILDING-LEOS.md#design-critique-after-ir-before-code).

---

## Numbering (Guest Journey)

```text
Guest.Entry.S1 …   not G-01 alone
Guest.Menu.S3 …
```

See [wireframes/guest/README.md](wireframes/guest/README.md).

---

## Fidelity stages (do not skip)

### Stage 1 — Boxes only
Header · Main · Cards · Button — nothing else.

### Stage 2 — Hierarchy
Heading · Subtitle · Cards · Primary · Secondary.

### Stage 3 — Interaction
States · Navigation · Transitions · Loading · Errors · Offline · Permissions.

### Stage 4 — LEDS
Spacing · Typography · Colours · Icons — **only after Guest Frozen**.  
**Motion / animation:** deliberately postponed until the interaction model is stable ([BUILDING-LEOS](../BUILDING-LEOS.md)).

Do **not** open Figma until the Guest journey state set is complete.

---

## Copy-paste skeleton

```text
## Guest.{Experience}.S{n} — {State name}

**Intent:**
**User goal:**
**System goal:**
**Information shown:**
**Actions:**
**Navigation:**
**Events:**
**Components:**
**Runtime ownership:**
**Pack ownership:**
**Error / next failure:**

┌────────────────────────────┐
│ Context                    │
├────────────────────────────┤
│ Primary Content            │
│                            │
├────────────────────────────┤
│ Status / Guidance          │
├────────────────────────────┤
│ Primary Action             │
└────────────────────────────┘
```
