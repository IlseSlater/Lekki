# Style lock — Lekki (LEOS)

Established: 2026-08-25. Source: existing production design system — `apps/web/src/styles/_tokens.scss` (canonical tokens) and `docs/ux/lves.md` ("LVES 2.0 — Surgical White & Rose-Gold", shipped same day this lock was seeded). This file is a **mirror** of those two sources, not the origin — if it ever disagrees with them, they win. See the Lekki Context block at the top of `SKILL.md` for the full precedence note.

## Palette
- Background: `#ffffff` (`--leos-warm-white` / `--leos-surface`) — role: page canvas, pure white throughout, no off-white/cream tinting
- Surface (secondary): `#f9f8f6` (`--leos-surface-secondary`) — role: subtle section/card differentiation from pure-white background
- Primary: `#d7a14a` (`--leos-gold`) — role: the single interactive accent — primary CTA, focus, selected state. Rationed deliberately; not a general-purpose brand color to reach for elsewhere.
- Accent (hover/pressed family): `#c48f38` hover (`--leos-gold-hover`), `#d9a85b` light (`--leos-gold-light`), `#b88339` dark (`--leos-gold-dark`) — role: the metallic gradient/state family the Primary gold is drawn from, not separate accents
- Text primary: `#0f172a` (`--leos-ink`) — contrast vs Background: **17.85:1** (WCAG AA/AAA pass)
- Text body: `#475569` (`--leos-ink-body`) — contrast vs Background: **7.58:1** (pass)
- Text secondary / icon: `#64748b` (`--leos-ink-secondary` / `--leos-icon`) — contrast vs Background: **4.76:1** (pass, just clears the 4.5:1 text floor)
- Text muted: `#94a3b8` (`--leos-ink-muted` / `--leos-ink-caption` / `--leos-ink-tertiary`) — contrast vs Background: **2.56:1** — **fails both the 4.5:1 text floor and the 3:1 UI floor.** This is a real, pre-existing gap in the shipped tokens, not something this lock introduces. See Color contract below for how to work around it rather than "fix" it unilaterally.
- Button label color: `#1b2230` (`--leos-on-brand`, dark ink — NOT white) — contrast vs Primary (`#d7a14a`): **6.89:1** (pass, comfortably). Lekki's primary CTA already does the right thing here: dark label on gold fill, not the more common white-on-gold, which only computes to 2.31:1 and would fail. Do not switch this to white.
- Dark mode: not needed for this project — single mode only. Lekki is explicitly light-only ("never dark mode" — see `docs/ux/lves.md`). Skip dark-mode work entirely unless the user makes an explicit, deliberate product decision to add it.

## Color contract

Matrix computed directly from the values above (WCAG 2.1 relative-luminance formula), not from `scripts/check_contrast.py` (this environment's device shell has no path to run it against the live repo in this pass — the arithmetic is the same formula that script implements; re-run it for future verification since it's the canonical tool going forward).

| Foreground on background | Ratio | Floor | Result |
|---|---|---|---|
| Text primary (`--leos-ink`) on Background | 17.85:1 | 4.5:1 | Pass |
| Text body (`--leos-ink-body`) on Background | 7.58:1 | 4.5:1 | Pass |
| Text secondary / icon (`--leos-ink-secondary`) on Background | 4.76:1 | 4.5:1 | Pass |
| Text muted (`--leos-ink-muted`/caption) on Background | 2.56:1 | 4.5:1 (text) / 3:1 (UI) | **Fail both** |
| Button label (`--leos-on-brand`) on Primary fill | 6.89:1 | 4.5:1 | Pass |
| Button label if it were white (`--leos-on-brand-inverse`) on Primary fill | 2.31:1 | 4.5:1 | Fail — confirms why Lekki uses dark-on-gold, not white-on-gold |
| Primary (`--leos-gold`) as a fill vs Background | 2.31:1 | 3:1 (UI component) | **Fail** on flat-fill contrast alone — see note below |
| Gold-dark (`--leos-gold-dark`) as a fill/border vs Background | 3.31:1 | 3:1 | Pass |
| Success (`#4f8a6b`) on Background | 4.05:1 | 4.5:1 (text) / 3:1 (UI) | Fails as text, passes as UI/icon |
| Danger (`#c65b52`) on Background | 4.18:1 | 4.5:1 (text) / 3:1 (UI) | Fails as text, passes as UI/icon |
| Border hairline (`--leos-border`, `#eae6e1`) vs Background | 1.24:1 | 3:1 (only if state-carrying) | Decorative — exempt, this hairline never carries state alone |

- Text-safe (>=4.5): `--leos-ink` on Background/Surface, `--leos-ink-body` on Background/Surface, `--leos-ink-secondary` on Background/Surface, `--leos-on-brand` on `--leos-gold`
- UI-safe (>=3.0 and <4.5): `--leos-gold-dark` as fill/border/icon, `--leos-success` and `--leos-danger` as icon/border/large-text only (never as small body text)
- Decorative (<3.0): `--leos-ink-muted`/`--leos-ink-caption` (must never be the only carrier of text meaning — see below), `--leos-gold` as a flat fill on its own, `--leos-gold-hover` (2.86:1), `--leos-border` hairline (exempt, purely decorative separator)

