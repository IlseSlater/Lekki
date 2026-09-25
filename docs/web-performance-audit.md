# `apps/web` — performance and design integrity audit

**Status:** Active · 2 of 12 findings closed (§2, §4) · **Owns:** what is slow and why
**Measured:** 16 September 2026, against the working tree and `dist/web/browser`.
Every number was counted with a script, not estimated. Where I could not measure
something I say so rather than guess.

---

## What is already healthy

Worth establishing first, because it changes what the findings mean. This is not
a neglected codebase.

- **Timers and listeners are balanced.** 5 `setInterval` sites, every one with a
  matching `clearInterval`. 4 `addEventListener`, 4 `removeEventListener`. No leaks.
- **`@for` hygiene is near-perfect** — 60 blocks, 58 with a real `track` key.
- **Every route is lazy** (`loadComponent` throughout), and `SigninPreloadStrategy`
  preloads exactly one route on purpose.
- **`app.config.ts` already does the right things**: `eventCoalescing: true`,
  `provideClientHydration(withEventReplay())`, `provideHttpClient(withFetch())`.
- **Component CSS is not duplicated.** I diffed every rule across all 41 inline
  style blocks: only 4 rules repeat, totalling **311 bytes**. The styles are
  genuinely distinct — there is no copy-paste debt here.
- **Zero `::ng-deep`, zero `ViewEncapsulation.None`.** Encapsulation is intact.
- The horizon parallax uses `runOutsideAngular`, rAF coalescing, passive listeners
  and transform/opacity only. Correctly built.

---

## 1 · The change-detection story — the finding that dominates everything

| Measure | Count |
|---|---|
| Components | **63** |
| …using `ChangeDetectionStrategy.OnPush` | **1** |
| …using default change detection | **62** |
| Function calls evaluated in templates | **126** |
| Getters referenced from templates | **170** |
| **Total expressions re-run per CD pass** | **296** |
| `signal(` / `computed(` | 7 / **0** |
| Zoneless | no — `provideZoneChangeDetection` |

Under zone.js with default change detection, every one of those 296 expressions is
re-evaluated on **every** tick — every click, every HTTP response, every timer, every
socket message, across the whole component tree.

**And the polling is in-zone.** `runOutsideAngular` appears exactly once in the app,
in the marketing parallax. Everything else runs inside:

| Source | Interval |
|---|---|
| `guest-session.service.ts:1192` | **3s** (8s when the socket is connected) |
| `setup-operate.page.ts` | **5s** |
| `service.page.ts:1061` | poll + `nowMs` tick |
| `station.page.ts:725, :764` | 30s age tick + poll |
| `leos-api.service.ts:844` | socket.io — every inbound message is a tick |

So on the guest screen, **every 3 seconds** the whole tree re-renders and all 296
expressions run again.

**The getters are not cheap property reads.** I read them. A representative sample:

```ts
// studio-team.page.ts — copies, sorts with Intl collation, then filters. Per pass.
get visibleMembers(): TeamMember[] {
  const sorted = [...this.members].sort((a, b) =>
    this.personName(a).localeCompare(this.personName(b), undefined, { sensitivity: 'base' }));
  if (this.sectionFilter === 'all') return sorted;
  return sorted.filter((m) => m.role === this.sectionFilter);
}

// service.page.ts — filter with a service call per item. Per pass.
get visibleStations() {
  return this.stations.filter((s) => this.staffSession.canAccessRole(s.role));
}

// guest-bill.component.ts — allocates new objects via spread + map. Per pass.
get displayLines(): BillDisplayLine[] { … return base.map((l, i) => ({ ...l, id: `agg-${i}`, … })); }

// guest-shell-projection.component.ts — rebuilds the array. Per pass.
get categoryChips(): string[] { return categoriesFromDesign(…).filter(…); }
```

Each returns a **new array reference every call**. Three consequences:

1. `@for` over them sees a fresh array identity on every pass, so the differ runs
   even though the `track` keys are correct.
2. They are garbage-generating on a 3-second loop on a phone.
3. **They make OnPush impossible** until they change. This is the real cost — it is
   not just slow today, it is blocking the fix.

Concentration is extreme: **`guest.page.ts` has 74 getters and 24 function calls in
one template** — 98 expressions on the guest-facing revenue path, on mobile.

**The fix, in order:**

1. Convert allocating getters to fields recomputed on input change — or to
   `computed()` signals, which memoise on dependency identity and are the idiomatic
   Angular 19 answer. Start with `guest.page.ts`, `service.page.ts`,
   `station.page.ts`, `studio-team.page.ts` — that is roughly 110 of the 296.
