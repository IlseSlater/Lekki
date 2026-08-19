# LEOS Specialist Architecture Framework

Specialist skills share **THE LEOS PLATFORM CONSTITUTION** (`.cursor/rules/leos-constitution.mdc`).  
Delivery sequencing stays with [Executive Orchestrator](../agents/executive-orchestrator.md).

## Taxonomy (Cursor-discoverable)

Cursor skills require a folder + `SKILL.md`. Paths map 1:1 to the framework names:

```text
.cursor/skills/
├── architecture/{chief|platform|pack|api|data|security|engineering}-architect/SKILL.md
├── product/{product|experience|studio|operate|growth|payments}-architect/SKILL.md
├── design/{ux|brand|motion|accessibility}-architect/SKILL.md
├── engineering/{ai|documentation}-architect/SKILL.md
└── qa/qa-architect/SKILL.md
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
| Nx · Angular · NestJS | `architecture/engineering-architect` |
| Outcomes · Journeys · HCI | `product/product-architect` |
| Guest Shell · QR · Sessions | `product/experience-architect` |
| Studio dual-pane · 1Q/1A | `product/studio-architect` |
| Task boards · Stations · Waiter | `product/operate-architect` |
| Calm metrics · Morning briefing | `product/growth-architect` |
| Payment Engine · Splits · Connectors | `product/payments-architect` |
| LVES tokens · Layout | `design/ux-architect` |
| Voice · Premium hospitality | `design/brand-architect` |
| 160/220/280/360 motion | `design/motion-architect` |
| WCAG 2.1 AA | `design/accessibility-architect` |
| Neo · Context Dock · EKG | `engineering/ai-architect` |
| LEK · ADR · Blueprints | `engineering/documentation-architect` |
| HCI · Playwright · Evidence | `qa/qa-architect` |

Existing `.cursor/agents/*` remain the Task/subagent delivery cast.
