---
name: design-tokens
description: Generate a design tokens file (CSS variables or Tailwind config) based on a chosen aesthetic philosophy, with light and dark mode palettes, spacing scale, type ramp, and component-level tokens. Use when starting a new project, establishing a visual system, setting up tokens, or mentions "tokens" or "design system".
---

## Lekki Context (read first)

**Tokens already exist for Lekki — this skill should almost always be extending, not generating from scratch.**

- Canonical tokens: `apps/web/src/styles/_tokens.scss` (colours, radii, spacing, shadows, motion, fonts), consumed by `_leos.scss` (shared/guest components) and `_studio.scss` (Studio-specific). Token names are `--leos-*`.
- Palette: LVES 2.0 Surgical White & Rose-Gold — pure white canvas (`--leos-surface`), slate ink (`--leos-ink` `#0f172a`), one warm gold accent (`--leos-gold` `#d7a14a`) rationed to primary CTA / focus / selected states. Full spec: `docs/ux/lves.md`.
- Fonts: Sora (UI) + Fraunces (display/headline moments only), already loaded via Google Fonts in `apps/web/src/index.html`. Do not introduce a third typeface.
- **Lekki does not use dark mode today.** Studio and Experience are both light-only by design ("never dark" per LVES). Do not generate a dark palette for this project unless the user explicitly asks for one — that would be a real product decision, not a token default.
- Before writing anything: read `_tokens.scss` in full and check whether the value you need already has a token. If it's missing, add it in the same file, following the existing naming convention (`--leos-<category>-<variant>`), not a new parallel file.

## Example prompts

- "Set up design tokens for this project"
- "Generate a token system based on Dieter Rams"
- "I need a spacing scale and color palette before I start building"
- "Create tokens that match our brief"

## Process

1. **Check what already exists.** Read `apps/web/src/styles/_tokens.scss` first. It defines colour, geometry, spacing, elevation, gradients, motion, and typography tokens. **Extend it** — identify genuine gaps (a missing spacing step, a missing semantic colour role) and fill those in place, matching the existing `--leos-*` naming.

2. **Read the brief.** Look for a design brief at `.design/*/DESIGN_BRIEF.md`. If multiple subfolders exist, use the most recently modified one, or ask the user which feature they are working on. If no brief exists, ask the user what direction they want — but default to the existing LVES palette rather than proposing a new one.

3. **Generate tokens as CSS custom properties** in `_tokens.scss` (or the relevant partial), matching the project's existing SCSS + Angular setup. Do not introduce Tailwind, CSS-in-JS, or a theme.ts file — none of those exist in this codebase.

4. **Do not add a dark mode palette** unless explicitly requested (see Lekki Context above).

## Token Categories

### Color

```css
/* Semantic color tokens, not raw values */
--color-bg-primary:          /* Main background */
--color-bg-secondary:        /* Secondary/card background */
--color-bg-tertiary:         /* Subtle background (inputs, wells) */
--color-bg-inverse:          /* Inverted background */

--color-text-primary:        /* Main text */
--color-text-secondary:      /* Subdued text */
--color-text-tertiary:       /* Placeholder, disabled text */
--color-text-inverse:        /* Text on inverse backgrounds */
--color-text-link:           /* Link color */

--color-border-primary:      /* Default borders */
--color-border-secondary:    /* Subtle borders */
--color-border-focus:        /* Focus ring color */

--color-accent-primary:      /* Primary action color */
--color-accent-primary-hover:
--color-accent-primary-active:
--color-accent-secondary:    /* Secondary action color */

--color-status-success:
--color-status-warning:
--color-status-error:
--color-status-info:

--color-surface-overlay:     /* Modal/dropdown backdrop */
```

Lekki already has equivalents of every role above under `--leos-*` names (e.g. `--leos-ink`, `--leos-gold`, `--leos-border`, `--leos-success`) — map to those rather than introducing this generic naming scheme.

### Spacing

Lekki's existing scale is `--leos-space-xs` through `--leos-space-2xl` (0.5rem → 2rem) plus the Studio-specific 8/16/24/32/48/64 rhythm documented in `docs/ux/lves.md`. Extend that scale rather than starting a new one.

### Typography

Lekki already fixes the type roles (`--leos-font-sans`: Sora, `--leos-font-display`: Fraunces) and the size/colour ramp documented in `docs/ux/lves.md` (Headline 28–48px `#1B2230`, Body 16px `#525866`, Secondary 14px `#6B7280`, Caption 12px `#8A9099`). Reference these, don't redefine them.

### Layout

```css
--border-radius-sm / md / lg / full
--shadow-sm / md / lg / focus
```

Lekki equivalents: `--leos-radius-card` (24px), `--leos-radius-button` (14px), `--leos-radius-input` (12px), `--leos-radius-pill`, `--leos-shadow-card`, `--leos-shadow-cta`, `--leos-shadow-focus`.

### Motion

Lekki equivalents: `--leos-ease`, `--leos-duration` (220ms), `--leos-duration-fast` (160ms), `--leos-duration-enter` (280ms). See `docs/ux/leos-motion-system.md` (Frozen) before adding new motion tokens.

## Output

Extend `apps/web/src/styles/_tokens.scss` in place. State exactly which tokens were added or changed and why, and confirm no existing `--leos-*` value was renamed or removed (renames are a LEDS/LVES change and must update `docs/LEK-026-leds-visual-language.md` / `docs/ux/lves.md` in the same pass).
