# Craft kits (`.agents/skills`)

These are **imported visual/design kits**. They are not LEOS architecture.

Canonical product law lives in `.cursor/skills/` and `.cursor/rules/leos-constitution.mdc`.

## When to use

| Kit | Use for | Do not use for |
|-----|---------|----------------|
| `tastemaker` | On-brand UI when the user asks to make it look like Lekki, or audit “AI slop” | Inventing a new palette; React/shadcn in `apps/web` |
| `frontend-design` | Distinctive production UI **after** LVES is already the philosophy | Picking a new named aesthetic for Studio/Guest |
| `impeccable` | Critique / polish of a visual surface | Rewriting platform architecture |
| `build-awwwards-quality-sites` | Lekki marketing / landing / editorial motion | Guest Shell, Studio Setup, Operate, Grow |
| `web-design-engineer` | Visual critique, HTML artifacts, browser QA of a *visual* | NestJS, Prisma, contracts |
| `design-tokens` / `design-brief` / `design-flow` | Net-new marketing or experiments | Frozen Setup v1 |
| `information-architecture` | Structural IA before a *new* surface | Rearranging frozen Studio steps |
| `grill-me` | Stress-test a plan with the human | Silent architecture invention |
| `magicpath` | MagicPath CLI visual exploration | Production Angular as source of truth |

## Lekki overrides (always)

1. **LVES wins.** Tokens: `apps/web/src/styles/_tokens.scss` and `docs/ux/lves.md`.
2. **Stack is Angular standalone + SCSS**, not React/Tailwind unless the artifact is throwaway HTML.
3. **Light only.** No dark mode.
4. **Product motion** is `docs/ux/leos-motion-system.md` (fade/flow/rise/settle). GSAP/scroll-story is marketing-only.
5. **Hospitality before spectacle.** Digital calm, one gold primary, one question per screen.

If a kit fights those rules, follow LEOS skills and say so.
