# LEOS & LEO skills

Specialist skills share **THE LEOS PLATFORM CONSTITUTION** (`.cursor/rules/leos-constitution.mdc`).  
Delivery sequencing stays with [Executive Orchestrator](../agents/executive-orchestrator.md).

These skills follow the [Agent Skills](https://cursor.com/docs/skills) standard: Cursor loads only `name` + `description` until a task matches, then the `SKILL.md` body, then `references/` on demand.

## How this repo uses skills

| Layer | What it is | When it loads |
|-------|------------|----------------|
| **Rules** (`alwaysApply`) | Constitution, construction loop | Every chat |
| **Skills** (this folder) | Domain *how-to* — one job each | When description matches |
| **Agents** (`.cursor/agents/`) | Delivery *cast* (EO, builders, reviewers) | When Task/subagent is launched |
| **Craft kits** (`.agents/skills/`) | Generic design kits (Impeccable, Tastemaker, …) | Marketing / visual craft — see that README |

Do **not** paste the constitution into every skill — it is already `alwaysApply`.
Do **not** invent LEKs, runtimes, or architecture. Finish over expand.
Law without an assertion is incomplete (see `qa/money-invariants`).

## Authoring bar (research we adopted)

From Cursor docs, agentskills.io, and Anthropic skill-creator:

1. **Description is the trigger.** Third person. What it does *and* phrases humans actually say. Under 1024 characters.
2. **One skill, one job.** Architect vs implement vs review stay separate.
3. **SKILL.md stays lean** (procedure + never + handoff). Long catalogs live in `references/`.
4. **Assume the model is already smart.** Only add Lekki-specific law, tokens, and file paths.
5. **Handoffs are typed.** Name the next skill; do not dump another persona’s checklist.
6. **Hospitality industry “agent meshes” are not our architecture.** Narrow domain + capability abstraction + human confidence *are*. We already have that as Platform / Pack / EO.

When adding or rewriting a skill, read `engineering/leo-skill-authoring`.

## Taxonomy

```text
.cursor/skills/
├── architecture/   platform law (chief, platform, pack, api, data, security, engineering)
├── product/        human journeys (product, experience, studio, operate, growth, payments, hci)
├── design/         LVES, brand, motion, a11y + imported visual kits (gated)
├── engineering/    Angular web, NestJS runtime, Neo, docs, skill authoring
└── qa/             unit proof, money invariants, Playwright / HCI gate
```

## Invoke in chat

```text
As @operate-architect and @ux-architect, review service.page.ts…
As @studio-architect and @payments-architect, design Screen S5…
As @chief-architect and @platform-architect, review this PR for Pack leakage…
```

| Concern | Skill |
|---------|--------|
| ADR · Platform Rule · LEK integrity | `architecture/chief-architect` |
| Runtimes · Context · Capabilities · Profile | `architecture/platform-architect` |
| Vertical Packs | `architecture/pack-architect` |
| Contracts · OpenAPI · Events | `architecture/api-architect` |
| Persistence · Outbox · Audit | `architecture/data-architect` |
| Identity · RBAC · Secrets | `architecture/security-architect` |
| Nx · boundaries · reject cleverness | `architecture/engineering-architect` |
| Angular Guest / Studio / Operate / Grow | `engineering/angular-web` |
| NestJS runtime, Prisma, Outbox, HTTP | `engineering/nestjs-runtime` |
| Outcomes · Journeys | `product/product-architect` |
| HCI CX/DX/OX/PX score | `product/hci-confidence` |
| Guest Shell · QR · Sessions | `product/experience-architect` |
| Studio dual-pane · 1Q/1A | `product/studio-architect` |
| Task boards · Stations · Waiter | `product/operate-architect` |
| Calm metrics · Morning briefing | `product/growth-architect` |
| Payment Engine · Splits · Connectors | `product/payments-architect` |
| Money splits · cents · Decimal proof | `qa/money-invariants` |
| node:test · `.test.ts` · unit gate | `qa/unit-proof` |
| LVES tokens · Layout | `design/ux-architect` |
| Voice · Premium hospitality | `design/brand-architect` |
| 160/220/280/360 motion | `design/motion-architect` |
| WCAG 2.1 AA | `design/accessibility-architect` |
| Visual front-end craft · critique · browser QA | `design/web-design-engineer` |
| Awwards-quality **marketing** motion | `design/build-awwwards-quality-sites` |
| Neo · Context Dock · EKG | `engineering/ai-architect` |
| LEK · ADR · Blueprints · skill hygiene | `engineering/documentation-architect` |
| How we write skills | `engineering/leo-skill-authoring` |
| Quality gate (unit → journey → HCI) | `qa/qa-architect` |

## Surface map (do not mix)

| Surface | Feel | Skills first |
|---------|------|----------------|
| **Guest** | Luxury concierge. Three questions. No Studio machinery. | experience, ux, brand, motion, a11y, angular-web |
| **Studio Setup** | Frozen v1. White paper, 1Q/1A, one gold CTA, live Guest phone. | studio, ux, brand, angular-web |
| **Operate** | Touch-first certainty. One sticky job. No floor plans. | operate, ux, angular-web |
| **Grow** | Calm numbers, one question. Never BI walls. | growth, brand |
| **Marketing / Lekki.com** | Distinctive motion OK. | awwwards, tastemaker, web-design-engineer |
| **Runtime / Packs** | Generic platform; industry nouns in packs. | platform, pack, api, data, nestjs-runtime |

GSAP, Three.js, parallax, and “cinematic scroll” belong on **marketing**, not Guest/Studio/Operate.
