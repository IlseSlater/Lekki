---
name: angular-web
description: >-
  Implements Lekki Angular standalone UI in apps/web: Guest, Studio, Operate, Grow,
  marketing pages. Use when editing Angular/TypeScript/SCSS in the web app, routing,
  OnPush, lazy routes, LVES classes, or “the site is slow.” Not for NestJS or Prisma.
paths:
  - "apps/web/**"
---

# Angular web (LEOS)

**Agent twin:** `.cursor/agents/frontend-builder.md`

## When

Any change under `apps/web/`.

## Do

1. **Match neighbours.** Standalone components, existing `leos-*` classes, SCSS partials — no new CSS framework.
2. **Tokens only.** `apps/web/src/styles/_tokens.scss` (`--leos-*`). Do not invent hex for gold/sand/ink.
3. **OnPush** for new or touched presentational components. No default ChangeDetection unless there is a proven reason.
4. **Lazy routes.** Do not re-enable `PreloadAllModules`. Sign-in may warm on idle; nothing else.
5. **One gold primary** per view (`#D7A14A` / `--leos-gold`). Auto-save in Studio — no Save/Apply/Publish row.
6. **Reuse** `apps/web/src/app/leos/` before creating a component.
7. **Auth:** Studio guard owns redirect. Do not auto-`enterStudio()` from leftover staff session. Sign-out clears Studio *and* operate staff session.
8. **Horizon canvas** is static on app pages (no parallax/blur on `.ridge`). Marketing hero may be richer.
9. **Verify in the browser** (or Playwright) for any user-visible change. Appearance-only screenshots are not enough.

## Never

- React, Tailwind, shadcn, or CSS-in-JS in production web.
- Dark mode.
- GSAP / Three.js / infinite hue-rotate on Guest, Studio, Operate.
- Admin-panel density, chart walls, multi-primary CTAs.
- Drive-by refactors of frozen Setup step order.

## Handoff

Layout law → `ux-architect`. Copy → `brand-architect`. Motion budget → `motion-architect`. APIs → `nestjs-runtime` / `api-architect`.

## Read

`docs/ux/lves.md` · `docs/ux/leos-motion-system.md` · `docs/ux/LEOS-Studio-Design-Blueprint.md`
