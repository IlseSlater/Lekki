# Work order — convert Lekki's Angular styling to Tailwind

**Repo:** `C:\Lekki` · **App:** `apps/web` (Angular 19.2.14) · **Written:** 16 September 2026
**Status of this document:** a prompt. Paste it whole into the agent that will do the work.

---

## 0 · Before you write a single line

This is not a generic "SCSS → Tailwind" job and if you treat it as one you will do damage.
The facts below were measured against the working tree, not assumed. **Re-measure them
before you start** — the commands are given. If a number has moved, the plan moves with it.

### 0.1 What this codebase actually is

| Fact | Value | How to re-verify |
|---|---|---|
| Angular apps | exactly one: `apps/web` (`apps/runtime` is NestJS) | `ls apps` |
| Angular version | 19.2.14 | `apps/web/package.json` |
| Builder | `@angular-devkit/build-angular:application` | `apps/web/angular.json` |
| Global style entry | `src/styles.scss` — the **only** entry in `angular.json` `styles[]` | `angular.json` |
| Global partials | 4 files, **92,845 bytes** | `styles/_tokens.scss` 5,259 · `_leos.scss` 44,985 · `_studio.scss` 38,497 · `_registers.scss` 4,003 |
| Component `.scss`/`.html` files | **zero** (the only 4 `.scss` are the global partials) | `find apps/web/src/app -name '*.scss' -o -name '*.html'` |
| `styleUrls` / `templateUrl` | **0 / 0** | `grep -rc "styleUrls\|templateUrl" apps/web/src/app` |
| Component `.ts` files (excl. tests) | **73** | `find apps/web/src/app -name '*.ts' ! -name '*.test.ts' \| wc -l` |
| …with an inline `styles: [...]` block | **41** | `grep -lE "^\s*styles:" -r apps/web/src/app \| wc -l` |
| …with an inline `template:` | **63** | |
| Inline component CSS | **≈142,800 chars · 3,345 declarations** | script in §0.4 |
| Inline component templates | **≈178,000 chars** | |
| **Total CSS in play** | **≈236 KB** | 92.8 KB global + 142.8 KB inline |

### 0.2 The five findings that decide the whole migration

**Finding 1 — There is no Sass here.**
Across all four `.scss` partials: **0 `@mixin`, 0 `@function`, 0 `@extend`, 0 `@each`,
0 `@if`, 0 nesting.** Maximum brace depth is 2, and every depth-2 block is an `@media`
or `@keyframes` wrapper. The only Sass construct in the entire app is the four `@use`
lines in `styles.scss`. The `.scss` extension is decoration.

This matters because Tailwind v4's own compatibility page says, verbatim:

> "Tailwind CSS v4.0 is a full-featured CSS build tool designed for a specific workflow,
> and is not designed to be used with CSS preprocessors like Sass, Less, or Stylus."
> … "Think of Tailwind CSS itself as your preprocessor."

Normally that is a painful constraint. Here it costs nothing. **Rename the four partials
to `.css`, drop `sass` from the toolchain, and the conflict disappears.** Do not spend a
day making `@use 'tailwindcss'` work inside Sass when there is no Sass to preserve.

**Finding 2 — Cascade layers will silently eat every utility you write.**
Tailwind v4 emits utilities inside a cascade layer. Per the CSS cascade-layers spec,
**unlayered styles beat layered styles regardless of specificity.** The existing 92.8 KB
of global CSS is entirely unlayered. So on day one, `class="bg-black"` on an element that
also carries `.leos-btn` loses to `.leos-btn`, and you will conclude Tailwind is broken.

The fix is one line, and it is the maintainer-recommended one:

```css
@import "tailwindcss";
@import "./styles/leos.css"    layer(components);
@import "./styles/studio.css"  layer(components);
@import "./styles/registers.css" layer(components);
```

`_tokens.css` stays **unlayered** (or goes in `@theme`) — it only declares custom
properties, which layers do not affect in any way that matters.

**Do not** reach for `!important`, and **do not** import `tailwindcss/utilities.css`
unlayered to force a win. Both trade one cascade problem for a worse one.

**Finding 3 — `@apply` is a trap in this repo specifically.**
41 components carry inline CSS. In Tailwind v4, `@apply` inside a component style block
requires a `@reference "../../styles.css"` at the top of that block. Tailwind's own
discussion #17416 documents a monorepo whose dev startup went from **38 seconds to
3 minutes 40 seconds** after adding `@reference` to ~100 component stylesheets, because
each reference re-parses the whole theme. With 41 blocks you will feel a smaller version
of the same thing, for no benefit.

