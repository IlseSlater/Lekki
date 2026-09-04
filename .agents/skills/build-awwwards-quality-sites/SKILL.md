---
name: build-awwwards-quality-sites
description: Art-direct and implement distinctive, motion-rich marketing, editorial, portfolio, and landing websites with original reference-inspired imagery, standout heroes, GSAP choreography, one smooth-scroll engine, optional Three.js shaders, honest icon and logo sourcing, photo avatars, accessibility, and performance safeguards. Use when a user asks for an Awwwards-quality, premium, cinematic, interactive, high-concept, or motion-led website, or explicitly requests this visual and motion system.
---

## Lekki Context (read first)

**Scope this skill tightly. It applies to Lekki's public marketing site only — `apps/web/src/app/pages/website-home.page.ts` and any future landing/marketing pages.** It does **not** apply to LEOS Studio or LEOS Experience (the guest ordering product). Those product surfaces are governed by:

- `docs/ux/leos-motion-system.md` (Frozen): "Everything moves like light: fade, flow, rise, settle. Never bounce, pop, shake, or spin." No parallax, no scroll-triggered choreography, no Three.js.
- `docs/ux/lves.md`: Surgical White & Rose-Gold, gold rationed to primary CTA/focus/selected — the opposite of a "standout hero with pointer-responsive interaction and shader canvas" treatment.
- `docs/NORTH-STAR.md` / `docs/ux/current-product-state.md`: Setup Engine v1, the Experience/Studio shells, and the core guest journey are frozen against this kind of visual reinvention.

**Do not install GSAP, Lenis, Locomotive Scroll, or Three.js into the shared product app bundle** if that would ship their weight to Studio or guest Experience routes. If the marketing site is bundled in the same Angular app (`apps/web`), confirm the build actually code-splits so guest/Studio bundles stay clean — flag it if it doesn't, rather than assuming.

Where this skill's own "reject" list overlaps with LEOS's existing "Visual Smells" list in `docs/ux/lves.md` (generic gradient blobs, glass applied everywhere, fake testimonials, logo-wall theater with no honest proof) — that's shared ground; both apply on the marketing site too. The cinematic motion techniques below (GSAP scroll choreography, staggered reveals, Three.js) are the part that's marketing-site-only and must stop at the boundary into the product.

Stack note: Lekki's app is Angular (standalone components) + SCSS, not React/Next — the instructions below are framework-agnostic (GSAP/ScrollTrigger/Three.js work the same way against the DOM regardless of framework), but wire them up as Angular component lifecycle hooks (`ngAfterViewInit` / `ngOnDestroy` for setup/teardown), not React effects.

---

# Build Awwwards-Quality Sites

Build a cohesive, memorable site whose visual idea, media, typography, and motion tell the same story. Treat "Awwwards quality" as an acceptance bar, never as an award or recognition claim.

## 1. Set the art direction

- Inspect the user's reference evidence completely before implementation. Extract only high-level traits such as hierarchy, pacing, contrast, image treatment, and motion principles.
- Generate a materially new identity, layout, copy system, imagery, and interaction language. Never reuse, trace, or closely reproduce reference assets, screenshots, source code, identity, or copy.
- Use Aura.build top asset imagery only when the user requests it or it is relevant and available. Treat it as high-level inspiration, not an asset library.
- Select and name at least one compatible installed web-design skill. Follow the smallest relevant set and avoid combining unrelated aesthetic systems.
- Write a compact direction before coding: visual thesis, hero focal asset, type hierarchy, color system, section sequence, motion narrative, chosen smooth-scroll engine, Three.js decision, and asset provenance plan. For Lekki's marketing site, root the color system and typography in the existing brand (Fraunces/Sora, rose-gold accent, `apps/web/public/brand/`) even though the motion language here is more expressive than the product.

## 2. Build an honest asset system

