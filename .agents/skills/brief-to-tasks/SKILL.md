---
name: brief-to-tasks
description: Break a design brief into an ordered checklist of independently buildable tasks using vertical slices. Saves as a markdown checklist. Use when user wants to break down work, create tasks from a brief, plan implementation order, or mentions "tasks" or "breakdown".
---

## Lekki Context (read first)

- Tokens live in `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss`. Shared components live in `apps/web/src/app/leos/`. Screens live in `apps/web/src/app/pages/`.
- Any task that would reopen Setup Engine v1, the Experience/Studio shells, or the core guest journey (frozen per `docs/NORTH-STAR.md` / `docs/ux/current-product-state.md`) should be flagged as needing sign-off, not just listed as a normal task.
- Verification commands for this repo: `pnpm run dev` (Postgres + runtime + web), `pnpm run check:nouns`, `pnpm run e2e:smoke`.

This skill turns a design brief into an ordered, buildable task list. Each task is a vertical slice: a piece of UI that can be built, reviewed, and verified on its own.

## Example prompts

- "Break the brief into tasks"
- "What should I build first?"
- "Create a task list from the design brief"
- "Plan the build order for this feature"

## Process

1. Read the design brief. Look for `.design/*/DESIGN_BRIEF.md`. If multiple subfolders exist, use the most recently modified one, or ask the user which feature they are working on. Also check for `INFORMATION_ARCHITECTURE.md` and a tokens file in the same subfolder. If none exist, ask the user to describe what they are building.

2. Explore the existing codebase to understand what is already built. Scan specifically for:
   - **Component directory**: `apps/web/src/app/leos/` — list every component by name
   - **Existing pages/views**: `apps/web/src/app/pages/*.page.ts` — what is already built that this feature must coexist with
   - **Token/theme files**: `apps/web/src/styles/_tokens.scss`, `_leos.scss`, `_studio.scss`
   - **File naming conventions**: kebab-case files, `*.page.ts` / `*.component.ts` suffixes, standalone Angular components
   - **Test files**: `*.test.ts` alongside continuity/behaviour modules in `apps/web/src/app/studio/`
   - Classify each relevant component as: will be reused as-is, needs modification, or does not exist yet. Only components that need modification or creation get their own tasks.

3. Break the work into vertical slices. Each task should:
   - Be independently buildable (no task should block another unless noted).
   - Include structure, styling, and interaction in a single task (not "build HTML" then "add CSS" then "add JS" as separate tasks).
   - Be verifiable: you can look at the result and confirm it matches the brief.
   - Be small enough to complete in a single session.

4. Order tasks by:
   - **Dependencies first**: foundational elements (tokens, layout shells, shared components) before page-specific work.
   - **Visual priority**: the most prominent UI element early, so the user can validate the aesthetic direction before investing in details.
   - **Risk first**: the hardest or most uncertain piece early, so problems surface before everything else is built around them.

5. Save the task list as `TASKS.md` in the same `.design/<feature-slug>/` subfolder as the design brief.

## Task List Template

```markdown
# Build Tasks: [Feature/Page Name]

Generated from: .design/<feature-slug>/DESIGN_BRIEF.md
Date: [date]

## Foundation
- [ ] **[Task name]**: [One sentence describing what to build and what "done" looks like]. _Reuses: [existing components/tokens if any]._
- [ ] **[Task name]**: [Description]. _New component._

## Core UI
- [ ] **[Task name]**: [Description]. _Depends on: [task name if any]._
- [ ] **[Task name]**: [Description].

## Interactions & States
- [ ] **[Task name]**: [Description]. Covers: [list of states, e.g., hover, loading, error, empty].
- [ ] **[Task name]**: [Description].

## Responsive & Polish
- [ ] **[Task name]**: [Description]. Breakpoints: [which ones].
- [ ] **[Task name]**: Accessibility pass. [Specific checks from the brief].

## Review
- [ ] **Design review**: Run /design-review against the brief.
```

## Rules

- Every task must reference whether it reuses, modifies, or creates components.
- Never create a task that is only "set up the project" or "create the file structure." Those are not vertical slices.
- If the brief specifies an aesthetic philosophy, note it in the first build task so the visual direction is established immediately.
- Group related tasks but do not nest them more than one level deep. Flat lists are easier to work through.