**Rule: this migration uses zero `@apply` and zero `@reference`.** Component CSS either
(a) stays as plain CSS reading `var(--…)` tokens, or (b) is deleted because its
declarations moved to utility classes in the template. Nothing in between.

Where a component needs utilities on its own host element, use Angular's `host` property
— it is the accepted answer in that same discussion and it needs no Tailwind machinery:

```ts
@Component({
  selector: 'lekki-hub-row',
  host: { class: 'flex items-center gap-4' },
  …
})
```

**Finding 4 — The spacing scale in the code is not the spacing scale in the spec.**
`docs/ux/lves.md` says: *"Grid: 8pt"* and *"Vertical rhythm: 8 / 16 / 24 / 32 / 48 / 64 only."*
The code says otherwise. Counting every `padding`/`margin`/`gap` literal across global +
inline CSS:

```
83 × 1rem      70 × 0.5rem    69 × 0.75rem   57 × 0.35rem   47 × 1.25rem
44 × 0.85rem   37 × 0.15rem   35 × 0.65rem   28 × 1.5rem    27 × 0.45rem
25 × 0.55rem   22 × 0.25rem   21 × 0.2rem    17 × 0.4rem    15 × 1.1rem
```

`0.35rem`, `0.85rem`, `0.15rem`, `0.65rem`, `0.45rem`, `0.55rem` — **225 uses of values
that are not on any 4px or 8px grid** and have no Tailwind equivalent. Same story in type:
**41 distinct `font-size` values**, led by `0.8125rem` (61×), `0.875rem` (58×),
`0.9375rem` (45×). And in geometry: **25 distinct `border-radius` and 34 distinct
`box-shadow` values in the inline CSS, plus 23 and 34 more in the global CSS.**

This is the fork in the road, and **it is not yours to decide alone**:

- **Snap to scale** — `0.35rem → p-1.5` (0.375rem), `0.85rem → p-3.5` (0.875rem). Every
  screen shifts by 0.4–1px in dozens of places. Cheap, clean, and a real visual diff on
  a product with a frozen design system.
- **Preserve exactly** — `p-[0.35rem]` everywhere. Zero visual diff, and an output that
  is Tailwind in syntax only. You have replaced a design system with 225 magic numbers.

**Stop and ask before choosing.** The honest recommendation is: snap Studio (actively
being redesigned under the Ash/Obsidian registers — see §2), preserve Guest and Operate
(frozen), and log every snap in a diff table the owner can review screen by screen.

**Finding 5 — There is a CI ratchet that this migration can silently defeat.**
`scripts/check-page-hex.mjs` runs on every PR (`.github/workflows/ci.yml`). It scans the
`styles:` block of `apps/web/src/app/pages/*.page.ts` for hex literals, holds a
`KNOWN_OPEN` list of **25 files**, and **fails CI on any new file with hex in its styles
block**. It exists because `docs/LEK-026` principle 4 is *"Tokens before hex in
components — components reference CSS variables, never raw brand hex in TS templates."*

There are currently **457 hex literals (78 distinct) in inline component CSS** and
**160 (26 distinct) in the global CSS**.

The trap: the checker reads **only the `styles:` block**. Move a colour into the template
as `class="bg-[#0f172a]"` and the hex is still there, still drifting, and now **invisible
to CI**. A naive conversion will make `check:page-hex` go green while making the problem
worse.

**Therefore: arbitrary colour values are forbidden in this migration** (§3), and
extending the checker to scan `template:` blocks for `-[#…]` is Phase 1 work, not
optional cleanup.

### 0.3 What is genuinely worth doing here

Be clear-eyed. A 236 KB flat-CSS codebase with **165 custom properties**, **zero Sass**,
and a mature token vocabulary is *already* most of what Tailwind gives you. The wins that
are real:

1. **98 of 316 global class definitions (31%) are never referenced anywhere in `app/`.**
   Migration is the excuse to delete them. Don't port dead CSS.
2. **522 class names live only inside one component's own styles block.** Most are
   one-use layout wrappers — `display:flex; gap; align-items` — exactly what utilities
   replace well.
3. **The hex problem.** 445 `var(--…)` reads vs 457 raw hex in inline CSS: roughly half
   the component CSS bypasses the token system. Utilities backed by `@theme` make the
   token the path of least resistance.

