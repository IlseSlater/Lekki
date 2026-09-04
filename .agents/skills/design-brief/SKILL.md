---
name: design-brief
description: Create a design brief through an interactive interview, codebase exploration, and experience design decisions. Saved as a markdown file in the project. Use when user wants to write a design brief, plan a new feature or page, define a UI direction, or mentions "brief".
---

## Lekki Context (read first)

Lekki builds **LEOS** — the platform — with two customer surfaces, **LEOS Studio** and **LEOS Experience**. Before running this skill:

- **Tokens already exist.** `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss` (Angular + CSS custom properties, not Tailwind/React). Extend, never replace, and never invent a parallel token system (see `onboarding.page.scss`'s old `--ob-*` duplication as the cautionary example — being fixed).
- **The aesthetic is already chosen.** LVES 2.0 (`docs/ux/lves.md`): Surgical White & Rose-Gold — pure white canvas, slate ink, one warm gold accent. Experience feels like *Apple Wallet · Uber Eats · Airbnb*; Studio feels like *Stripe · Linear · Google Admin*. The brief's "Aesthetic Direction" section should default to this unless the user explicitly asks to explore something else.
- **Read the constitution before scoping.** `docs/NORTH-STAR.md` and `docs/ux/current-product-state.md` freeze the guest journey (QR → Join → Menu → Cart → Pay), Setup Engine v1, and the Experience/Studio shells against *architectural* redesign. A brief for a frozen area should be scoped as craft/polish within existing tokens, not a rebuild — flag it if the user's ask implies otherwise.
- **`.design/<feature>/` here is a lightweight scratchpad for this skill flow** — separate from `docs/ux/`, which is Lekki's frozen constitutional spec set (wireframes, stories, evidence, `LEK-0xx` docs). Cross-reference `docs/ux/` in the brief rather than duplicating it.
- Component vocabulary already exists — `LEK-028-component-catalogue.md` and `apps/web/src/app/leos/*.component.ts` (e.g. `leos-btn--primary`, `leos-menu-card`, `leos-field`). List these under "Existing Patterns" / "Component Inventory" rather than proposing new ones that duplicate them.

This skill creates a design brief through structured conversation. You may skip steps if they are not necessary.

## Example prompts

- "Write a brief for the onboarding flow"
- "I need to plan a settings page before I start building"
- "Help me define the direction for a marketing landing page"
- "Brief this: a dashboard that shows project health metrics"

## Process

1. Ask the user for a detailed description of what they want to build, who it is for, and any constraints or ideas they already have.

2. Explore the existing codebase to understand the current state. Scan for each of the following specifically:
   - **CSS variables / tokens**: `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss`
   - **Component directory**: `apps/web/src/app/leos/` (shared guest/studio components), `apps/web/src/app/pages/` (screens)
   - **Design system docs**: `docs/ux/lves.md`, `docs/LEK-028-component-catalogue.md`, `docs/ux/studio-design-system.md`
   - **Font loading**: `apps/web/src/index.html` (Google Fonts: Fraunces, Sora, Inter)
   - **Existing pages/layouts**: `apps/web/src/app/pages/*.page.ts`, `apps/web/src/app/shells/*.component.ts`
   - If components exist, treat them as the starting vocabulary. The brief should extend, not replace.

3. Interview the user relentlessly about every aspect of the design until you reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one. For each question, provide your recommended answer.

   Cover at minimum:
   - Who is the primary user their JTBD and what are they trying to accomplish?
   - What does success look like for this interface?
   - What is the emotional tone? (calm, urgent, playful, authoritative, warm, clinical)
   - What existing products, sites, or styles should this feel like? What should it NOT feel like?
   - What are the hard constraints? (devices, accessibility requirements, performance budgets, brand guidelines)
   - What content will this interface contain? What is placeholder vs. real?

4. Once you have a complete understanding, write the brief using the template below.

## File Output

Save the brief to `.design/<feature-slug>/DESIGN_BRIEF.md` where `<feature-slug>` is a short, lowercase, hyphenated name derived from the feature or page being designed (e.g., `onboarding-flow`, `settings-page`, `project-dashboard`).

This folder structure ensures that running the design flow multiple times for different features does not overwrite previous work. All subsequent skills (information-architecture, design-tokens, brief-to-tasks, design-review) will read from and write to this same subfolder.

Example:

```
.design/
├── onboarding-flow/
│   └── DESIGN_BRIEF.md
└── settings-page/
    └── DESIGN_BRIEF.md
```

## Brief Template

```markdown
# Design Brief: [Feature/Page Name]

## Problem

What problem is the user facing, described from their perspective. Not technical. Not business metrics. The human friction.

## Solution

What this interface does to solve that problem, described as an experience, not a feature list.

## Experience Principles

Three principles maximum that guide every design decision. Each principle should resolve a tension.
Example: "Progressive disclosure over upfront complexity" or "Confidence over speed."

1. [Principle] -- [What this means in practice]
2. [Principle] -- [What this means in practice]
3. [Principle] -- [What this means in practice]

## Aesthetic Direction

- **Philosophy**: [Named philosophy or described vibe. Default for Lekki: LVES 2.0 Surgical White & Rose-Gold. See /frontend-design skill for the general reference menu.]
- **Tone**: [Emotional register]
- **Reference points**: [Existing products, sites, or styles this should feel like]
- **Anti-references**: [What this should NOT feel like]

## Existing Patterns

Components, tokens, and conventions already in the codebase that this design must respect or extend.

- Typography: [what is currently used]
- Colors: [current palette/variables]
- Spacing: [current scale]
- Components: [existing components that will be reused or extended]

## Component Inventory

A list of the UI components this feature requires. For each, note whether it exists already, needs modification, or is new.

| Component | Status                | Notes    |
| --------- | ---------------------- | -------- |
| [name]    | Exists / Modify / New | [detail] |

## Key Interactions

The critical interaction patterns. Describe what the user does and what the interface does in response. Focus on state changes, transitions, and feedback.

## Responsive Behavior

How the layout adapts across breakpoints. Note any components that change behavior (not just size) on mobile.

## Accessibility Requirements

Minimum requirements for this interface. Include contrast ratios, keyboard navigation, screen reader considerations, and focus management.

## Out of Scope

Things this brief explicitly does not cover. Be specific. This prevents scope creep during build.
```
