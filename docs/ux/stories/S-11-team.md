# Story: S-11 — Staff shift (Team → PIN → tickets)

| | |
|--|--|
| **Maturity** | **L4 Running** — walk owned |
| **Journey** | Staff — assign Experience → PIN → station or floor |
| **Spec** | [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) §12 · ADR-004 |
| **Evidence** | [staff-shift.md](../evidence/staff-shift.md) |

Not a sixth Setup step. Floor work stays `/staff/*`. Team stays Studio.

### Five questions

| # | Answer |
|---|--------|
| 1 | Staff shift — “I know my next job.” |
| 2 | Kitchen · Bar · Waiter · Counter · Floor lead · owner assigning |
| 3 | Existing `/identity/staff/*` · fulfilment boards |
| 4 | PIN opens the assigned Experience only; End now names the device; no Studio leak |
| 5 | Pack nouns on Team / waiter blurb |

### Acceptance

```text
Given an owner assigns Kitchen on Team and a PIN
When that person signs in at /staff
Then they land on /staff/station/kitchen — never /studio/kitchen or Grow
When ?next=/studio/grow is on the login URL
Then they still land on their Staff home
Given a shared device
When they Switch person and enter another PIN
Then the Experience changes; the device stays
```

**Next slice:** Continuity polish if named. GAP-01…GAP-08 closed.
