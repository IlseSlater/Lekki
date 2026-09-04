---
name: frontend-design
description: Build distinctive, production-grade frontend interfaces with high design quality, guided by named aesthetic philosophies. Use when building components, pages, or applications. Generates working code with exceptional attention to aesthetic details and creative choices that avoid generic AI output.
---

## Lekki Context (read first)

**Lekki already has a committed aesthetic — do not run the philosophy picker below by default.**

- The philosophy is **LVES 2.0 Surgical White & Rose-Gold** (`docs/ux/lves.md`): pure white canvas, slate ink (`--leos-ink`), one warm gold accent (`--leos-gold`) rationed to primary CTA / focus / selected states only — never a wash or decoration. Experience surfaces feel like *Apple Wallet · Uber Eats · Airbnb*; Studio surfaces feel like *Stripe · Linear · Google Admin*. Fonts: Sora (UI), Fraunces (display moments only).
- Only reach for a different named philosophy from the menu below if the user explicitly asks to explore an alternative (e.g. "show me this in a Neo-Memphis style as an experiment"). Otherwise, treat LVES as the philosophy already chosen and skip straight to building with it.
- **Tokens already exist** — `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss`. Use `--leos-*` custom properties, never hardcode a hex value or pixel radius that already has a token. If a value is missing, add it to `_tokens.scss` rather than inlining it.
- **Stack is Angular (standalone components) + SCSS**, not React/Tailwind/CSS-in-JS. Component patterns to reuse: `leos-btn` / `leos-btn--primary` / `leos-btn--ghost`, `leos-field` / `leos-field__label` / `leos-field__input`, `leos-menu-card`, `<leos-experience-screen>` wrapper, `<leos-confidence-indicator>`. Check `apps/web/src/app/leos/` before writing a new component.
- **No dark mode** — Lekki is light-only by design. Skip the Dark Mode section entirely.
- **Respect the freeze.** `docs/NORTH-STAR.md` / `docs/ux/current-product-state.md` freeze Setup Engine v1, the Experience/Studio shells, and the core guest journey against architectural redesign. Building within an existing screen (new content, refined visuals, a new card layout) is fine; restructuring the shell or step order is not — flag it instead.

This skill guides creation of distinctive, production-grade frontend interfaces. Implement real working code with exceptional attention to aesthetic detail.

## Example prompts

- "Build the hero section from the brief"
- "Create a card component in a Scandinavian style"
- "I want this to feel like a Japanese magazine. Build the layout."
- "Build the settings page. Use whatever style fits."

## Before You Write Any Code