- Generate original hero or project imagery when it materially improves the concept. Use appropriately licensed media when it is stronger, and keep provenance in the site source.
- Do not draw illustrations with model-authored SVG, CSS, or canvas paths. Use original generated or appropriately licensed transparent PNG cutouts for illustrative elements. Simple authored brand marks, interface icons, data graphics, and a justified Three.js shader canvas are allowed.
- Use photographs for every avatar. Prefer provided or appropriately licensed photos; never ship initials, illustrated heads, faceless silhouettes, or generated people presented as real customers, staff, or endorsers.
- Use Solar icons through Iconify for interface symbols. Use Iconify SVG Logos only for legitimate real-company marks in truthful contexts. Use Logo Ipsum only for explicitly disclosed fictional brand specimens, never as customer proof. Omit a logo wall when no honest proof exists.
- Provide deliberate aspect ratios, crop behavior, alt text, loading behavior, and missing-media fallbacks. Avoid generic stock imagery, copied mockups, watermarks, and decorative media without a narrative role.

## 3. Compose the hero

- Make the first viewport the site's strongest authored moment. Combine a clear message and CTA with original imagery, video, pointer-responsive interaction, or a justified Three.js scene.
- Create a composed GSAP intro sequence for the hero. Keep navigation, primary message, and CTA readable and usable before the animation completes.
- Make pointer effects additive. Support touch, keyboard, coarse pointers, window blur, and visibility changes without leaving the interface in an incomplete state.
- Design a static first frame that remains complete when JavaScript, media playback, WebGL, or motion is unavailable.

## 4. Build the motion system

- Use GSAP as the primary animation system.
- Evaluate Lenis and Locomotive Scroll, then choose exactly one as the site's sole smooth-scroll engine. Never install or initialize both. Connect the chosen engine correctly to GSAP ScrollTrigger, refresh measurements after media and font changes, and destroy it during cleanup (Angular: in `ngOnDestroy`).
- Bypass smooth scrolling and scrubbed timelines under `prefers-reduced-motion: reduce`. Render final states immediately instead of merely shortening animations.
- Choreograph the page section by section. Reveal major headings word by word with a restrained stagger, then sequence supporting copy and media.
- Preserve an unsplit accessible name for staggered text. Hide decorative split words from assistive technology, never split links or meaningful inline markup, and keep the unsplit content visible without JavaScript.
- Use CSS for simple hover, focus, and tap states. Reserve ScrollTrigger for justified scrubbed or pinned sequences and avoid multiple systems controlling the same property.

## 5. Add Three.js only with purpose

- Use Three.js and custom WebGL shaders when spatial depth, texture transition, displacement, or pointer response materially supports the art direction. Do not add a shader as ornamental background noise.
- Give the canvas one clear responsibility and keep it subordinate to semantic content and controls.
- Cap device pixel ratio, pause rendering offscreen or when the document is hidden, throttle pointer input, and avoid per-frame allocation.
- Provide a static poster and replace the canvas entirely under reduced motion or WebGL failure.
- Dispose animation frames, observers, event listeners, render targets, textures, geometries, materials, and the renderer. Handle context loss without breaking page content.

## 6. Meet the quality bar

- Build a complete semantic page, not a hero-only concept. Include responsive navigation, coherent section progression, concrete conversion content, final CTA, footer, robust form or control states when present, and visible keyboard focus.
- Require a distinct art-directed idea, memorable first viewport, disciplined typography and spacing, intentional image crops, authored transitions, and refined hover, focus, active, loading, disabled, error, touch, and reduced-motion behavior.
- Preserve performance with responsive media, lazy loading below the fold, bounded transforms, limited blur, capped canvas work, and no continuously animated offscreen content.
- Reject generic gradient blobs, ornamental bento grids, glass applied everywhere, stock component layouts, fake testimonials, invented partnerships, logo-wall theater, and motion with no narrative role.
- Never describe the result as award-winning or Awwwards-recognized unless the user provides verifiable evidence.

## 7. Validate before handoff

- Run the production build and fix every failure.
- Check the page at desktop and mobile sizes when browser validation is requested or needed to resolve a blocker.
- Verify keyboard navigation, visible focus, touch behavior, content with JavaScript unavailable, static media fallbacks, and `prefers-reduced-motion` behavior.
- Check that only one smooth-scroll engine is installed and initialized, ScrollTrigger integration is correct, and all animation and WebGL resources clean up.
- Search rendered content and source for placeholders, copied reference identity, unsupported claims, misleading logos, uncredited media, and inaccessible split text.
- Confirm the guest/Studio product bundles did not pick up GSAP/Lenis/Three.js as a side effect of this build.
- Report the chosen web-design skill, asset sources, motion stack, Three.js decision, validation performed, and any remaining limitation.
