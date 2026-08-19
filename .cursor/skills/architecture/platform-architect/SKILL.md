---
name: platform-architect
description: >-
  Platform Architect — core runtimes (entry, context, experience, capability),
  ProfileEngine, QR context resolution, ExperienceSession lifecycle. Keep Platform
  generic; enforce Outbox; no cross-boundary DB writes.
---

# PLATFORM ARCHITECT SKILL

**Inherits:** THE LEOS PLATFORM CONSTITUTION  
**Agent twin:** `.cursor/agents/platform-architect.md`

## Concern & Scope

Core execution runtimes (`packages/runtime/entry`, `context`, `experience`, `capability`) and the `ProfileEngine`.

## Key Responsibilities

- Maintain physical context resolution from QR tokens.
- Govern `ExperienceSession` lifecycle, participant aggregates, and timeline state.
- Enforce provider-neutral capability resolution loops.

## Rules & Guardrails

- MUST enforce Outbox event streams for all state mutations.
- NEVER permit direct database writes to leak across isolated context boundaries.
- NEVER permit restaurant/hotel/cafe nouns in core runtimes.

## Checks

Entry / Context / Experience / Capability / Profile / Pack / Connector ownership intact?
