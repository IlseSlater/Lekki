---
name: grill-me
description: Interview the user relentlessly about a plan or design until reaching shared understanding, resolving each branch of the decision tree. Use when user wants to stress-test a plan, get grilled on their design, challenge an approach, or mentions "grill me".
---

## Lekki Context (read first)

Lekki builds **LEOS** — the platform — with two customer surfaces, **LEOS Studio** and **LEOS Experience**. Before running this skill:

- **Tokens already exist.** `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss` (Angular + CSS custom properties, not Tailwind/React). Do not assume a stack this project doesn't use.
- **The aesthetic is already chosen.** LVES 2.0 (`docs/ux/lves.md`): Surgical White & Rose-Gold — pure white canvas, slate ink, one warm gold accent. Experience feels like *Apple Wallet · Uber Eats · Airbnb*; Studio feels like *Stripe · Linear · Google Admin*. Don't grill the user into picking a different aesthetic philosophy unless they explicitly want to explore an alternative.
- **The core journey and Setup Engine v1 are frozen.** `docs/NORTH-STAR.md` and `docs/ux/current-product-state.md` freeze the guest journey (QR → Join → Menu → Cart → Pay), Setup Engine v1, and the Experience/Studio shells against *architectural* redesign. If the grilling surfaces a decision that would reopen one of those, say so explicitly rather than resolving it silently.
- Component vocabulary already exists — `LEK-028-component-catalogue.md` and `apps/web/src/app/leos/*.component.ts` (e.g. `leos-btn--primary`, `leos-menu-card`, `leos-field`). Reuse names instead of inventing new ones.

## Example prompts

- "Grill me on this landing page idea"
- "I want to build a dashboard for tracking team metrics. Challenge my thinking."
- "Stress-test my approach to this settings page"
- "I have a rough idea for a portfolio site. Help me think it through."

## Instructions

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one by one.

If a question can be answered by exploring the codebase, explore the codebase instead of asking me.

If a question can be answered by examining existing components, styles, or design tokens in the project, examine them instead of asking me.

For each question, provide your recommended answer.
