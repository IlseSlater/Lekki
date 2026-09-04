---
name: information-architecture
description: Define the structural layer of a product or site before visual design begins. Covers navigation, content hierarchy, page structure, URL patterns, and user flows. Use when user wants to plan site structure, define navigation, map user flows, organize content, or mentions "IA" or "information architecture".
---

## Lekki Context (read first)

Lekki builds **LEOS** — the platform — with two customer surfaces, **LEOS Studio** and **LEOS Experience**, each with three Studio modes (Setup, Operate, Grow). Before running this skill:

- **The core structure is frozen.** `docs/NORTH-STAR.md` and `docs/ux/current-product-state.md` freeze: the guest journey (QR → Join → Menu → Cart → Pay → Live Order → Receipt → Leave), Setup Engine v1's step order, and the Experience/Studio shell split (guest never sees Studio). **Do not propose new top-level navigation, new shells, or a reordered core journey** — that requires an ADR, not an IA exercise. IA work here should describe what exists and refine within it (e.g. a new Studio Grow view, a new guest continuity screen), not re-architect.
- **Terminology is pack-driven, not hardcoded.** Labels come from `TerminologyService` / Experience Profile per pack (Restaurant: Tables/Kitchen; Café: Counter/Barista; Hotel: Room/Suite, etc. — see `docs/ux/current-product-state.md` §3.36). Don't hardcode restaurant nouns into a "naming conventions" table meant to be pack-agnostic.
- **`.design/<feature>/` here is a lightweight scratchpad** — separate from `docs/ux/`, which holds the frozen spec set (`docs/ux/wireframes/`, `docs/ux/stories/`, `LEK-029-experience-composition.md` for the actual frozen guest IA). Read those first; this skill's output should extend them for a specific feature, not fork a parallel structure.

## Example prompts

- "Plan the IA for this app before I start building"
- "Map out the navigation and page structure"
- "I need to organize the content for a documentation site"
- "Define user flows for the onboarding experience"

## Process

1. Look for an existing design brief at `.design/*/DESIGN_BRIEF.md`. If multiple subfolders exist, use the most recently modified one, or ask the user which feature they are working on. If no brief exists, ask the user what they are building and for whom.

2. Explore the existing codebase to understand what structure already exists:
   - **Routing**: `apps/web/src/app/app.routes.ts`
   - **Shells**: `apps/web/src/app/shells/` (`experience-shell`, `staff-shell`, `studio-shell`)
   - **Pages**: `apps/web/src/app/pages/*.page.ts` — how screens are currently organized
   - **Frozen IA reference**: `docs/LEK-029-experience-composition.md`, `docs/ux/ia-experience-studio-shells.md`, `docs/ux/screen-inventory.md`
   - If structure exists, this skill extends and improves it. Do not propose a new architecture that ignores what is already built.

3. Interview the user about structural decisions. For each question, provide your recommended answer.

   Cover at minimum:
   - What are the primary things a user needs to find or do? Rank by frequency.
   - How many levels of navigation depth are acceptable?
   - What content will grow over time vs. what is fixed?
   - Are there distinct user types who need different entry points?
   - What is the one page/view where the user spends 80% of their time?

4. Once you have a shared understanding, produce the IA document using the template below and save it as `INFORMATION_ARCHITECTURE.md` in the same `.design/<feature-slug>/` subfolder as the design brief.

## IA Document Template

```markdown
# Information Architecture: [Product/Site Name]

## Site Map

A hierarchical map of every page or view. Use indentation to show nesting. Include the URL pattern for each.

- Home `/`
  - Feature A `/feature-a`
    - Sub-page `/feature-a/detail`
  - Feature B `/feature-b`
- Settings `/settings`
  - Profile `/settings/profile`

## Navigation Model

Describe the navigation system:
- **Primary navigation**: What appears in the main nav? Maximum items.
- **Secondary navigation**: Sidebar, tabs, or contextual links within sections.
- **Utility navigation**: Account, settings, help, and anything outside the main content hierarchy.
- **Mobile navigation**: How navigation adapts. Hamburger, bottom tabs, or something else.

## Content Hierarchy

For each major page or view, define the content priority:

### [Page Name]
1. [Highest priority content] -- Why this comes first
2. [Second priority] -- Why this comes second
3. [Third priority] -- Rationale
4. [Below the fold / secondary]

## User Flows

The critical paths through the product. Each flow is a sequence of steps with decision points noted.

### [Flow Name] (e.g., "New user onboarding" or "Create a project")
1. User lands on [page]
2. User sees [content/prompt]
3. User takes action: [action]
   - If [condition A] -> [outcome]
   - If [condition B] -> [outcome]
4. User arrives at [destination]

## Naming Conventions

A glossary of terms used in the interface. Consistency matters. Pick one word and use it everywhere — and note whether the term is pack-agnostic (core) or pack-specific terminology.

| Concept | Label in UI | Notes |
|---------|-------------|-------|
| [thing] | [what we call it] | [why this word; core or pack-specific] |

## Component Reuse Map

Which structural components (layouts, containers, navigation elements) are shared across pages.

| Component | Used on | Behavior differences |
|-----------|---------|---------------------|
| [layout/component] | [pages] | [any variations] |

## Content Growth Plan

Which sections of the site will accumulate content over time and how the IA accommodates that growth (pagination, filtering, search, archive patterns).

## URL Strategy

Rules for URL construction:
- Pattern: [e.g., `/section/subsection/item-slug`]
- Dynamic segments: [what is parameterized]
- Query parameters: [filtering, sorting, pagination]
```
