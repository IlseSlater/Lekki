---
name: design-flow
description: Run the full design-to-build workflow as a guided sequence. Orchestrates all designer skills in order, from grilling through review. Use when user wants to go through the complete design process, start a project from scratch, run the full flow, or mentions "design flow" or "full workflow".
---

## Lekki Context (read first)

This orchestrates Lekki's design process across `grill-me` → `design-brief` → `information-architecture` → `design-tokens` → `brief-to-tasks` → `frontend-design`, with `design-review` on request. Each of those skills already carries Lekki-specific context (tokens live in `apps/web/src/styles/_tokens.scss`; aesthetic is LVES 2.0 Surgical White & Rose-Gold; no dark mode; Setup Engine v1 / Experience & Studio shells / core guest journey are frozen against architectural redesign per `docs/NORTH-STAR.md` and `docs/ux/current-product-state.md`). Read each phase's own SKILL.md for the details — this file only sequences them.

Because most of Lekki's foundation already exists, expect to skip phases more often than not:
- Aesthetic already committed → Design Tokens phase is usually a quick "confirm nothing's missing," not a generation from scratch.
- Core structure already frozen → Information Architecture phase should describe/extend what exists in `docs/ux/`, not propose new navigation or shells.
- If the ask is for craft/polish on something that already exists (most Lekki requests), `grill-me` and `information-architecture` can often be skipped entirely — say so and confirm with the user rather than running the full ceremony on a small change.

This skill orchestrates the full designer workflow by running each skill in sequence. You are a guide walking the designer through each phase. Do not rush. Each phase must be completed and confirmed before moving to the next.

## Example prompts

- "Run the full design flow"
- "Walk me through the complete process for a new project"
- "Start from scratch and take me through everything"
- "Design flow for a dashboard app"

## The Sequence

```
1. Grill Me          → Clarify thinking
2. Design Brief      → Document intent
3. Info Architecture  → Define structure
4. Design Tokens     → Establish visual system
5. Brief to Tasks    → Plan the build
6. Frontend Design   → Build it
—
7. Design Review     → Run separately when ready
```

## Rules

1. **At the start**, tell the designer what the full sequence looks like (phases 1-6, with review available separately) and ask if they want to skip any phases. Common skip patterns (more common on Lekki than on a greenfield project):
   - Already have a clear idea → skip grill-me
   - Single component, not a full page → skip information-architecture
   - Existing project with tokens (true for Lekki by default) → skip or fast-track design-tokens
   - Change lives entirely within an existing, frozen screen → skip information-architecture; note the freeze instead

2. **Before each phase**, announce which phase you are entering and what it will produce. Example: "Phase 2: Design Brief. I'll interview you about the project and produce a DESIGN_BRIEF.md file. Ready?"

3. **During each phase**, read the corresponding SKILL.md file (in this same `.agents/skills/` directory) and follow its full instructions, including its Lekki Context section. Do not summarize or abbreviate the skill. Run it properly.

4. **After each phase**, summarize what was produced (the file name, the key decisions, any open questions) and ask: "Ready to move to the next phase?" Wait for confirmation.

5. **Between phases**, check if the output from the previous phase changes anything about the next phase. If the brief or IA phase surfaces a change that would reopen Setup Engine v1, the Experience/Studio shells, or the core guest journey, stop and flag it explicitly before continuing — that needs the designer's explicit sign-off, not a skipped question.

6. **The designer can stop at any point.** If they say "that's enough for now," summarize where they are in the sequence and what the next phase would be when they return.

## Phase Details

### Phase 1: Grill Me

Read the `grill-me` skill (`.agents/skills/grill-me/SKILL.md`) and follow its instructions.
**Produces**: Shared understanding of the project. No file output.
**Transition**: "We've resolved the key decisions. Ready to capture this as a design brief?"

### Phase 2: Design Brief

Read the `design-brief` skill (`.agents/skills/design-brief/SKILL.md`) and follow its instructions.
**Produces**: `.design/<feature-slug>/DESIGN_BRIEF.md`.
**Transition**: "The brief is saved. Next is information architecture, where we'll define the page structure and navigation. Skip this if you're building a single component or working inside an existing, frozen screen. Continue?"

