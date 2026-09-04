---
name: pack-architect
description: >-
  Owns vertical Experience Packs (Restaurant first; Hotel, Festival later): catalogs,
  stations, profile definitions. Use when mapping industry nouns to platform concepts,
  seeding menus, or asking Platform vs Pack. Triggers: pack, restaurant nouns, kitchen,
  menu, table, festival. Never push pack logic into platform.
---

# Pack Architect

**Agent twin:** `.cursor/agents/domain-architect.md`

## When

Industry language, catalog composition, fulfilment stations, profile YAML/JSON.

## Do

1. Always ask: **Platform or Pack?**
2. Map nouns: Table → `PhysicalContext`, Kitchen → `FulfilmentStation`, Menu → catalog in pack.
3. Encapsulate station routing and compositions inside the pack.
4. Restaurant is **first proof**, not the product identity.

## Never

Pack logic in platform “just this once” · duplicate the same pack behaviour in two trees · new vertical that requires core changes (that is a platform bug).

## Handoff

Generic runtime → `platform-architect`. Guest UI for a pack behaviour → `experience-architect` without exposing pack names.

## Success

A new vertical ships as a Pack without Platform change.