2. Move every `setInterval` into `runOutsideAngular`, and re-enter with
   `zone.run()` only around the state write.
3. Then adopt `OnPush` component by component. It is safe only after step 1.

Do not attempt zoneless yet. With 62 default-CD components and 296 template
expressions it would surface a long tail of missing-update bugs.

---

## 2 · The service worker undid a deliberate routing decision — **FIXED**

Closed 16 Sep 2026. The policy is now written once, in
[ADR-005: One Loading Policy](adr/005-loading-policy.md). What follows is the
evidence that led there; keep it, because the failure mode recurs whenever one
policy lives in two files.

`signin-preload.strategy.ts` carries this comment:

> `/** Warm Studio sign-in only. Preloading every lazy page freezes Login. */`

Someone measured that and made the right call. But `ngsw-config.json` said:

```json
{ "name": "app", "installMode": "prefetch",
  "resources": { "files": ["/favicon.ico", "/index.html", "/*.css", "/*.js"] } }
```

`installMode: "prefetch"` over `/*.js` means the service worker **eagerly downloads
every chunk in the app** on install — all of Studio, Guest, Operate, the setup
engine — for a visitor who arrived on the marketing page and may never sign in. The
router's careful restraint is cancelled by a glob nobody revisited. The service
worker is enabled only in the production config, so this does not show in dev.

Also `"dataGroups": []` — there is no caching strategy for API responses at all,
on an app that polls every 3 seconds.

**Fix, applied:** the shell is `prefetch`; route chunks are `lazy` with
`updateMode: "prefetch"`, so they are never fetched until used but stay fresh once
cached. `brand/**` is now cached lazily; previously it was not cached at all.

```json
"assetGroups": [
  { "name": "shell",  "installMode": "prefetch", "updateMode": "prefetch",
    "resources": { "files": ["/favicon.ico", "/index.html", "/manifest.webmanifest",
                             "/*.css", "/main*.js", "/polyfills*.js"] } },
  { "name": "routes", "installMode": "lazy",     "updateMode": "prefetch",
    "resources": { "files": ["/chunk-*.js"] } },
  { "name": "brand",  "installMode": "lazy",     "updateMode": "prefetch",
    "resources": { "files": ["/brand/**"] } }
]
```

The globs carry `*` before `.js` because production sets `outputHashing: "all"` —
the entry points ship as `main-<hash>.js`, not `main.js`. A glob written against the
development output would silently cache nothing in production.

`dataGroups` stays empty, and that is a decision rather than an omission: the guest
path polls every 3 s and the Operate boards read fulfilment state, where a stale
order is worse than a missing one. Offline writes belong to `offline-queue.ts`.

---

## 3 · Fonts — the design system's own faces are the deferred ones

`src/index.html` loads two Google Fonts stylesheets:

```html
<!-- render-blocking -->
<link href="…css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<!-- deferred -->
<link href="…css2?family=Fraunces:…&family=Sora:…" rel="stylesheet"
      media="print" onload="this.media='all'" />
```

LVES 2.0 says the product's faces are **Sora (UI) and Fraunces (display)**. Inter is
not in the design system — yet it is the one blocking render, and Sora and Fraunces
are the ones deferred behind a `media="print"` trick. Inter is real, not vestigial:
`website-home.page.ts:383` and `studio-signin.page.ts:139` both set
`font-family: Inter, system-ui, sans-serif` — so the landing page and the sign-in
page use a **third typeface outside the system**.

Compounding it, `angular.json` production sets `"optimization": { "fonts": false }`,
which disables Angular's font inlining — so both stylesheets stay as extra
cross-origin round trips on the critical path.

**Fix:** decide whether Inter is in the system. If it is, add it to `--leos-font-*`
and `docs/ux/lves.md`. If it is not — and the docs say it is not — replace those two
`font-family: Inter` declarations with `var(--leos-font-sans)` and drop the
render-blocking link entirely. Then re-enable font optimization.

---

## 4 · Two different `@keyframes` shared one name — **FIXED**

Closed 16 Sep 2026. The payment panel's animation is now `leos-pay-up`, and
`scripts/check-keyframe-collisions.mjs` runs in CI so the class of bug cannot
return. The explanation stays because the underlying fact is not obvious.

`@keyframes` are **global even under emulated view encapsulation** — Angular does not
scope them. There are 36 keyframe definitions across 35 distinct names, and one name
is defined twice with two different bodies:

