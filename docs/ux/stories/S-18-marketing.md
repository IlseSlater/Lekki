# Story: S-18 — One Suggestion

| | |
|--|--|
| **Maturity** | L0 (not started) |
| **Journey stage** | Provider — Grow (nested view, not a new nav item) |
| **Spec** | [grow-craft.md](../grow-craft.md) — "One suggestion max" |
| **Evidence** | None yet |
| **Questions** | — |

Uber Eats Manager's Marketing area is its own application: Offers (objective → audience → discount → dates → budget → conditions → review → activate) and Ads (store → budget → dates → targeting → review → launch). That's a campaign builder with a dozen fields per campaign.

`grow-craft.md` already names the LEOS-shaped version of this: *"One suggestion. Open another station on Friday evenings."* This story is that — a single, specific, actionable suggestion drawn from real trading data, with one action to take it or leave it. Not a campaign builder.

*Note on grounding:* `grow-craft.md`'s Do/Don't table covers trading figures and suggestions in general — it doesn't name Marketing/campaigns specifically. This story extends its spirit by analogy, not by literal quote the way S-15/S-16/S-17 do. Reasonable, but softer-grounded — worth knowing if this ever gets challenged.

### Five questions

| # | Question | Answer |
|---|----------|--------|
| 1 | Which journey does this improve? | Provider — Grow, after service |
| 2 | Which human benefits? | Owner deciding what to change, without becoming a marketer |
| 3 | Which reusable platform capability emerges? | `getGrowSuggestion` — one heuristic-driven suggestion, or none |
| 4 | How will we know it's better? | Owner sees at most one suggestion, understands it in one breath, and can act in one tap |
| 5 | Can another profile reuse it? | Yes — suggestion heuristics read trading data, not Pack-specific rules |

**Depends on:** guest-side promotional pricing. "It activates directly (e.g. a discount window is set)" presumes a price-modification mechanism that doesn't exist — Specials today is only a catalogue category filter (`category === 'specials'`), not a discount or time-windowed price change. Until that mechanism exists, "one tap to activate" has nothing to activate.

### Platform Value

| | |
|--|--|
| **User Value** | I get one good idea, not a campaign dashboard to configure |
| **Platform Value** | One suggestion heuristic instead of an Offers + Ads module |
| **Reusable Capability** | `getGrowSuggestion(venueId)` → `{ text, action?: { label, run() } }` or `null` |
| **Future Reuse** | Same slot can host smarter heuristics later without changing the surface |

### Acceptance Spec

```text
Given trading data suggests one clear opportunity
When I open Grow
Then I see at most one suggestion, in plain language
     (e.g. "Guests dip after 3pm — try a Tuesday happy hour.")
And I see at most one action to take it (e.g. "Set up happy hour")
And I do not see a campaign builder, audience picker, or budget field

Given no clear opportunity exists
When I open Grow
Then I see no suggestion at all — not a placeholder, not "no suggestions yet"

Given I take the suggested action
When I confirm
Then it activates directly (e.g. a discount window is set)
And I am never routed through objective → audience → discount → budget → review steps
```

### Product Review

| Question | Pass? | Notes |
|----------|-------|-------|
| One suggestion max? | Target | Never a feed or carousel |
| Feels like a trusted manager? | Target | Not a campaign dashboard |

### Retrospectives

Link when done.