1. **Explore the existing codebase first.** Scan specifically for:
   - **Component directory**: `apps/web/src/app/leos/` — list every component by name and its `@Input`/`@Output` API
   - **CSS variables / tokens**: `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss`
   - **Design system docs**: `docs/ux/lves.md`, `docs/LEK-028-component-catalogue.md`
   - **Font loading**: `apps/web/src/index.html` (Fraunces, Sora, Inter via Google Fonts — already loaded, don't add more)
   - **Layout patterns**: how existing pages (`apps/web/src/app/pages/*.page.ts`) handle grid, containers, breakpoints, and spacing
   - If components exist that match or partially match what you need to build, extend or compose them. Do not create duplicates.

2. **Understand the context:**
   - What problem does this interface solve? Who uses it?
   - What is the intended emotional tone?
   - What are the hard constraints (Angular, phone-first for Experience, accessibility)?

3. **Confirm the aesthetic direction.** For Lekki this is LVES 2.0 (Surgical White & Rose-Gold) by default — state that you're using it rather than re-deriving a philosophy from scratch. Only pick from the menu below if the user explicitly asked for a named alternative, and say so clearly since it would be a deliberate departure from the established system.

## Aesthetic Philosophies (reference menu — not the Lekki default)

Use these only when the user explicitly asks to explore a named alternative outside LVES. Each philosophy defines typography, color, layout, spacing, motion, and detail treatment.

### Dieter Rams (Functionalist)
Less but better. Every element earns its place. Nothing decorative without function.
- **Typography**: Clean sans-serif (Helvetica Neue, Suisse Intl, Akkurat). Tight letterspacing on headings. Generous line height on body. One size scale, used strictly.
- **Color**: Restrained. Monochromatic with a single functional accent. White or light grey backgrounds. Color is information, not decoration.
- **Layout**: Strict grid. Clear functional hierarchy. Components aligned to a spatial system. No asymmetry for its own sake.
- **Spacing**: Consistent, mathematical scale (4px/8px base). Generous padding. Breathing room between elements.
- **Motion**: Minimal. Purposeful transitions only (state changes, reveals). No decorative animation.
- **Details**: Subtle borders and dividers over shadows. Precise alignment. Rounded corners used sparingly and consistently.

### Swiss / International Typographic
Objectivity through structure. The grid is sacred. Content is king.
- **Typography**: Strong sans-serifs (Neue Haas Grotesk, Univers, Aktiv Grotesk). Dramatic scale contrast between headings and body. All-caps subheadings with generous letterspacing.
- **Color**: High contrast. Black, white, and one primary color. Bold color blocks as compositional elements.
- **Layout**: Rigid multi-column grid. Asymmetric balance. Text and image in dialogue. Alignment across elements is non-negotiable.
- **Spacing**: Defined by the grid module. Gutters are part of the design, not afterthought.
- **Motion**: Page transitions and scroll-triggered reveals that respect the grid. No playful bounce.
- **Details**: Rules (horizontal lines) as structural elements. No gradients. No shadows. Flatness is the point.

### Japanese Minimalism (Ma)
Negative space is content. Restraint communicates sophistication. Quiet over loud.
- **Typography**: Thin-weight sans-serifs or elegant serifs (Noto Sans, Cormorant). Generous line height (1.8-2.0). Small body size with large whitespace margins.
- **Color**: Muted naturals (warm greys, stone, sage, washi). Subtle tonal shifts over hard contrasts. Near-monochrome.
- **Layout**: Asymmetric but balanced. Off-center content. Large empty areas are intentional. Content floats in space.
- **Spacing**: Extreme whitespace. Padding and margins 2-3x what feels "normal." Elements breathe.
- **Motion**: Slow, gentle fades (400-600ms). No bounce, no overshoot. Opacity transitions over position shifts.
- **Details**: Hairline borders. Subtle texture (paper grain, linen). No sharp shadows. Soft, diffused effects.

### Brutalist / Raw
Structure is visible. No polish. Anti-aesthetic is the aesthetic.
- **Typography**: System fonts, monospace (JetBrains Mono, IBM Plex Mono, Courier), or aggressive display faces. Mixed sizes. Text as texture.
- **Color**: Black and white primary. If color, it is raw and clashing (construction yellow, hazard orange, terminal green). No gradients.
- **Layout**: Visible borders. Box model exposed. Stacked blocks. Deliberate roughness. Content first, beauty never.
- **Spacing**: Tight or intentionally uneven. Padding that feels compressed.
- **Motion**: None, or jarring (instant state changes, hard cuts). No easing.
- **Details**: Visible outlines. Default browser form elements can be intentional. Text-only interfaces. No icons unless functional.

### Scandinavian
Warmth plus restraint. Functional beauty. Accessible by default.
- **Typography**: Rounded, friendly sans-serifs (Nunito, Poppins, Circular, Cera Pro). Medium weights. Comfortable reading sizes.
- **Color**: Natural palette. Warm whites, soft blues, muted greens, clay. Pastel accents. No pure black (use charcoal).
- **Layout**: Clean and open. Card-based. Rounded corners (8-12px). Comfortable, generous layouts.
- **Spacing**: Generous but not extreme. Everything feels approachable and uncluttered.
- **Motion**: Gentle, natural easing. Subtle hover lifts. Content that settles into place.
- **Details**: Soft shadows (large blur, low opacity). Rounded elements. Warm undertones in greys. Illustration-friendly.

### Art Deco / Geometric
Bold symmetry. Decorative precision. Statement and luxury.
- **Typography**: Geometric display faces (Futura, Poiret One, Josefin Sans). All-caps headlines with extreme letterspacing. Serif body text for contrast.
- **Color**: Rich and deep. Gold/champagne, emerald, navy, burgundy, black. Metallic accents (gold gradients, shimmer effects).
- **Layout**: Symmetrical and centered. Strong vertical axis. Decorative frames and borders. Layered depth.
- **Spacing**: Structured and formal. Padding is architectural.
- **Motion**: Elegant reveals. Staggered entrance animations. Parallax depth.
- **Details**: Geometric patterns (chevrons, sunbursts, fan shapes). Ornamental borders. Texture (marble, brushed metal). Statement typography at hero scale.

### Neo-Memphis
Playful chaos. Anti-corporate. Shapes as characters.
- **Typography**: Mix of weights and styles. Clashing fonts is intentional. Oversized headlines. Text at angles.
- **Color**: Bold primaries and neons. Clashing combinations (pink and yellow, blue and orange). No muted tones. Flat color, no gradients.
- **Layout**: Broken grid. Overlapping elements. Shapes (circles, triangles, squiggles) as compositional elements. Asymmetric on purpose.
- **Spacing**: Dense in some areas, empty in others. Rhythm is irregular.
- **Motion**: Bouncy, playful. Exaggerated hover effects. Elements that wiggle, rotate, or pop.
- **Details**: Thick borders. Geometric shapes as decoration. Patterns (dots, dashes, zigzags). Drop shadows with hard edges and bright colors.

### Editorial / Magazine
Content-led design. Typography does the heavy lifting. Every page is a spread.
- **Typography**: Display serif for headlines (Playfair Display, Fraunces, Instrument Serif). Clean sans for body (DM Sans, Source Sans). Dramatic scale (hero headlines at 72-120px). Pull quotes. Drop caps.
- **Color**: Minimal. Black and white with one accent. Color used editorially (to highlight, not decorate).
- **Layout**: Strong column grid (3-5 columns). Full-bleed images. Text wrapping. Mixed column widths. Vertical rhythm.
- **Spacing**: Generous margins. Tight leading on headlines, open on body. Whitespace as a compositional tool.
- **Motion**: Scroll-triggered reveals. Parallax on images. Smooth page transitions.
- **Details**: Thin rules as dividers. Caption typography. Issue/date metadata. Print-inspired details (folio numbers, running headers).

Note: LVES 2.0 already borrows some Editorial/Magazine cues (Fraunces display headlines) and some Scandinavian cues (warm rounded cards, soft shadows) — that blend is the Lekki default, not a reason to run either philosophy wholesale.

## Implementation Guidelines

- **Typography**: Sora for UI, Fraunces for true display moments (already loaded). Do not add more fonts.
- **Color**: Use `--leos-*` CSS custom properties for consistency. Gold is rationed, not dominant — a page with gold everywhere is a Visual Smell per LVES, not a strength.
- **Motion**: CSS transitions matching `--leos-ease` / `--leos-duration*` and `docs/ux/leos-motion-system.md`. Everything moves like light: fade, flow, rise, settle — never bounce, pop, shake, or spin.
- **Spatial composition**: Cards are containers, not boxes — almost invisible borders, soft elevation, generous padding, breathing room. Typography and whitespace create hierarchy over boxed section headers or heavy borders.
- **Backgrounds and depth**: Kept minimal per LVES — no gradient meshes, noise textures, or grain overlays on Lekki surfaces. Reserve the gold gradient for the primary CTA only.

NEVER produce generic AI aesthetics: purple gradients on white, Inter font, predictable card grids with no editorial touch, cookie-cutter component layouts. Every output should feel designed for Lekki's hospitality context, not a generic dashboard.

## Mobile-First

Build mobile layout first, then scale up. This is non-negotiable for Experience (guest surfaces are phone-first per `docs/ux/LEOS-experience-design-principles.md`).

- Start with a single-column layout at 375px width.
- Add complexity at each breakpoint (`min-width` media queries, not `max-width`).
- Touch targets must be at least `--leos-touch-min` (52px) on mobile.
- Body text must be at least 16px on mobile (prevents iOS zoom on input focus).
- Primary action lives in the thumb zone (lower half / sticky footer) — not stretched to a top corner.
- Test that line lengths stay comfortable (45-75 characters) at every breakpoint.

## Dark Mode

Skip. Lekki does not support dark mode today (Studio and Experience are both light-only "never dark" by design). Do not add `prefers-color-scheme` handling or a `[data-theme="dark"]` variant unless the user explicitly asks for it as a new product decision.