The wins that are **not** real, and that you should not claim:
bundle size (utilities plus 92 KB of retained component CSS is not smaller), and
"consistency" as an abstract virtue — the inconsistency is in the values (Finding 4),
and Tailwind does not fix that unless someone decides the values.

### 0.4 Re-measure before you start

```bash
cd C:\Lekki
node -e "
const fs=require('fs'),path=require('path');
const files=[];(function w(d){for(const e of fs.readdirSync(d,{withFileTypes:true})){
  const p=path.join(d,e.name); if(e.isDirectory())w(p);
  else if(e.name.endsWith('.ts')&&!e.name.endsWith('.test.ts'))files.push(p);}})('apps/web/src/app');
let css='',tpl='';
for(const f of files){const s=fs.readFileSync(f,'utf8');
  const m=s.match(/styles:\s*\[([\s\S]*?)\n\s*\],?\n/); if(m)css+=m[1]+'\n';
  const t=s.match(/template:\s*\`([\s\S]*?)\`,\n/); if(t)tpl+=t[1]+'\n';}
console.log('components',files.length,'inlineCSS',css.length,'inlineTPL',tpl.length);
console.log('decls',(css.match(/^\s*[a-z-]+\s*:/gm)||[]).length);
console.log('hex',(css.match(/#[0-9a-fA-F]{3,8}\b/g)||[]).length);
console.log('var()',(css.match(/var\(--/g)||[]).length);
"
pnpm run check:page-hex
cd apps/web && pnpm build          # capture the baseline bundle report
```

---

## 1 · Non-negotiable invariants

Break any of these and the work is rejected regardless of how good the Tailwind looks.

1. **`pnpm run check:page-hex` passes, and `KNOWN_OPEN` never grows.** Shrinking it is
   the only acceptable direction.
2. **`pnpm run check:nouns` passes.** Untouched by styling, but prove it.
3. **The five studio unit tests in `ci.yml` pass** (`golive-gate`, `live-facts`,
   `golive-confirm`, `hub-recession`, `menu-list-import`).
4. **`pnpm --filter @lekki/web build` succeeds** and stays inside the production budget
   in `angular.json` (`initial`: warn 1 MB, error 2 MB). Note that **CI does not currently
   run this build** — you are the only thing standing between a broken build and `main`.
   Adding an `ng build` step to `ci.yml` is in scope.
5. **Token names survive.** `--leos-*` and `--studio-*` are referenced by 165 definitions
   and are the published contract in `docs/LEK-026-leds-visual-language.md` §10 and
   `docs/ux/lves.md`. Tailwind's `@theme` **aliases** them; it does not replace them.
   `--color-action: var(--leos-action);` — never the reverse.
6. **The Ash / Obsidian registers keep their exact semantics.** `_registers.scss` was
   written on 15 September 2026 and is the live output of a design decision (§2). `.leos-register--ash`
   and `.leos-register--cinematic` are **context classes that redefine custom properties**.
   They are not themes, not a dark-mode toggle, and must not become `dark:` variants.
7. **The emboss stays off `box-shadow` transitions.** `.leos-emboss::after` animates
   `opacity` and `transform` only, deliberately, for GPU compositing. Any conversion that
   produces a `transition-shadow` utility on that element is wrong.
8. **`@media (prefers-contrast: more)` and all 10 `prefers-reduced-motion` blocks survive
   behaviourally.** These are accessibility commitments, not styling.
9. **Emulated view encapsulation stays.** There are **0 `::ng-deep`** and **0
   `ViewEncapsulation` overrides** in the app today. That is an asset. Do not introduce
   either to solve a cascade problem — fix the layer instead (Finding 2).

---

## 2 · Frozen ground — do not restyle while converting

This is a mechanical conversion. It is **not** a redesign, and several areas are under
active design work whose decisions you would overwrite.

**Do not change the rendered appearance of:**

- Setup Engine v1, the Experience shell, the Studio shell, and the core guest journey.
- Anything under `docs/ux/` — read it, never edit it.
- `_registers.scss`, `_tokens.scss` — their *values* are frozen; only their *file
  extension and import position* change.

**Design decisions already made, which the conversion must preserve exactly:**

