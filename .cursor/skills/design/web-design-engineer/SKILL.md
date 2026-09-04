---
name: web-design-engineer
description: >-
  Visual craft, critique, and browser QA for LEOS/Lekki front-end. Use for design
  critique, throwaway HTML comps, or visual QA. Production app is Angular+SCSS
  (angular-web, ux-architect), not React dashboards. Not for NestJS, Prisma, or
  Platform/Pack architecture.
---

# Web Design Engineer

## Do

1. Production UI is **Angular standalone + SCSS** under `apps/web`. Do not land
   React, Tailwind, shadcn, or CSS-in-JS in the app.
2. LVES tokens (`apps/web/src/styles/_tokens.scss`, `docs/ux/lves.md`) outrank
   “stunning dashboard” instincts. Guest / Studio / Operate / Grow are calm
   hospitality: one gold primary, one question per screen, light only.
3. Marketing spectacle (GSAP, cinematic scroll) is not for product shells —
   that is `build-awwwards-quality-sites`.
4. Critique: hierarchy, contrast, hit targets, one primary action, digital calm.
5. Verify behaviour in the browser, not a single screenshot.
6. Throwaway HTML comps may live outside `apps/web`. The imported React/Tailwind
   kit is `.agents/skills/web-design-engineer` — load it only for those comps.

## Never

Rewrite Studio/Guest as a dashboard · contradict `angular-web` · introduce a
second CSS framework · dark mode.

## Handoff

Tokens → `ux-architect`. Copy → `brand-architect`. Product motion →
`motion-architect`. Implementation → `angular-web`.
