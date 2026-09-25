# Story: G-02 — Join

| | |
|--|--|
| **Maturity** | **Folded into G-01** — not a separate screen |
| **Journey** | Experience — inside splash, part of G-01's walk |
| **Spec** | [G-01-entry.md](G-01-entry.md) · [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) GAP-09 |
| **Evidence** | [evidence/guest/join/](../evidence/guest/join/) — historical only, do not fill in |

The old wireframe ([join.md](../wireframes/guest/join.md)) specced Join as its own screen after Entry. The running app does not do this: `resolveEntry` fires during splash, so by the time a guest sees anything after Entry, they are already joined. Per GAP-09 ("Splash joins before Arrival — Documented truth"), this is not a gap to fill — it is a fact to stop re-litigating.

This card exists only so the G-0X numbering has an answer for G-02 instead of a silent hole.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — the moment between Entry and landing |
| 2 | First-time diner |
| 3 | `resolveEntry` (existing) — no new capability |
| 4 | One fewer screen than the frozen spec: no separate "you're in" wall |
| 5 | Any Pack — join is Entry Runtime, not Restaurant-specific |

### Acceptance

```text
Given a guest has submitted a valid token on Entry
When splash plays
Then resolveEntry has already run and the session exists
     before the guest sees landing or menu
Given the old spec's "Join" screen
When anyone proposes rebuilding it
Then point here and to GAP-09 — it does not exist as a screen
```

**Next slice:** None. This stays closed unless a real product reason reopens a second confirmation step — "the spec used to say so" is not a reason.