- The app ground is `#00070d` (`app.component.ts:30`, in the root component's inline `:host`). The Studio card is
  `color-mix(in srgb, var(--studio-surface) 90%, transparent)` over it with `blur(8px)`,
  compositing to **≈`#e6e6e7`** — *not* `#ffffff`. Every contrast decision in the repo
  assumes the composite. On it: `#64748b` is 3.82:1 (**fails AA**), `#475569` is 6.08:1,
  `#3d6f55` is 4.67:1, black is ≈15.4:1.
- **Studio actions are solid black** (`--leos-ash-action: #0a0a0a`). Gold `#d7a14a` is
  `--leos-action-peak` and appears **exactly once** in the setup journey, on
  *Open for guests*. Guest Pay keeps `:root --leos-action` gold.
- WCAG 1.4.11: any **control boundary** needs 3:1. A soft emboss on a same-colour surface
  is 1.2–1.8:1 and can never carry one — which is why every raised row also has a real
  hairline, and why controls are solid. Do not let a utility conversion drop a hairline
  because "the shadow reads as an edge".

---

## 3 · Forbidden moves

- ❌ `@apply`, in any file, for any reason. (Finding 3)
- ❌ `@reference`. (Finding 3)
- ❌ Arbitrary **colour** values in templates — `bg-[#0f172a]`, `text-[rgb(…)]`,
  `border-[#d8d2c9]`. Colours come from `@theme` aliases of `--leos-*` / `--studio-*`.
  (Finding 5)
- ❌ `!important` and `!` utility modifiers to win a cascade fight. Fix the layer.
- ❌ `::ng-deep`, `ViewEncapsulation.None`, `:host ::ng-deep`.
- ❌ `dark:` variants. There is no dark mode; Obsidian is a fixed context class. (§2, inv. 6)
- ❌ Renaming or deleting `--leos-*` / `--studio-*` custom properties.
- ❌ Converting Guest or Operate screens in the same commit as Studio screens.
- ❌ `rm` / `rmdir` / `unlink` on anything under `C:\Lekki`. Move unwanted files to
  `C:\Lekki\_to_delete\` (it already exists) and say what you moved there.
- ❌ Adding GSAP, Lenis, Three.js or any animation library to `apps/web`. Marketing site only.
- ❌ Touching `.env` (gitignored, must stay so).

---

## 4 · Phases

Each phase is a separate commit with its own proof. **Do not start a phase before the
previous one's verification has actually run and passed** — not "should pass".

### Phase 0 — Prove the premise (no product code changes)

Goal: establish that Tailwind can coexist here at all, on a throwaway branch, before
anyone rewrites a screen.

1. `pnpm --filter @lekki/web add -D tailwindcss @tailwindcss/postcss postcss` (verify the resolved
   `tailwindcss` version — latest at time of writing is **4.3.3**).
2. Create `apps/web/.postcssrc.json`:
   ```json
   { "plugins": { "@tailwindcss/postcss": {} } }
   ```
   Confirmed compatible: the **application builder reads `.postcssrc.json`**; the legacy
   webpack builder does not. `angular.json` uses
   `@angular-devkit/build-angular:application`. ✔
3. Rename `src/styles.scss` → `src/styles.css`, update `angular.json` `styles[]`, and
   rewrite it as the four-line import block in Finding 2 (renaming the partials to
   `.css` and dropping the leading underscore).
4. **Prove the cascade.** Add a throwaway element carrying both `.leos-btn--primary` and
   `bg-black`. Screenshot it before and after adding `layer(components)`. If the utility
   does not win after layering, **stop and report** — nothing else in this plan is safe.
5. **Prove content detection.** Add `class="outline-4"` inside an inline `template:`
   string in a `.ts` file and confirm the utility is emitted. Angular keeps templates in
   `.ts` string literals; Tailwind v4's automatic source detection should see them, but
   *prove it*, and add an explicit `@source` if it does not.
6. **Prove the budget.** Build and compare the initial bundle against the Phase-0 baseline.

**Verify:** `pnpm --filter @lekki/web build` · `check:page-hex` · `check:nouns` · the five
studio tests · visual spot-check of Studio home, Guest menu, and Operate board.
**Report:** the three proofs (cascade, detection, budget) with numbers. Then stop for review.

### Phase 1 — Theme + guardrails (no component changes)

1. Author `@theme` in `styles.css` as a **thin alias layer** over the existing tokens.
   Aliases only — no new values:
   ```css
   @theme {
     --color-ink:        var(--leos-ink);          /* #0f172a */
     --color-ink-body:   var(--leos-ink-body);     /* #475569 */
     --color-action:     var(--leos-ash-action);   /* #0a0a0a */
     --color-peak:       var(--leos-action-peak);  /* #d7a14a */
     --color-hairline:   var(--leos-border);
     --color-field:      var(--leos-ash-field-border);
     --radius-card:      var(--leos-radius-card);
     --radius-button:    var(--leos-radius-button);
     --ease-leos:        var(--leos-ease);
     --font-sans:        var(--leos-font-sans);
     --font-display:     var(--leos-font-display);
   }
   ```
   Cover every token a converted screen will need. Keep the mapping in one table in the
   commit message so review is possible.
2. **Decide the breakpoints.** The app currently uses **13 distinct width conditions
   across 10 distinct widths** — 640, 720, 768, 800, 860, 900, 960, 1023, 1100, 1280 —
   of which only 640 and 768 match a Tailwind default. Either declare `--breakpoint-*` for the real set, or agree a
   reduction with the owner. **Do not** silently reassign a 900px query to `lg` (1024px).
3. **Extend `check-page-hex.mjs`** to also scan `template:` blocks for arbitrary-value
   colour syntax (`-[#…]`, `-[rgb(`, `-[hsl(`, `-[oklch(`). Seed nothing into
   `KNOWN_OPEN` — templates are clean today and must stay that way. (Finding 5)
4. **Add `ng build` to `.github/workflows/ci.yml`.** (Invariant 4)

**Verify:** build green, both ratchets green, **zero visual change** — this phase emits no
new rules. Prove that with before/after screenshots of three screens, not by assertion.

### Phase 2 — Delete the dead

**98 class definitions in the global CSS are referenced nowhere in `apps/web/src/app`.**
Confirm each one independently (search `.ts`, `.html`, and string literals — some class
names are composed in TypeScript), then remove them. Start from this measured list:

```
leos-workspace{,__header,__brand,__tagline,__nav,__main}  leos-neo-dock{,__trigger,__drawer}
leos-live-moment{,__place,__actions}   leos-pill{,--pending,--ready,--preparing}
leos-qty{,__btn,__icon,__value}        leos-station-{ticket,summary,lanes,lane__title}
leos-wait-reassure{,__pulse}           leos-{cart-summary,order-total,receive-moment}
leos-payment-summary__{amount,trust,status}  leos-{item-row,context-banner,layout-operator}
leos-btn--operator  leos-visual-card--selected  leos-line-item__total  gb__pulse  is-active
```

This is the largest genuine win available and it costs no visual risk.

**Verify:** build green · full visual sweep of every route in `app.routes.ts` · both
ratchets. A deleted-but-live class shows up as an unstyled element, so **look at every
screen**.

### Phase 3 — One pilot screen, end to end

Pick **`studio-home.page.ts`** (8,437 bytes, the Checklist Hub, actively under redesign,
not on the `KNOWN_OPEN` hex list). Convert it completely:

- Layout, spacing, type and colour move to utilities in the template.
- Its inline `styles:` block shrinks to only what utilities genuinely cannot express:
  `@keyframes`, `:host`, complex `::before`/`::after`, `color-mix()` composites.
- Any spacing snap is recorded in a table: `old value → utility → delta in px`.

**Verify:** pixel-diff the screen against `main` at 390px, 768px and 1440px. Every
non-zero delta is explained in the commit message or reverted. `check:page-hex` green.
**Then stop.** This screen is the template for everything after it — get it reviewed.

### Phase 4 — Studio setup surfaces

Only after Phase 3 is signed off. In this order, one commit each:

`setup-identity` → `setup-places` → `setup-operate` → `setup-payments` → `setup-payfast`
→ `setup-integrations` → `setup-engine-host` → `setup-golive-engine` → `studio-menu`
→ `studio-team` → `studio-signin`

Notes that will bite you:
- `studio-team.page.ts` carries **16,884 bytes** of inline CSS — the second largest block
  in the app. Budget for it accordingly.
- `setup-golive-engine.page.ts` is the **one page already cleared off `KNOWN_OPEN`**. It
  must not regress.
- `setup-operate.page.ts:116` holds the app's **only** `[class]="ternary"` binding, and
  both branches are class-name string literals. Tailwind's scanner reads string literals,
  but verify the emitted CSS contains both branches' classes before you trust it.
- `studio-signin.page.ts` renders in the **Obsidian** register. Convert it last in this
  group and check it against `_registers.scss`, not against the Ash values.

**Verify per commit:** build · both ratchets · pixel-diff that one screen at three widths.

### Phase 5 — Operate and station surfaces

`station.page.ts` (8,875 B inline CSS), `service.page.ts` (13,466 B),
`setup-pilot.page.ts`, `scan-qr.page.ts`, `staff-entry.page.ts`.

`station.page.ts` and `service.page.ts` contain the `:host.leos-station-board--embed …`
and `:host.leos-service-board--embed …` selector families — **14 host-context rules
(12 + 2) that have no utility equivalent.** They stay as CSS. Do not force them.

### Phase 6 — Guest journey (highest risk, decide separately)

`guest.page.ts` (37,975 B), `guest-shell-projection.component.ts` (8,822 B inline CSS),
`live-experience-panel.component.ts` (8,261 B), `guest-bill.component.ts` (6,787 B),
`guest-orders.component.ts`, `guest-choices-sheet`, `guest-payment-methods-panel`.

Guest is frozen, is the revenue path, and keeps gold as its action colour. **Get explicit
approval before starting Phase 6**, and consider not doing it at all — Phases 0–5 deliver
most of the value.

`website-home.page.ts` (**17,109 B inline CSS**, the single largest block) is the
marketing site. It is a different visual system with different rules, and it should be
its own decision — probably its own phase, possibly never.

### Phase 7 — Close out

- Update `docs/LEK-026-leds-visual-language.md` §10 and `docs/ux/lves.md` with the
  `@theme` alias table. (§10 requires tokens and doc to change together.)
- Write `docs/tailwind-conversion-log.md`: every spacing snap, every deleted class, every
  screen converted, and everything deliberately left as CSS with the reason.
- Shrink `KNOWN_OPEN` in `check-page-hex.mjs` by every page you cleaned.

---

## 5 · What stays CSS, permanently

Do not treat these as failures to convert. Utilities are wrong for them:

| Construct | Count | Why it stays |
|---|---|---|
| `@keyframes` | 32 (12 global, 20 inline) | No utility form. |
| `:host` / `:host(...)` / `:host.x y` | 21 occurrences in inline CSS | Angular host context; no equivalent. |
| `color-mix(...)` | 81 | The glass composite depends on it; arbitrary values would inline a hex. |
| `backdrop-filter` | 36 | Keep as declared; `backdrop-blur-*` loses the exact radius. |
| `::before` / `::after` content | 10 | Halo and emboss pseudo-elements (`_registers.scss`). |
| `:has(...)` | 4 | Verify each against Tailwind's `has-*` before converting; default to leaving. |
| `[data-*]` selectors | 113 (69 global, 44 inline) | Convert only where `data-*` variants read *more* clearly. Shell state like `[data-setup-engine='true']` stays. |
| `prefers-contrast` / `prefers-reduced-motion` | 1 + 10 | Accessibility contracts. Behaviour must be identical after. |

---

## 6 · Report back with

1. The Phase-0 proofs: cascade, content detection, bundle delta — **with numbers**.
2. Your answer to Finding 4 (snap vs preserve), per surface, with the diff table.
3. Per phase: `build` result, both ratchet results, and the pixel-diff evidence.
4. An honest list of what you could not convert and why, and of anything you converted
   that you are not confident about.
5. Anything in §0 you re-measured and found to be **wrong**. That is the most valuable
   thing you can report, and it is expected — the tree moves.

---

## Appendix — verified sources

- Tailwind CSS latest version **4.3.3** — `https://registry.npmjs.org/tailwindcss/latest`
- Angular's official Tailwind guide (`.postcssrc.json`, `@tailwindcss/postcss`,
  `@use 'tailwindcss'` for SCSS) — https://angular.dev/guide/tailwind
- Tailwind's Angular install guide — https://tailwindcss.com/docs/installation/framework-guides/angular
- "not designed to be used with CSS preprocessors like Sass, Less, or Stylus" —
  https://tailwindcss.com/docs/compatibility
- `@reference` requirement for `@apply` in scoped styles —
  https://tailwindcss.com/docs/functions-and-directives
- Cascade layers: unlayered CSS beats layered utilities; `layer(components)` is the
  recommended fix — https://github.com/tailwindlabs/tailwindcss/discussions/16578
- `@apply` + `@reference` cost in Angular (38s → 3m40s) and the `host:` alternative —
  https://github.com/tailwindlabs/tailwindcss/discussions/17416
