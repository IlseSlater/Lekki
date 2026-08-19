# Evidence — Studio Team confidence

**Proof:** Team answers who can do what, which device is in use, and whether it is safe to end a login — without HR admin, audit product, or Neo.

**Date:** 2026-08-19  
**Surfaces:** Studio Team · Identity staff / devices / sessions  
**Pillar:** Confidence · Calm · Continuity  
**Contract:** existing `GET/POST /identity/staff/*` — additive `inUse` on devices only

## Slice (shipped)

| Human question | Meaning |
|----------------|---------|
| Who can do what? | People rows show Experience · actions (mark ready · take payment). Editor groups See / Act / Finish. |
| Which device is in use? | Idle · In use · Last seen · Assigned here. Named devices stay on this floor. |
| Safe to end? | **End now** names the shared device. Flash: ends access · safe to reassign. |

## API

- `GET /identity/staff/devices` now returns a stable DTO (`lastSeenAt` ISO · `inUse`) instead of a raw row.
- `POST /identity/staff/sessions/:id/revoke` unchanged.
- No guest APIs touched. No vendor payment shapes. No new identity verbs.

## HCI

| Moment | Confidence |
|--------|------------|
| People | I know what this person can do on the floor |
| Devices | I know if a tablet is idle or in use |
| Sessions | I know what End now will do |

## Verify

1. Team → People: row shows Experience · actions; signed-in staff shows **On {device}**.
2. Open a person: What they can do is grouped (see / act / finish) — not a raw permission dump.
3. Devices: Idle or In use · last seen · Assigned here.
4. Sessions: End now · Ends access on {device} · flash says safe to reassign.

## Still HOLD

Invites · onboarding workflows · audit history · org hierarchies · Neo · Marketplace · Setup redesign

No Platform architecture change. No new LEKs.
