---
name: design-review
description: Run a structured design critique against the brief and codebase. Checks visual hierarchy, consistency, responsiveness, accessibility, and aesthetic fidelity. Use when user wants a design review, critique, QA pass, polish pass, or mentions "review" after building.
---

## Lekki Context (read first)

- Run the app with `pnpm run dev` (starts Postgres + runtime + web in one command — see `docs/BUILDING-LEOS.md`). The web app is Angular; there is no Next.js/React app directory.
- Review against LVES 2.0 (`docs/ux/lves.md`), not a generic aesthetic: pure white canvas, slate ink, gold rationed to primary CTA / focus / selected only, one filled button per screen, Fraunces reserved for true display moments.
- Check token discipline specifically: any hardcoded hex color or pixel radius that bypasses `--leos-*` custom properties is a **Should Fix** at minimum — it's exactly the drift pattern already found once in `onboarding.page.scss`.
- Lekki has no dark mode — skip the Dark Mode checklist section entirely unless the brief explicitly asked for one.
- Flag (as **Must Fix**, not silently accept) anything that reopens Setup Engine v1, the Experience/Studio shells, or the core guest journey structure — those are frozen per `docs/NORTH-STAR.md` / `docs/ux/current-product-state.md`. A visual/craft change within existing tokens is fine; a structural change is not this skill's call to approve.

> **CRITICAL — Visual Screenshot Capture**
>
> You MUST capture screenshots of the running application as part of every design review. Code review alone is insufficient — you need to see what the user sees. Follow the screenshot capture protocol in Step 3 below. This is not optional.

## Example prompts

- "Review what I just built"
- "Run a design critique on the landing page"
- "Check this against the brief"
- "Here's a screenshot. How does it look?" [paste screenshot]
- "QA pass before I ship this"

## Process

1. **Read the brief.** Look for the active feature's brief at `.design/<feature-slug>/DESIGN_BRIEF.md`. If multiple feature folders exist under `.design/`, ask the user which feature to review. If no `.design/` folder exists, fall back to `DESIGN_BRIEF.md` in the project root. If neither exists, ask the user what the intended design direction was.

2. **Explore the built code.** Examine every component, page, and style file that was created or modified. Scan specifically for:
   - All new or modified components and their relationship to pre-existing components in `apps/web/src/app/leos/`
   - Token/variable usage: are components using `--leos-*` shared tokens or hardcoding values?
   - Duplicate components that should be consolidated
   - File naming and organization: do new files follow the project's `*.page.ts` / `*.component.ts` conventions?
   - Understand what was actually built, not what was planned.

