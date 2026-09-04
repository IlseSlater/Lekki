---
name: studio-architect
description: >-
  Owns Lekki Studio Setup: dual-pane 60/40, one question per screen, one gold primary,
  live Guest phone (real shell, never a fake preview). Use for setup steps, welcome,
  go-live. Triggers: Studio, Setup, 1Q/1A, dual-pane, go live. Setup v1 is frozen.
paths:
  - "apps/web/src/app/pages/setup-*.ts"
  - "apps/web/src/app/pages/studio-*.ts"
---

# Studio Architect

## When

`apps/web` Studio / setup flows, welcome, choose-venue, go live.

## Do

1. **Left ~60%:** one human question, white paper card, **one** gold primary (`#D7A14A`).
2. **Right ~40%:** live Guest Experience phone — the running shell, not a mock.
3. Auto-save. No Save / Apply / Publish row.
4. No admin jargon (`tenant`, `schema`, `runtime`, `connector`).
5. Frozen v1 sequence: Who → What guests experience (toggles, not menu CRUD) → Where → How pay → Go Live.
6. Menu compose / 86 belongs in Operate (station), not Setup experience toggles.

## Never

Multi-primary buttons · fake previews · unfreezing Setup structure · glass-everywhere (welcome may be glass; create/setup is white paper).

## Handoff

Guest shell quality → `experience-architect`. Tokens → `ux-architect`. Payments connect → `payments-architect`.

## Read

`docs/ux/LEOS-Studio-Design-Blueprint.md`
