# Landing page motion audit — `/` (`website-home.page.ts` + `website-horizon.component.ts`)

16 September 2026. Measured against the working tree and against the prerendered
`dist/web/browser/index.html`. Every number here is counted, not estimated.

---

## 1 · The complete inventory

The whole animation surface of the landing page is **six things**. That is worth
saying up front, because the page reads as more animated than it is — and because
the problems are concentrated, not diffuse.

| # | What | Trigger | Spec | Reduced-motion |
|---|---|---|---|---|
| 1 | `lk-rise` — hero chip, title, lead, CTA | page load (CSS only) | `900ms cubic-bezier(.22,1,.36,1)`, delays 80/180/280/380 | gated ✔ |
| 2 | `lk-rise` — hero app mockup (`data-rise-late`) | page load | `1100ms`, delay `520ms`, from `translateY(40px)` | gated ✔ |
| 3 | `hz-fadein` — four horizon ridges | page load | `900ms cubic-bezier(.16,1,.3,1)`, delays 40/90/140/190 | gated ✔ |
| 4 | Ridge parallax + hero-copy fade | scroll (rAF, outside Angular's zone) | `translate3d` at lag 0.62 / 0.44 / 0.28 / 0.18 / 0.13; copy opacity `1-(y/0.92vh)^2.1` | bails out ✔ |
| 5 | `.lk-ink` dim → lit | IntersectionObserver, `threshold 0.4` | `transition: color 900ms` | handled in TS ✔ |
| 6 | `.lk-pill:hover` | hover | `translateY(-1px)`, `transition … transform 160ms` | not gated |

And that is genuinely all of it. One keyframe in each file, two `transition`
declarations in the whole 38 KB page, three `:hover` rules, **zero `:focus`
rules**.

The engineering underneath #4 is good and should be said so: `runOutsideAngular`,
rAF-coalesced, `passive: true` listeners, `translate3d` and `opacity` only,
`contain: layout paint` on the canvas variant, and a clean `ngOnDestroy`. That is
a correctly built scroll effect.

---

## 2 · The finding that outranks everything else

**The page's core value proposition is invisible until JavaScript boots.**

`.lk-ink` — the three "What Lekki is" paragraphs, the only place the page explains
what the product does — is styled `color: rgba(255, 243, 240, 0.28)` and only
reaches full colour when an IntersectionObserver adds `.is-lit`.

Over the `#00070d` ground that unlit state composites to `#47494d`:

| State | Composite | Contrast on `#00070d` | WCAG AA (4.5:1) |
|---|---|---|---|
| Unlit `.lk-ink` | `#47494d` | **2.25:1** | **fails** |
| Lit `.lk-ink` | `#fff3f0` | 18.66:1 | passes |

This is not theoretical. `angular.json` sets `"outputMode": "static"`, and
`dist/web/prerendered-routes.json` confirms `/` is prerendered. The shipped HTML
contains:

```html
<p class="lk-ink">Lekki is an experience platform built for restaurants…</p>
<p class="lk-ink">That QR is yours. …</p>
<p class="lk-ink">You set it up in minutes. …</p>
```

Three `class="lk-ink"`, **zero `is-lit`** — and the inline `<style>` in that same
prerendered file carries `rgba(255, 243, 240, 0.28)`. So between first paint and
hydration, and permanently if the bundle fails, the page's entire explanation of
itself sits at 2.25:1 on a dark field.

The reduced-motion branch is handled correctly in TypeScript
(`if (this.reducedMotion) items.forEach(el => el.classList.add('is-lit'))`) — but
that is still JavaScript. The failure mode is not "no animation", it is "no text".

**Fix, and it is small:** make lit the default in CSS and let JS remove it, not add
it. `.lk-ink { color: #fff3f0 }`, and only inside
`@media (prefers-reduced-motion: no-preference)` does a `js-ready` class on the
host dim it. Then no-JS, slow-JS and broken-JS all render readable text, and the
effect becomes a genuine progressive enhancement instead of a dependency.

**Second issue in the same mechanism:** the observer uses
`classList.toggle('is-lit', entry.isIntersecting)`, so paragraphs **dim again when
they leave the viewport**. Scroll down past the intro and back up and you watch
copy you already read fade out and relight over 900ms. A reveal should be a
one-way latch — `if (entry.isIntersecting) { add; unobserve; }`.

---

## 3 · Everything is two to four times too slow

Two independent yardsticks, both exceeded.

**Your own frozen spec** — `docs/ux/leos-motion-system.md` and LVES 2.0:
Appear = **280ms** fade + rise · Micro = **160–220ms** · Success/QR = **360ms**
settle.

**NN/g** ([Executing UX Animations](https://www.nngroup.com/articles/animation-duration/)):
"the duration of most animations should be in the range of 100–500 ms", and at
500ms "animations start to feel like a real drag for users — they become
cumbersome and annoying."

What the page actually does:

| Element | Delay | Duration | Fully arrived |
|---|---|---|---|
| Chip | 80ms | 900ms | 980ms |
| H1 | 180ms | 900ms | 1,080ms |
| Lead | 280ms | 900ms | 1,180ms |
| **CTA — "Get started free"** | 380ms | 900ms | **1,280ms** |
| App mockup | 520ms | 1,100ms | **1,620ms** |
| Ridges (last) | 190ms | 900ms | 1,090ms |

The primary conversion action is not fully present for **1.28 seconds**, and the
hero does not stop moving for **1.62 seconds**. Against a 280ms "Appear" spec that
is 3.2× and 3.9×.

This is the opposite of cognitive fluency. Fluency is the feeling that something
was *easy to process*, and it is manufactured by removing the delay between
looking and understanding. A 900ms rise inserts nearly a second of "not yet"
between the user's eye landing on the headline and the headline being legible —
and because opacity starts at 0, they cannot even read ahead while they wait.

**Recommendation:** 280ms rise, stagger 60ms (the value already tokenised as
`--leos-stagger`), `translateY(12px)` not 18/40px. Whole hero lands in ~520ms
instead of 1,620ms. The choreography survives; the waiting does not.

Also: the hero uses `cubic-bezier(.22,1,.36,1)` — that is `--leos-ease` exactly,
good — but the horizon defines its own `--enter: cubic-bezier(.16,1,.3,1)`. Two
different eases for the same gesture, one of them not a token. Collapse to one.

---

## 4 · The micro-interactions that are missing

This is where the page is genuinely thin. Three named, interactive components have
**no motion at all**, because Angular's control flow adds and removes DOM instantly:

**The FAQ accordion.** `@if (faqOpen === i) { … }` — the answer pops into
existence. The `+` / `–` glyph swaps between two characters with no rotation.
This is the single most conventional micro-interaction in web UI and the page
doesn't have it. A 200ms height/opacity reveal and a 45° glyph rotation is the
cheapest credibility the page can buy.

**The feature tabs.** `@switch (feature)` swaps the panel with a hard cut, and
`[class.is-on]` has no transition on the tab itself. Nothing tells the eye where
the new content came from, so every tab change costs a re-orientation.

**The mobile menu.** `@if (menuOpen)` — appears instantly, full-screen, on a
dark ground. Of everything here this is the most jarring, because it is the
largest area changing with zero transition.

**Focus states — the real accessibility gap.** `:focus-visible` appears in
**exactly one file in the entire application** (`setup-payfast.page.ts`), and not
on this page. Nav links, both pill buttons, the FAQ triggers and the tab buttons
all fall back to the UA default ring, on a `#00070d` ground where it reads poorly.
Every one of those is also a micro-interaction opportunity being thrown away.

**A dead transition.** `.lk-pill` declares
`transition: background 180ms ease, transform 160ms ease, border-color 180ms ease`
but `.lk-pill:hover` only sets `transform: translateY(-1px)`. Two of the three
transitioned properties never change. Either give the hover a background and
border shift, or stop declaring transitions for things that don't move.

**A boundary that fails 1.4.11.** `.lk-pill--ghost` has
`border-color: rgba(255,255,255,0.12)` = **1.31:1** against the ground. WCAG 1.4.11
wants 3:1 on a control boundary. Same class of problem as `--leos-border` in the
product, same fix: a real hairline value.

---

## 5 · Cognitive fluency: the read

Fluency has two levers — **perceptual** (how easily the eye resolves it) and
**conceptual** (how easily the mind places it). The page is strong on one and
actively working against itself on the other.

**Perceptual — strong.** One ground colour. One type family. Enormous negative
space. The layered ridges give real depth without decoration. The hero mockup
shows the product rather than describing it. This is a page with taste.

**Conceptual — undermined by its own motion.** The three things that explain what
Lekki *is* are the `.lk-ink` paragraphs, and they are the one element deliberately
rendered hard to read until scrolled to. The mechanism that was meant to make them
feel considered is the mechanism making them illegible. That is the whole finding
in one sentence: **the page dims its argument to make the dimming look
intentional.**

**Peak-end.** Peak-end says spend the motion budget at the moment that matters and
keep the rest still. The current budget is spent almost entirely on arrival —
1.6 seconds of hero — and nothing at all on the two moments a visitor actually
makes a decision: opening the FAQ (resolving doubt) and pressing *Get started free*
(committing). The CTA gets a 1px lift, which is less feedback than the ridges get.

The inversion to aim for: **make arrival fast and make commitment felt.**

---

## 6 · What to change, ranked

1. **Invert `.lk-ink`'s default to lit.** CSS ships readable; JS dims as an
   enhancement. Fixes a 2.25:1 AA failure on the prerendered page and removes a
   JavaScript dependency from the product's core message. *One rule and three lines
   of TS.*
2. **Latch the reveal.** `unobserve` after lighting, so read copy never re-dims.
3. **900ms → 280ms, 1100ms → 360ms, stagger 60ms, travel 12px.** Hero settles in
   ~520ms. Brings the page inside both the LVES spec and NN/g's 500ms ceiling.
4. **Give the FAQ accordion a 200ms reveal and rotate the glyph 45°.** Highest
   perceived-quality gain per line of code on the page.
5. **Add `:focus-visible` rings** to every interactive element, using the existing
   `--leos-shadow-focus` token. Accessibility and micro-interaction in one pass.
6. **Crossfade the feature panel** (160ms opacity) and **slide the mobile menu**
   (200ms), both gated on `prefers-reduced-motion`.
7. **Fix `.lk-pill`'s dead transition** and raise `--ghost`'s border to 3:1.
8. **Collapse `--enter` into `--leos-ease`.** One ease.
9. **Cache `offsetHeight`** in `paint()` on resize instead of reading it every
   scroll frame — it is a layout-forcing read inside rAF.

---

## 7 · One thing to settle, not a bug

`docs/ux/premium-direction-plan.md` lists **parallax** under Forbidden motion. The
landing page is built on it (five lagged layers). That rule was written for Studio,
where it is right — but it is currently written as if it applies everywhere, and it
doesn't say the marketing site is exempt. Either scope the rule to the product or
scope the parallax out of the site. Right now the doc and the code disagree in
writing.

---

## Appendix — fragile, not broken

`[data-rise]:nth-of-type(1)` sets an 80ms delay on the first element *of each tag
type* among its siblings. Inside `.lk-hero__copy` that means it also matches the
`<h1>` and the `<a>`, not just the intended `<p class="lk-chip">`. It renders
correctly today only because `.lk-hero__title[data-rise]` (0,2,1) and
`.lk-hero__cta[data-rise]` (0,2,1) out-specify it (0,2,0). Insert another `<a>` or
reorder the hero and the delays shuffle silently. Use an explicit class.

## Sources

- [NN/g — Executing UX Animations: Duration and Motion Characteristics](https://www.nngroup.com/articles/animation-duration/)
- `docs/ux/leos-motion-system.md` (Frozen) · `docs/ux/lves.md` · `docs/ux/premium-direction-plan.md`
- `apps/web/dist/web/browser/index.html` (prerendered `/`, 47,265 bytes)
