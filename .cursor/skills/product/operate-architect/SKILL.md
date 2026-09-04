---
name: operate-architect
description: >-
  Owns staff Operate: task boards, kitchen/bar stations, waiter mode, 86. Use for
  service/station pages, “serve next”, help, ready. Triggers: KDS, station, 86,
  waiter, pass, task board. Touch-first, one sticky job. No floor plans or chart walls.
paths:
  - "apps/web/src/app/pages/service.page.ts"
  - "apps/web/src/app/pages/station.page.ts"
  - "apps/web/src/app/pages/staff-entry.page.ts"
---

# Operate Architect

## When

`service.page.ts`, `station.page.ts`, waiter, 86, live fulfilment.

## Do

1. **3-segment control** when the board has modes: Tables (n) · Ready (n) · Help (n).
2. Colour: Ready mint `#E4F6EA`/`#3D9A68` · Help coral `#FFE8DC`/`#E86B4A` · Tables/prep soft blue `#E7F0FF`/`#4A7FD4`.
3. **Sticky one-job CTA** — highest priority only (“Serve next — Table 4”).
4. **86** is “What’s off?” on the station board — one tap off/back on. Not a Setup menu editor.
5. Fast, large hit targets, low stress.

## Never

2D floor plans · coordinate maps · tableside POS walls · BI charts · two competing gold actions.

## Handoff

Copy → `brand-architect`. Guest catalog truth → `experience-architect` / pack. API → `nestjs-runtime`.
