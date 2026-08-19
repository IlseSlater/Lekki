# ADR-003: Reference Experience Rule

## Status

Accepted

## Context

`C:\Restaurant App` is a mature production system. Early LEOS work risked treating it as “the old app to migrate.” That framing pulls restaurant software into the platform centre and conflicts with LEK-001 (Experiences before applications; Platform before product).

The relationship has flipped: **LEOS is the product. Restaurant is evidence.**

## Decision

**Reference Experience Rule**

> Existing applications are used to validate **behaviours** and **interaction patterns**. They do not define LEOS architecture, terminology, or implementation.

Corollaries:

1. Ask *“What behaviour has already been proven?”* — not *“How do we migrate this?”*
2. Steal **behaviour and proof**; keep **runtimes and components** LEOS-owned.
3. Describe behaviours in platform language (survive Hotel / Festival / Golf), not restaurant feature names.
4. Proven behaviours are catalogued in [LEK-038 Behaviour Inventory](../LEK-038-behaviour-inventory.md).
5. Code still must not be copied ([ADR-001](001-no-copy-from-restaurant-app.md)).

## Consequences

- Restaurant App = **Reference Experience** (first mature Experience Pack proof), not legacy to preserve.
- Design badges: **Behaviour Proven ✓ Restaurant** vs **Behaviour New — LEOS Native**.
- New packs reuse behaviours; they do not re-litigate architecture from industry apps.

## Related

- [ADR-001](001-no-copy-from-restaurant-app.md) — no code copy  
- [ADR-002](002-platform-rule.md) — runtime ownership  
- [LEK-001](../LEK-001.md) — Platform Constitution (Frozen)