**Two real gaps to work around, not silently "fix":**
1. **`--leos-gold` as a flat CTA fill is only 2.31:1 against white** — below the 3:1 UI-component floor on color alone. The existing primary button (`--leos-btn--primary`) already compensates with `--leos-shadow-cta` (a colored drop-shadow that gives the button a visible boundary independent of fill-vs-page contrast) — so in practice the control is identifiable, just not via flat-fill contrast. Any *new* gold-filled control (a badge, a chip, a smaller CTA) that skips the shadow treatment will not have this compensation and should either keep the shadow, add a hairline border, or use `--leos-gold-dark` (which does clear 3:1 on its own).
2. **`--leos-ink-muted`/`--leos-ink-caption` at 2.56:1 fails outright**, even as UI/icon use. It currently reads as intentional "quiet" caption styling in the shipped product. Do not silently darken this token to fix contrast — that's a real design-system decision (would visibly change the "quiet" caption aesthetic across the whole product) and belongs to the user, not to this skill. Flag it if a new build would put load-bearing information (not purely decorative captioning) in this color; use `--leos-ink-secondary` (4.76:1) instead when the text needs to be reliably legible.

## Typography
- Display/heading font: **Fraunces** (`--leos-font-display`, `'Fraunces', Georgia, serif`) — used for display moments only (hero numerals, key headline moments), not general UI. Weights loaded: 500/650 (per Google Fonts link in `apps/web/src/index.html`).
- Body/UI font: **Sora** (`--leos-font-sans`, `'Sora', system-ui, -apple-system, sans-serif`) — the default for all interface text.
- Scale: not centrally tokenized as a type scale in `_tokens.scss` (font-sizes are set per-component today) — don't invent a new scale; match the nearest existing component's sizes when adding UI.

## Shape language
- Corner radius: `--leos-radius-card: 24px` (cards/panels), `--leos-radius-button: 14px` (buttons — Studio's rounded-rect system), `--leos-radius-input: 12px` (form inputs), `--leos-radius-pill: 999px` (pill-shaped controls — currently used by the separate guest-onboarding flow's CTA, a deliberate exception to the 14px button radius, not a drift bug)
- Shadow depth: soft, layered elevation — `--leos-shadow-card` (`0 12px 36px rgba(15,23,42,0.05), 0 2px 8px rgba(15,23,42,0.02)`) for resting cards, `--leos-shadow-hover` for hover lift, `--leos-shadow-cta` / `--leos-shadow-cta-hover` / `--leos-shadow-cta-active` (colored, rgba(184,131,57,...)) specifically for the gold primary button — see Color contract note above on why this shadow matters for the CTA's visibility, not just its polish.
- Border usage: hairline `--leos-border` (`#eae6e1`) for card/section separation, used alongside shadows rather than instead of them — Lekki layers both, it isn't a "shadows OR borders" system.

## Density & spacing
- Base unit: not a strict 4px scale — Lekki's actual spacing tokens are `--leos-space-xs: 0.5rem` (8px) through `--leos-space-2xl: 2rem` (32px), rem-based. Use these named tokens, don't introduce a parallel 4px-multiple scale.
- Overall density: generous, calm — pure-white canvas with restrained content density; closer to Apple Wallet / Airbnb spacing than a dense admin table by default (Studio's Operate/Grow surfaces run denser than Experience, but still not "information-heavy" by tastemaker's own dense-app-shell definition).
- Section separation: alternating background tint (`--leos-surface` white to `--leos-surface-secondary` `#f9f8f6`) plus hairline borders where needed — not a hard divider-only or tint-only rule.

## Structure
Omitted — Lekki is an app-shell product (LEOS Studio + LEOS Experience), not a marketing-page-structured site, except for the one marketing surface (`website-home.page.ts`), which is explicitly out of this lock's scope (see `build-awwwards-quality-sites` skill, already installed, for that page's own rules).

## Reference intelligence
- Reference board: inferred, not viewed via this skill's own tooling — recorded directly in `docs/ux/lves.md` instead. Experience surface references: Apple Wallet, Uber Eats, Airbnb. Studio surface references: Stripe, Linear, Google Admin.
- Design read: hospitality ordering/admin platform (Experience = consumer-facing "Read/Operate" surface, Studio = admin "Operate" surface), mode split by surface — Experience leans Experience/Read, Studio leans Operate.
- Foundation: existing repo stack — Angular standalone components + SCSS, `_tokens.scss` as the token layer. Not a shadcn/Tailwind/React foundation; do not run this skill's component-sourcing step against `apps/web/`.
- Quality bar: Apple Wallet (Experience), Stripe/Linear (Studio) — named directly in `docs/ux/lves.md`, not inferred by this skill.
- Anti-references: dark dashboards, marketplace-style UI chrome, widget walls, chatbot-style Setup flows — all explicitly banned in `docs/NORTH-STAR.md`'s "Never" list.