3. **Capture screenshots of the running application.**

   This step is **mandatory**. Do not skip it. Do not rely only on user-provided screenshots.

   ### Screenshot Tool Priority

   Try each option in order. Use the first one that is available:
   1. **Playwright MCP (preferred).** Check if the `plugin-playwright-playwright` MCP server is available. If it is, use it — it gives you precise control over viewport sizing, full-page captures, and file naming.
   2. **Cursor IDE Browser / Claude in Chrome (second choice).** If Playwright MCP is not available, use whichever in-editor or in-session browser automation tool is available (e.g. `cursor-ide-browser`'s `browser_take_screenshot`, or Claude in Chrome tools).
   3. **Ask the user (last resort).** If no browser tool is available, you MUST ask the user to provide screenshots manually. Be specific about what you need:
      - "I don't have access to a browser tool. To complete the visual review I need screenshots of the running application. Please provide:"
      - A full-page screenshot at **desktop** width (1280px)
      - A full-page screenshot at **tablet** width (768px)
      - A full-page screenshot at **mobile** width (375px) — Lekki Experience is phone-first, so mobile is the priority breakpoint
      - Any specific component or interactive state you want reviewed
      - Ask the user to paste/attach the images directly in chat, or to save them into the `screenshots/` folder themselves.
      - **Do not skip the visual review.** Wait for the user to provide screenshots before proceeding with the checklist.

   ### Screenshot Save Location

   All screenshots MUST be saved to a `screenshots/` subfolder inside the feature's `.design/` directory — the same folder where `DESIGN_BRIEF.md` and other design flow files live.

   Path pattern: `.design/<feature-slug>/screenshots/`

   Use descriptive filenames that encode what was captured:

   ```
   .design/
   └── onboarding-flow/
       ├── DESIGN_BRIEF.md
       ├── DESIGN_REVIEW.md
       └── screenshots/
           ├── review-homepage-desktop-1280.png
           ├── review-homepage-tablet-768.png
           ├── review-homepage-mobile-375.png
           └── review-card-component-hover.png
   ```

   ### Screenshot Capture Protocol

   **a. Navigate to the application.** `pnpm run dev` serves the web app locally — ask the user for the exact local URL/port if not obvious.

   **b. Capture responsive breakpoints.** At minimum, capture these three viewports for every key page/view — mobile first, since Lekki Experience is phone-first:

   | Breakpoint | Width × Height | Filename suffix |
   | ---------- | -------------- | --------------- |
   | Mobile     | 375 × 812      | `-mobile-375`   |
   | Tablet     | 768 × 1024     | `-tablet-768`   |
   | Desktop    | 1280 × 800     | `-desktop-1280` |

   **c. Capture interactive states (when relevant).**
   - Hover states on buttons, cards, links
   - Focus states on form fields
   - Open states on dropdowns, modals, menus (e.g. guest choices sheet)
   - Error/success states on forms
   - Loading and empty states

   **d. Capture specific components.** If the review focuses on a particular component, screenshot just that element.

   ### Analyze Every Screenshot

   After capturing, visually analyze each screenshot against the design brief and against LVES 2.0. For each screenshot:
   - Compare against the brief's aesthetic direction and against `docs/ux/lves.md`
   - Check visual hierarchy: is the most important element the most prominent?
   - Check spacing consistency: do margins and padding look even and intentional?
   - Check color: is gold rationed to primary CTA / focus / selected only, or is it overused?
   - Check typography: Sora for UI, Fraunces only on true display moments — not mixed arbitrarily
   - Check responsive adaptation: does the layout properly reorganize (not just shrink)?
   - Note rendering issues that code review alone would miss (font loading failures, broken images, layout overflow, z-index problems, incorrect border-radius, color mismatches)

   Reference specific screenshots by filename in the review output so findings are traceable.

4. **Run the review checklist below.** For each category, note what passes and what needs refinement. Be specific. Reference exact components, files, line numbers, and screenshot filenames.

5. **Produce a prioritized refinement list.** Group issues by severity:
   - **Must fix**: Broken functionality, accessibility failures, major deviations from the brief, or anything that reopens a frozen area (Setup Engine v1, Experience/Studio shells, core guest journey) without sign-off.
   - **Should fix**: Inconsistencies, token drift (hardcoded values instead of `--leos-*`), missing states, responsive issues.
   - **Could improve**: Polish, animation refinement, typography fine-tuning.

6. Save the review as `DESIGN_REVIEW.md` inside the feature's `.design/<feature-slug>/` folder (next to `DESIGN_BRIEF.md`). If no `.design/` folder exists, save to the project root. Include a "Screenshots Captured" section listing all screenshots taken with their paths. Present the review directly as well if the user prefers.

## Review Checklist

### Visual Hierarchy

- Is the most important content the most visually prominent on each page/view?
- Does the type scale create clear levels of importance (heading, subheading, body, caption)?
- Do interactive elements (buttons, links, inputs) have enough visual weight to be found without hunting?
- Is there a clear reading order? Can you trace where the eye goes first, second, third?

### Consistency

- Are spacing values consistent? Check padding and margins against `--leos-space-*`.
- Is gold used consistently — primary action, focus, selected state — never as decoration or wash?
- Are border radii, shadow values, and font sizes reused from `--leos-*` tokens, or are there one-off values?
- Do similar components look and behave similarly? (e.g., all cards, all form fields, all buttons within a category.)

### Aesthetic Fidelity

- Does the implementation match LVES 2.0 (Surgical White & Rose-Gold, Apple Wallet / Uber Eats / Airbnb for Experience, Stripe / Linear for Studio)?
- Would someone looking at this immediately recognize the Lekki aesthetic?
- Are there elements that break it (a generic component in an otherwise distinctive interface, a conflicting font, an out-of-place color, gold used as a wash instead of an accent)?
- One filled button per screen — is there more than one competing primary action?

### Component Quality

- Do existing components from `apps/web/src/app/leos/` appear correctly, or were they reimplemented?
- Are new components following the same API patterns (Angular standalone component conventions) as existing ones?
- Are there duplicate components that should be consolidated?

### States and Interactions

- Do interactive elements have all necessary states: default, hover, focus, active, disabled?
- Do form fields have states for: empty, filled, error, success, disabled?
- Are loading states handled? Empty states? (Per LVES: empty states must explain, invite, and offer one primary action — never a dead end.)
- Do transitions and animations match `docs/ux/leos-motion-system.md` (Frozen)?
- Is there visual feedback for every user action?

### Responsive Behavior

- Does the layout work at mobile (375px), tablet (768px), and desktop (1280px+)? Mobile is the priority breakpoint for Experience.
- Do components adapt appropriately? (Not just shrink, but reorganize when needed.)
- Is touch target size adequate on mobile (Lekki's own minimum: `--leos-touch-min`, 52px)?
- Is the primary action reachable in the thumb zone (lower half / sticky footer), not stretched to a top corner?

### Accessibility

- Color contrast: Do text/background combinations meet WCAG AA (4.5:1 for body text, 3:1 for large text)?
- Keyboard navigation: Can every interactive element be reached and activated with keyboard alone?
- Focus indicators: Are focus rings visible and styled consistently (gold border + soft ring, per `--leos-shadow-focus`)?
- Semantic HTML: Are headings in order? Are landmarks used (main, nav, header, footer)? Are form labels associated?
- Screen reader: Do images have alt text? Do icons have labels? Are decorative elements hidden from assistive technology?
- Motion: Is there a reduced-motion media query for users who need it?

### Typography

- Is the font actually loading? (Fraunces/Sora via Google Fonts in `index.html` — check for FOIT/FOUT flash.)
- Are line lengths comfortable for reading (45-75 characters on body text)?
- Is line height appropriate (1.4-1.6 for body, tighter for headings)?
- Is Fraunces reserved for true display/emotional moments, or has it leaked into routine UI text?

### Mobile-First

- Does the mobile layout work at 375px without horizontal scrolling?
- Is navigation adapted for mobile (bottom sheet / tab bar patterns already used elsewhere in Lekki, not a desktop nav that overflows)?
- Are touch targets at least `--leos-touch-min` (52px)?
- Is body text at least 16px on mobile?

## Output Format

```markdown
# Design Review: [Feature/Page Name]

Reviewed against: DESIGN_BRIEF.md + docs/ux/lves.md
Philosophy: LVES 2.0 Surgical White & Rose-Gold [or named departure, with reason]
Date: [date]

## Screenshots Captured

| Screenshot                                   | Breakpoint         | Description     |
| --------------------------------------------- | ------------------ | ---------------- |
| `screenshots/review-[page]-desktop-1280.png` | Desktop (1280×800) | [what it shows] |
| `screenshots/review-[page]-tablet-768.png`   | Tablet (768×1024)  | [what it shows] |
| `screenshots/review-[page]-mobile-375.png`   | Mobile (375×812)   | [what it shows] |

> All screenshots are in `.design/<feature-slug>/screenshots/`.

## Summary

[2-3 sentences on overall quality and the biggest finding.]

## Must Fix

1. **[Issue]**: [Specific description with file/component reference]. See [`screenshots/[relevant-screenshot].png`]. _Fix: [concrete suggestion]._

## Should Fix

1. **[Issue]**: [Description]. See [`screenshots/[relevant-screenshot].png`]. _Fix: [suggestion]._

## Could Improve

1. **[Issue]**: [Description]. _Suggestion: [idea]._

## What Works Well

[Note the strongest aspects of the implementation. This is not padding. Designers need to know what to keep doing.]
```
