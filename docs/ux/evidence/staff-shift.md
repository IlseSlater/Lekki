# Evidence — Staff shift

**Proof:** Team assign → PIN → assigned board is one owned walk. Staff never opens Studio.  
**Date:** 2026-09-21  
**Surfaces:** `/studio/team` · `/staff` · `/staff/station/:id` · `/staff/service`  
**Pillar:** Confidence · Continuity  
**Story:** [S-11-team.md](../stories/S-11-team.md)

## Uncertainty removed

*What is my job on this device?* — Experience first, then PIN, then tickets.

## Slice

| Beat | Owner |
|------|--------|
| Assign Experience · PIN · End now | Studio Team · `team-confidence` |
| Who’s working · PIN · Switch | `staff-entry.page` |
| Land on assigned board | `staffHomeForRole` · `staffShiftContinue` |
| Tickets | station · service pages (existing) |
| Owner watch | `?monitor=1` — not a preview |

PIN `?next=` only follows if the path starts with `/staff`.

## HCI

| Axis | |
|------|--|
| OX | One job after PIN; Switch on shared device |
| PX | Team still assigns without a Setup step |
| DX | One home-path helper — no second ROLE_HOME map |
| CX | Unchanged (Guest never sees Staff) |

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/staff-paths.test.ts apps/web/src/app/studio/team-confidence.test.ts
```

1. Team → Kitchen · Save → Open Staff Experience.
2. PIN → Kitchen board (`/staff/station/kitchen`).
3. Switch → Waiter PIN → `/staff/service`.
4. Login URL with `?next=/studio/grow` still opens Kitchen, not Grow.

## Hold

Invites · audit history · Marketplace · Neo · Setup redesign · hard new permission verbs.
