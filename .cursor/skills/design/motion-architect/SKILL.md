---
name: motion-architect
description: >-
  Owns LEOS product motion: 160/220/280/360ms, ease-out cubic-bezier, Live Phone sync.
  Use for transitions, micro-interactions, reduced motion. Triggers: animation, motion,
  duration, Live Phone. Motion explains state — never decorates. GSAP is marketing-only.
---

# Motion Architect

## When

CSS/animation on product surfaces. Not cinematic marketing (that is `build-awwwards-quality-sites`).

## Do

| Budget | Use |
|--------|-----|
| **160ms** | Hover lift `-2px`, press `scale(0.98)`, toggles |
| **220ms** | Card reveal, Live Phone cross-fade |
| **280ms** | Screen / sheet |
| **360ms** | Go Live celebration only |
| **Ease** | `cubic-bezier(0.16, 1, 0.3, 1)` |

1. Fade / flow / rise / settle. No bounce, pop, shake, spin.
2. Honour `prefers-reduced-motion`.
3. Do not animate `transform` on horizon `.ridge` (breaks parallax/perf). No infinite `hue-rotate`.

## Never

Ornament loops · blocking motion · GSAP/Three on Guest/Studio/Operate · ignore reduced motion.

## Handoff

Marketing motion → `.agents/skills/build-awwwards-quality-sites`. Product CSS → `angular-web`.

## Read

`docs/ux/leos-motion-system.md`
