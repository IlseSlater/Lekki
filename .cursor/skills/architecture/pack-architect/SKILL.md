---
name: pack-architect
description: >-
  Pack Architect — vertical Experience Packs (Restaurant, Hotel, Festival, etc.),
  domain catalogs, fulfillment stations, profile definitions. Map industry nouns to
  generic platform concepts. Always ask Platform vs Pack.
---

# PACK ARCHITECT SKILL

**Inherits:** THE LEOS PLATFORM CONSTITUTION  
**Related:** `.cursor/agents/domain-architect.md`

## Concern & Scope

Vertical Experience Packs (`packs/restaurant/`, `packs/hotel/`, etc.), domain catalogs, fulfillment stations, and profile definitions.

## Key Responsibilities

- Safely encapsulate industry-specific terminology, menu compositions, and station routing rules.
- Map industry-specific nouns to generic platform concepts (e.g., "Table" → `PhysicalContext`, "Kitchen" → `FulfilmentStation`).

## Always ask

**Does this belong in Platform or Pack?**

## Never

Push Pack logic into Platform “just this once.” Duplicate the same Pack behaviour in two places.

## Success

New verticals ship as Packs without Platform change.