## Taste memory
- Profile priors used: none (first tastemaker install in this project; no `~/.tastemaker/profile.md` history to read)
- Decision log: `.tastemaker/decisions.log` (not yet created — will be created on first real decision this skill logs)
- Last resolved decisions: none yet
- Pending review: none yet
- Profile promotion: none
- Memory precedence note: this lock file itself is the highest-precedence *memory* artifact for this skill's own Step 0 check, but `_tokens.scss` / `docs/ux/lves.md` outrank even this lock if they're ever in conflict (see the top of this file).

## Navigation chrome
- Sidebar background: Surface (white) · Content area background: Background (white), with `--leos-surface-secondary` used for section differentiation rather than a tinted sidebar
- Active nav item treatment: not centrally tokenized — match the nearest existing Studio shell component when adding nav UI rather than inventing a new pattern
- Shell density: Studio's Operate/Grow surfaces run a standard, comfortable row height — not the "dense, 36px row" app-shell default this skill assumes; confirm against the actual Studio shell component before assuming density.

## Mood descriptors
Quiet, precise, warm-metallic, restrained — "surgical white" canvas with gold used as punctuation, not decoration.

## Aesthetic mode
None — LVES 2.0 is Lekki's own named design language, recorded directly in this lock and in `docs/ux/lves.md`, not one of this skill's `references/modes/<name>.md` overrides.

## Assets
- Anchor asset: `apps/web/public/brand/` (existing logo/brand marks) — everything else should visually match this; do not construct a new mark via this skill's logo-sourcing primitives.
- Asset style: hand-authored inline SVG food icons (see `apps/web/src/app/leos/menu-card.component.ts`) for guest-facing UI — match this existing pattern for new icons rather than introducing a fetched Iconify set, except for net-new marketing/prototype work where no existing icon applies.
- Illustration vs. photography split: not yet established in the product — no illustration system currently in use in Studio/Experience. If `ideagram` is used, scope it to marketing/prototype work first and treat any resulting illustration as a new decision to confirm with the user before it's treated as a standing pattern.
- Illustration source used: not yet applicable — no `~/.ideagram/undraw/` library populated yet in this environment.
- Logo: `apps/web/public/brand/` — preserved existing brand mark, not constructed from primitives.

## Motion
- Feel: calm, light-like — "everything moves like light: fade, flow, rise, settle. Never bounce, pop, shake, or spin." (`docs/ux/leos-motion-system.md`, Frozen)
- Curves: `--leos-ease: cubic-bezier(0.22, 1, 0.36, 1)`
- Durations: `--leos-duration-fast: 160ms` (press/hover feedback), `--leos-duration: 220ms` (standard transitions), `--leos-duration-enter: 280ms` (entrance)
- Entrance duration/distance: 280ms per `--leos-duration-enter`; distance not centrally tokenized — keep subtle, no large-throw rises
- Screen tracks: no scroll-storytelling, no parallax, no ScrollTrigger choreography anywhere in Studio or Experience — this is a hard frozen rule, not a style preference. GSAP/ScrollTrigger (this skill's own non-negotiable default #3) is scoped to the marketing site and throwaway prototypes only, never these product surfaces.
- Frequency rules: routine, repeated interactions (list scrolling, tab switches, form field focus) should stay near-instant or use only the fast (160ms) tier — the slower entrance tier is for genuine screen/section entrances, not everyday interaction feedback.
- Reduced motion: not yet audited against `prefers-reduced-motion` in this pass — treat as an open item, not confirmed compliant.
- Verified by: pending — `scripts/audit_motion.py` has not been run against this repo yet.

## Do not
- No dark mode, ever, without an explicit user decision to add it as a real product feature.
- No GSAP/ScrollTrigger/Three.js/scroll-storytelling motion in LEOS Studio or LEOS Experience — marketing site (`website-home.page.ts`) and throwaway prototypes only.
- No shadcn/Tailwind/React component-sourcing against `apps/web/` — this is an Angular + SCSS codebase.
- Do not silently darken `--leos-ink-muted`/`--leos-ink-caption` to "fix" its 2.56:1 contrast gap — flag it, don't unilaterally change a shipped token that affects the whole product's caption styling.
- Do not switch the primary CTA's label color from `--leos-on-brand` (dark) to white — white-on-gold measures 2.31:1 and would fail, dark-on-gold at 6.89:1 is the correct existing choice.
- Do not restructure Setup Engine v1, the Experience/Studio shells, or the core guest journey (QR→Join→Menu→Cart→Pay→Live Order→Receipt→Leave) — these are frozen per `docs/NORTH-STAR.md`. Craft within existing tokens on these surfaces; flag instead of proceeding if a request implies structural change.
