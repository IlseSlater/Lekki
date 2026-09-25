# Tailwind CSS v4 — what we studied

Canonical: [tailwindcss.com/docs](https://tailwindcss.com/docs) (v4, 2026). Lekki is already on `@tailwindcss/postcss` (`apps/web/.postcssrc.json`).

## Getting started (do not cargo-cult)

| Doc | Lekki rule |
|-----|------------|
| Vite plugin | Angular uses **PostCSS**, not `@tailwindcss/vite`. |
| [PostCSS](https://tailwindcss.com/docs/installation/using-postcss) | Matches this app. |
| [Angular guide](https://tailwindcss.com/docs/guides/angular) | Their sample imports full `tailwindcss` (Preflight). **We do not.** Theme + utilities only — see `styles.css` header. |
| Play CDN | Never in production. |

## Core concepts we actually use

- **[Styling with utilities](https://tailwindcss.com/docs/styling-with-utility-classes)** — one job per class; variants prefix the utility; `dark:` exists in the framework and is **banned** on LEOS product.
- **[Theme variables](https://tailwindcss.com/docs/theme)** — `@theme { --color-* --font-* --radius-* --ease-* --duration-* --container-* }`. `--*: initial` wipes a namespace. We **extend** with aliases; we do not replace the default theme wholesale (unused defaults tree-shake).
- **[Colors](https://tailwindcss.com/docs/colors)** — oklch defaults. Lekki colours come from `--leos-*`, not Tailwind’s rainbow.
- **[Adding custom styles](https://tailwindcss.com/docs/adding-custom-styles)** — `@utility`, arbitrary `[prop:value]`, `bg-(--my-var)`, type hints `text-(color:--var)`.
- **[Functions and directives](https://tailwindcss.com/docs/functions-and-directives)** — `@import` `@theme` `@source` `@utility` `@variant` `@custom-variant` `@apply` `@reference`; `--alpha()` `--spacing()`; v3 `@config`/`@plugin`/`theme()` are compatibility only.
- **[Detecting classes](https://tailwindcss.com/docs/detecting-classes-in-source-files)** — plain-text scan; complete class names; `@source` / `@source not` / `@source inline()`. CSS files are **not** scanned — classes in `.css` must appear in templates or be safelisted.
- **[Hover, focus, and other states](https://tailwindcss.com/docs/hover-focus-and-other-states)** — `hover`, `focus-visible`, `active`, `disabled`, `aria-*`, `data-*`, `group`, `peer`, `motion-safe`, `motion-reduce`, stacked variants. Prefer `focus-visible` over `focus` for rings.
- **[Upgrade guide](https://tailwindcss.com/docs/upgrade-guide)** — no `@tailwind` directives; PostCSS package is `@tailwindcss/postcss`; browsers Safari 16.4+ / Chrome 111+ / Firefox 128+.

## Halo / first-impression utilities

| Need | v4 utilities | Lekki mapping |
|------|----------------|---------------|
| Gold bloom | `bg-radial` `from-action/20` `to-transparent` | Prefer token `--leos-ash-halo` / `--leos-obsidian-halo` on `::before` (already GPU opacity+scale). |
| Mark light | `drop-shadow-*` or `filter-[drop-shadow(...)]` | Gold mark PNG/SVG — **filter**, not `box-shadow` (box-shadow is a rectangle). |
| Glass card | `backdrop-blur-sm` `bg-obsidian-card` | Landing `lk-card` already blurs. |
| Focus | `ring-2` `ring-action` `outline-none` | One gold ring family. |
| Enter | `duration-halo` `ease-leos` `motion-reduce:transition-none` | 600ms bloom. |
| Press | `active:scale-[0.98]` `duration-press` | Buttons. |

**Do not use** `animate-bounce`, `animate-ping`, `animate-spin` for brand. Waiting = existing soft gold pulse only.

## Layout / type (defaults)

Spacing scale, flex/grid, container queries (`@md:` style `@container` variants if we adopt them — **do not remap** Lekki’s 720/800/860/900/960/1023/1100 breakpoints to `lg` without a decision). Type: `font-sans` → Sora via `--font-sans`; `font-display` → Fraunces. Landing currently uses **Inter** on purpose — do not silently switch it.

## Compatibility notes from the upgrade guide

Renames and removed v3 utilities exist. This repo never shipped v3 config; do not run `npx @tailwindcss/upgrade` as a ritual. Do not add `tailwind.config.js`.
