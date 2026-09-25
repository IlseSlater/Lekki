# Story: G-01 — Entry (first impression)

| | |
|--|--|
| **Maturity** | **L4 Running** — walk owned |
| **Journey** | Experience — Scan → splash → landing → menu |
| **Spec** | Running software · [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) §12 |
| **Evidence** | [guest-first-impression.md](../evidence/guest-first-impression.md) |

Extends Entry. Does **not** add a sixth Guest tab. Does **not** rebuild E1 Continue → Join.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — first 30 seconds after QR |
| 2 | First-time diner |
| 3 | Token + session resolve (existing Entry) · guestDesign.arrival (existing JSON) |
| 4 | One question on landing; Lekki only on splash; Get started → menu |
| 5 | Any Pack — nouns from Context |

### Acceptance

```text
Given a first-time guest with a valid QR token
When splash ends or is skipped
Then the session is already joined and the venue landing shows
     name, place, owner look — not Lekki — with one action Get started
When they tap Get started
Then they are on the menu, not Specials
Given a returning or still-in guest
When splash ends
Then they skip landing
```

Join commits during splash (`resolveEntry`). Arrival is post-join confidence.

**Next slice:** Continuity polish if named — First-impression craft shipped.
