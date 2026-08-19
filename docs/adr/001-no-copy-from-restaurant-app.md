# ADR-001: No Code Copy from Restaurant App

## Status

Accepted

## Context

`C:\Restaurant App` is the **Reference Experience** — a mature Angular/NestJS implementation that proves certain dining behaviours in production. LEOS is a greenfield Experience Operating System. Migrating or copying code risks inheriting restaurant-specific assumptions into core platform boundaries.

## Decision

- All LEOS code lives under `C:\Lekki`.
- Restaurant App is **reference only** for **behaviour** comparison (see [ADR-003](003-reference-experience-rule.md)).
- No copy, migrate, or refactor of Restaurant App source into LEOS.
- Every LEOS concept must earn its place in the platform architecture.
- Ask *“What behaviour has been proven?”* — not *“How do we migrate this?”*

## Consequences

- Slower initial velocity, stronger platform boundaries.
- Behaviour parity is validated by journey/behaviour comparison, not code diff.
- Restaurant is evidence; LEOS is the product.