```ts
// guest-help-sheet.component.ts
@keyframes leos-help-up { from { transform: translateY(1rem);    opacity: .6 } … }

// guest-payment-methods-panel.component.ts
@keyframes leos-help-up { from { transform: translateY(0.75rem); opacity: .6 } … }
```

Both components then run `animation: leos-help-up 0.28s ease-out`. Whichever
stylesheet is injected last wins **for both** — and because both components are lazy
loaded, which one that is depends on the route path the user took. The help sheet
and the payment panel rise by different distances depending on navigation history.

**Fix, applied:** renamed to `leos-pay-up`, plus a CI ratchet. The checker fails on
two definitions of one name with different bodies, and warns on identical duplicates
— which is how it will also nag you to delete the four orphaned `_*.scss` partials
left behind by the Tailwind move. Verified: it exits 1 on the pre-fix tree and 0
after, across 36 definitions and 36 distinct names.

The durable rule: **prefix every component keyframe with its component name.**

---

## 5 · Focus states are effectively absent app-wide

| Measure | Count |
|---|---|
| Interactive elements in templates (`button` / `a` / `input` / `select`) | **309** |
| Files with any `:focus` rule | 6 |
| Files with `:focus-visible` | **1** (`setup-payfast.page.ts`) |

309 controls, one file with a modern focus style. Every other control falls back to
the UA default ring — on `#00070d` grounds and on glass cards, where it reads poorly
or not at all. This is the largest accessibility gap in the app and it is also the
cheapest to close: one global rule in `leos.css` using the existing
`--leos-shadow-focus` token covers all 309 at once.

Related, from the landing-page audit: `.lk-ink` renders at **2.25:1** until
JavaScript adds `.is-lit`, and the prerendered `/` ships it that way.
`--leos-ink-muted` `#94a3b8` (2.56:1 on white) is still used 9 times.

---

## 6 · What I could not measure, and why

**The production bundle.** `dist/web/browser` is a **development build** — `main.js`
and `polyfills.js` carry no content hash, the chunks are unminified with readable
identifiers, and `.map` files are present. So the 1.48 MB `chunk-G52REHE4.js` that
the landing page `modulepreload`s is a dev artifact and I will not report it as a
production figure.

What is structurally true regardless: the prerendered `/` preloads **six chunks plus
polyfills, main and styles** before anything is interactive, and the production
budget in `angular.json` is `initial` warn 1 MB / error 2 MB — **which CI never
checks, because `.github/workflows/ci.yml` does not run a build at all.** It runs
two ratchets and some unit tests.

**First action here is a measurement, not a change:**

```
pnpm --filter @lekki/web build
npx source-map-explorer dist/web/browser/*.js
```

Then add the build to CI so the budget becomes real.

---

## 7 · Ranked plan

~~2. Fix `ngsw-config.json` so route chunks are `lazy`.~~ **Done** — ADR-005.
~~3. Rename the colliding `leos-help-up` keyframe.~~ **Done** — plus `check:keyframes` in CI.

**Tier 1 — biggest effect, contained risk**

1. `runOutsideAngular` on all five polling sites. One afternoon; removes a full-tree
   CD pass every 3 seconds on the guest path.
2. Run a production build and put `ng build` in CI. Makes the budget enforceable —
   and it is the one Tier-1 item still blocked on the Tailwind lockfile.

**Tier 2 — the structural fix**

5. Convert allocating getters to `computed()` signals, starting with `guest.page.ts`
   (98 expressions), then `service.page.ts`, `station.page.ts`, `studio-team.page.ts`.
6. Adopt `OnPush` per component, only after its getters are memoised.
7. Global `:focus-visible` rule in `leos.css` for all 309 controls.

**Tier 3 — design integrity**

8. Settle the Inter question, re-enable font optimization, drop the render-blocking link.
9. Invert `.lk-ink` to lit-by-default (landing audit, finding 1).
10. Fix `track $index` on `cartLines` in `guest-cart-drawer.component.ts` — the only
    mis-tracked list in the app, and it is over a mutable cart.
11. Retire `#94a3b8` as a text colour (9 remaining uses).
12. Collapse the value sprawl the Tailwind `@theme` now makes visible: 41 distinct
    font sizes, 48 border-radius values, 68 box-shadows.

**Explicitly not yet:** zoneless change detection. Revisit after Tier 2.

---

## Method

All counts produced by scripts over `apps/web/src/app` (`*.ts`, excluding `*.test.ts`)
and the four global stylesheets. Template expressions were extracted from
`template:` literals and counted across interpolations, property bindings (event
bindings excluded) and `@if`/`@for`/`@switch` conditions. Getters were matched
against their own component's template. Re-run them before acting — the tree moves.
