# Design Skills

**Status:** Active — tooling, not constitution.
**Source:** Adapted from [julianoczkowski/designer-skills](https://github.com/julianoczkowski/designer-skills) (Apache-2.0), based on the workflow described in [7 Claude Code Design Skills That Follow a Real Design Process](https://medium.com/@julian.oczkowski/7-claude-code-design-skills-that-follow-a-real-design-process-b871b8673d05). Plus [MengTo/Skills — build-awwwards-quality-sites](https://github.com/MengTo/Skills/tree/main/agent-skills/web-design/build-awwwards-quality-sites) (MIT, marketing site only), [ConardLi/garden-skills — web-design-engineer](https://github.com/ConardLi/garden-skills/tree/main/skills/web-design-engineer), and [codeswithroh/tastemaker](https://github.com/codeswithroh/tastemaker) (see below).
**Installed at:** `.agents/skills/{grill-me,design-brief,information-architecture,design-tokens,brief-to-tasks,frontend-design,design-review,design-flow,build-awwwards-quality-sites,web-design-engineer,tastemaker}/`
**Tracked in:** `skills-lock.json`

## What this is

A structured design process — interrogate the idea, write a brief, define structure, confirm tokens, break into tasks, build, review — instead of jumping straight to code. Each skill reads what already exists before proposing anything new.

These are **not a replacement** for Lekki's own specification set (`docs/LEK-0xx*.md`, `docs/NORTH-STAR.md`, `docs/ux/`). They're a lighter-weight *process* for scoping and building a specific feature or screen. Constitution still wins:

- `docs/NORTH-STAR.md` / `docs/ux/current-product-state.md` — what's frozen (Setup Engine v1, Experience/Studio shells, core guest journey) and what's still open for craft.
- `docs/ux/lves.md` — the aesthetic (Surgical White & Rose-Gold), already chosen. `frontend-design` and `design-tokens` default to it rather than picking a new one.
- `docs/LEK-028-component-catalogue.md` — the component vocabulary to reuse.

Every skill here has a **Lekki Context** section at the top pointing at the real token files, doc set, and freeze list, so it doesn't propose a generic React/Tailwind/dark-mode solution that doesn't match this codebase.

## The flow

```
1. grill-me                 → Clarify thinking (skip if the ask is already clear)
2. design-brief              → .design/<feature-slug>/DESIGN_BRIEF.md
3. information-architecture  → .design/<feature-slug>/INFORMATION_ARCHITECTURE.md (skip inside a frozen screen)
4. design-tokens             → extends apps/web/src/styles/_tokens.scss (usually just a gap-check — tokens already exist)
5. brief-to-tasks            → .design/<feature-slug>/TASKS.md
6. frontend-design           → the actual Angular components/pages
—
7. design-review             → .design/<feature-slug>/DESIGN_REVIEW.md + screenshots, on request after something is built
```

Run the whole thing with `design-flow`, or invoke any single skill on its own — e.g. "grill me on this menu redesign" or "review what we just built."

## build-awwwards-quality-sites — marketing site only

A ninth skill, kept deliberately separate from the flow above: cinematic, motion-rich (GSAP/ScrollTrigger, optional Three.js) art direction for `website-home.page.ts` and any future landing/marketing pages.

**This does not apply to Studio or Experience.** Those are governed by `docs/ux/leos-motion-system.md` (Frozen) — fade/flow/rise/settle only, never bounce/pop/shake/spin, no parallax. If a build using this skill risks pulling GSAP/Lenis/Three.js into the shared product bundle, that's a blocker to fix, not a detail to note in passing.

## web-design-engineer — mockups and prototypes, not production code

A tenth skill, also kept separate from the core flow: produces standalone HTML/CSS/JS/React artifacts — variant comparisons, prototypes, decks, dashboards — for exploring a direction *before* it's built for real. It ships with a large reference library (`.agents/skills/web-design-engineer/references/`), including 25 named "style recipe" files (`apple-hig.md`, `linear.md`, `raycast.md`, etc.) — worth knowing about since LEOS's own stated references (Apple Wallet/Uber Eats/Airbnb for Experience, Stripe/Linear for Studio) map directly onto `style-recipes/apple-hig.md` and `style-recipes/linear.md`.

**It does not write to `apps/web/`.** Its SKILL.md is adapted to treat Lekki's brand/tokens as already decided (paste `_tokens.scss` values rather than deriving a new system, skip the "3 direction" advisor, no dark mode) and to hand off approved directions to the `frontend-design` skill for the actual Angular port. The `references/` library itself is installed verbatim from upstream — it's general design reference material, not Lekki-specific.

## `.design/` vs `docs/ux/`

`.design/<feature-slug>/` is scratch space this flow writes to per feature (brief, IA, tasks, review, screenshots) — never overwritten across features, never committed as constitution. `docs/ux/` is Lekki's frozen spec set (wireframes, stories, evidence, freeze rules). When a design-flow output would change something `docs/ux/` already governs, it should point back at that doc rather than fork a competing one.

## tastemaker — reference-grounded UI generation with project memory

An eleventh skill, also separate from the core numbered flow: generates on-brand UI by grounding in real reference pixels rather than text descriptions, and — its main distinguishing feature — remembers a project's established style so later screens don't drift from earlier ones. Four verbs: `build` (default), `study` (extract reusable DNA from a reference without copying it), `audit` (critique existing UI, read-only), `comps` (reference comp briefs for an external image generator).

**Its memory file is pre-seeded, not left to generate cold.** `.tastemaker/style-lock.md` at the repo root was written directly from Lekki's real tokens — `apps/web/src/styles/_tokens.scss` and `docs/ux/lves.md` — including a computed WCAG contrast matrix. That means this skill's own Step 0 ("check for `.tastemaker/style-lock.md` before doing anything else") finds real Lekki values on the very first run instead of generating a placeholder palette that would then need correcting. `_tokens.scss` / `lves.md` still outrank the lock file if they're ever edited and fall out of sync — the lock is a mirror, not the source.

**Two real, pre-existing contrast gaps surfaced while seeding the lock** (documented in `.tastemaker/style-lock.md`'s Color contract section, not introduced by this install): `--leos-ink-muted`/`--leos-ink-caption` (`#94a3b8`) is 2.56:1 against white, below both the 4.5:1 text floor and the 3:1 UI floor — currently reads as intentional "quiet" caption styling, but shouldn't carry load-bearing text. And `--leos-gold` as a flat CTA fill is 2.31:1 against white, below the 3:1 UI-component floor on color alone — the existing primary button already compensates with `--leos-shadow-cta`'s colored drop-shadow, so any *new* gold-filled control that skips that shadow won't have the same compensation. Neither was silently changed; both are flagged in the lock file's "Do not" section as decisions for a person to make, not for a skill to make unilaterally. Separately, the CTA label color question is already correct: Lekki uses dark ink (`--leos-on-brand`) on the gold fill at 6.89:1, not white (which would only be 2.31:1) — confirmed, not changed.

**Its default motion (GSAP/ScrollTrigger) and component-sourcing (shadcn/React registries) are scoped to marketing/prototype work only**, same boundary as `build-awwwards-quality-sites` and `web-design-engineer` above — never Studio or Experience, and never against `apps/web/`'s actual Angular tree. `references/`, `scripts/`, `assets/`, the vendored `ideagram/` illustration sub-skill, and `SECURITY.md` are installed verbatim from upstream; only `SKILL.md` carries the Lekki Context adaptation.

## Note on installation

These were hand-installed (network access to the `skills` npm registry package was unavailable in the environment that set this up) rather than via `npx skills add julianoczkowski/designer-skills`. `skills-lock.json` entries are marked `"adapted": true` — `computedHash` covers the local Lekki-adapted file, not the verbatim upstream one, so don't expect an upstream `skills update` to apply cleanly without re-merging the Lekki Context sections back in.

## impeccable — award-winning design director for all UI work

**Source:** [pbakaus/impeccable](https://github.com/pbakaus/impeccable) (Apache-2.0), v4.1.2.
**Installed at:** `.agents/skills/impeccable/` (153 files: SKILL.md + reference/ + scripts/ + agents/)
**Tracked in:** `skills-lock.json`

An opinionated design-director persona that treats every frontend task as an opportunity for out-of-distribution craft. Covers the full spectrum from UX review and visual hierarchy through typography, spacing, color, motion, accessibility, i18n, and responsive behavior — for websites, dashboards, landing pages, product UI, components, forms, and empty states.

**Lekki-specific adaptations (SKILL.md only; all other files verbatim):**
- Stack locked to Angular 19 standalone components + SCSS. Tailwind, shadcn, and other CSS frameworks are never introduced into `apps/web/`.
- `--leos-*` CSS custom properties from `apps/web/src/styles/_tokens.scss` are the canonical palette. No new aliases invented.
- Fonts: Fraunces (display, weight 500–650) + Sora (UI body, weight 400–700) only.
- Gold CTA rule: `--leos-gold` (#d7a14a) is rationed to one primary CTA per screen, active/selected states, and brand moments only.
- No dark mode. No `prefers-color-scheme` blocks.
- Frozen surfaces never touched as a side effect: `apps/web/src/app/experience/`, `studio/`, `setup/`, `docs/ux/`.
- GSAP/ScrollTrigger permitted only for the marketing site (`website-home.page.ts` and future landing pages). Studio/Experience motion stays within `docs/ux/leos-motion-system.md` (Frozen) — fade/flow/rise/settle only.
- `live` command: Angular is not in the framework adapter list. Use it only for standalone HTML/CSS prototypes, never pipe it into `apps/web/` Angular source files.
- All script paths corrected from `.agent/skills/impeccable/scripts/` → `.agents/skills/impeccable/scripts/` to match Lekki's monorepo layout.

**Commands (invoke as `/impeccable <command>` or describe the task):**

| Category | Command | What it does |
|---|---|---|
| Build | `init` | Capture durable product context in PRODUCT.md |
| Build | `shape` | Plan UX/UI before writing code |
| Build | `document` | Generate DESIGN.md from existing project code |
| Build | `extract` | Pull reusable tokens/components into design system |
| Evaluate | `critique` | UX review with heuristic scoring |
| Evaluate | `audit` | a11y, perf, responsive checks |
| Refine | `polish` | Final quality pass before shipping |
| Refine | `bolder` / `quieter` | Amplify or tone down a design |
| Refine | `distill` | Strip to essence |
| Refine | `harden` | Production-ready: errors, i18n, edge cases |
| Refine | `onboard` | First-run flows, empty states, activation |
| Enhance | `animate` | Purposeful animations and motion |
| Enhance | `colorize` | Strategic color on monochromatic UIs |
| Enhance | `typeset` | Typography hierarchy and fonts |
| Enhance | `layout` | Spacing, rhythm, visual hierarchy |
| Enhance | `delight` | Personality and memorable touches |
| Enhance | `overdrive` | Push past conventional limits |
| Fix | `clarify` | UX copy, labels, error messages |
| Fix | `adapt` | Responsive / multi-device |
| Fix | `optimize` | UI performance |
| Iterate | `live` | Prototype-only: pick elements, generate variants (not for `apps/web/`) |

Run `npx impeccable context` at session start (via `node .agents/skills/impeccable/scripts/context.mjs`) to load PRODUCT.md, DESIGN.md, and the matching surface brief before editing.