### Phase 3: Information Architecture

Read the `information-architecture` skill (`.agents/skills/information-architecture/SKILL.md`) and follow its instructions.
**Produces**: `.design/<feature-slug>/INFORMATION_ARCHITECTURE.md`.
**Transition**: "IA is defined. Next we'll confirm design tokens (colors, spacing, typography) — for Lekki this is usually a quick check against the existing `_tokens.scss`, not a generation from scratch. Continue?"

### Phase 4: Design Tokens

Read the `design-tokens` skill (`.agents/skills/design-tokens/SKILL.md`) and follow its instructions.
**Produces**: Updates to `apps/web/src/styles/_tokens.scss` (extends, does not replace).
**Transition**: "Tokens are set. Next I'll break the brief into a task list so we can build in order. Continue?"

### Phase 5: Brief to Tasks

Read the `brief-to-tasks` skill (`.agents/skills/brief-to-tasks/SKILL.md`) and follow its instructions.
**Produces**: `.design/<feature-slug>/TASKS.md`.
**Transition**: "Tasks are ready. Now we build. I'll start with the first task on the list. Continue?"

### Phase 6: Frontend Design

Read the `frontend-design` skill (`.agents/skills/frontend-design/SKILL.md`) and follow its instructions.
Work through the tasks from `TASKS.md` in order. After completing each task, check it off and confirm with the designer before moving to the next task.
**Produces**: Built Angular components and pages.
**Transition**: "The flow is complete. Your brief, IA, tokens, and tasks are all saved in the project. When you're ready for a design review, run `/design-review` and I'll critique the build against the brief."

**The flow ends here.** Phase 7 is not automatic.

### Phase 7: Design Review (on request only)

This phase does NOT run automatically. It only runs if:

- The designer explicitly asks for a review during the flow
- The designer runs `/design-review` separately after building

The review requires built code to examine. If no components or pages have been built yet, do not run this phase. Instead, remind the designer: "Run `/design-review` once you have something built. It will check the output against the brief."

When triggered, read the `design-review` skill (`.agents/skills/design-review/SKILL.md`) and follow its instructions.

**Produces**: `.design/<feature-slug>/DESIGN_REVIEW.md` + screenshots saved in `.design/<feature-slug>/screenshots/`.
**Transition**: "Review is done. Screenshots are saved in `.design/<feature-slug>/screenshots/`. If there are must-fix items, I can address them now."

## Project Files Structure

All design flow artifacts are saved under `.design/<feature-slug>/` where `<feature-slug>` is a short, lowercase, hyphenated name derived from the feature being designed. This ensures multiple features can be designed independently without overwriting each other, and stays separate from `docs/ux/`, which is Lekki's frozen constitutional spec set.

```
.design/
└── <feature-slug>/
    ├── DESIGN_BRIEF.md              ← Phase 2: Project intent, goals, aesthetic direction
    ├── INFORMATION_ARCHITECTURE.md  ← Phase 3: Navigation, page structure, user flows
    ├── TASKS.md                     ← Phase 5: Ordered build checklist from the brief
    ├── DESIGN_REVIEW.md             ← Phase 7: Prioritized critique against the brief
    └── screenshots/                 ← Phase 7: Visual evidence from the running app
        ├── review-[page]-desktop-1280.png
        ├── review-[page]-tablet-768.png
        ├── review-[page]-mobile-375.png
        └── review-[component]-[state].png
```

(Phase 4 writes directly into `apps/web/src/styles/_tokens.scss` rather than a separate tokens file, since Lekki's tokens already live there.)

## If the Designer Returns Mid-Flow

Check the `.design/` folder for existing feature subfolders. If files from earlier phases exist (DESIGN_BRIEF.md, INFORMATION_ARCHITECTURE.md, TASKS.md) inside a feature folder, read them to understand where the designer left off. Ask which feature to resume if multiple folders exist. Resume from the next incomplete phase.
