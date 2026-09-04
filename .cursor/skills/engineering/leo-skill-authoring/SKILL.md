---
name: leo-skill-authoring
description: >-
  How Lekki/LEO writes and updates Cursor Agent Skills. Use when creating, rewriting,
  auditing, or researching skills; when the user says update skills, skill hygiene,
  SKILL.md, progressive disclosure, or agent skills best practice. Not for app feature work.
---

# LEO skill authoring

**Standard:** [Cursor Agent Skills](https://cursor.com/docs/skills) · agentskills.io

## When

Creating or updating anything under `.cursor/skills/` or scoping `.agents/skills/`.

## Do

1. **Decide the layer.** Always-on law → rule. Repeatable how-to → skill. Persona that *runs* a lane → `.cursor/agents/`. Imported visual kit → `.agents/skills/` with a Lekki overlay.
2. **One folder = one job.** `name` must match the folder. Lowercase, hyphens.
3. **Write the description first** (third person, what + when, trigger phrases humans say, <1024 chars). Vague descriptions never fire.
4. **Keep the body under ~150 lines** for LEOS skills. Procedure, Never, Handoff, Read. Do not reprint the constitution — it is `alwaysApply`.
5. **Put catalogs in `references/`** one level deep. Link them; do not nest. Invariants and test matrices live here, not slogans.
6. **Use `paths`** when the skill is file-scoped.
7. **Handoff, don’t clone.**
8. **Vision test.** Confidence, Platform generic, finish over invent.
9. **Proof, not only law.** If the skill states arithmetic or auth rules, name the test file or an invariants table.
10. **`*.md` is LF.** See `.gitattributes`. Do not invent LEKs.

## Never

- Skills that say “does architecture stuff.”
- Duplicating North Star / constitution in every file.
- Teaching React/Tailwind as the Lekki stack.
- Letting Awwwards/GSAP skills govern Guest, Studio, or Operate.
- Expanding LEO’s org chart because a blog described an “agentic mesh.”

## Quality checklist

- [ ] Description would match a real user sentence
- [ ] Body is procedural (numbered)
- [ ] File paths in this repo are real
- [ ] Never-list is specific
- [ ] Handoff names another existing skill or agent
- [ ] README taxonomy updated if the skill is new

## Read

`.cursor/skills/README.md` · `.agents/skills/README.md` · `.cursor/rules/leos-architect-roster.mdc`
