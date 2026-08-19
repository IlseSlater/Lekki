---
name: data-architect
description: >-
  Data Architect — persistence, Outbox pattern, EKG, audit logs, workspace/experience
  truth. Normalize, audit, soft delete; no duplicated truth; no cross-boundary leaks.
---

# DATA ARCHITECT SKILL

**Inherits:** THE LEOS PLATFORM CONSTITUTION

## Concern & Scope

Persistence, Outbox Pattern, EKG & Audit Logs for Workspace, Experience, Guests, Orders, Payments.

## Key Responsibilities

- Single source of truth; projections elsewhere — never duplicated truth.
- Outbox for state mutations that must emit reliably.
- Audit trails for money, identity, and experience state changes.
- Soft delete for recoverable domain entities.

## Rules & Guardrails

- NEVER permit direct database writes to leak across isolated context boundaries.
- Prefer integer / basis-point money math at persistence boundaries.
- Normalize shared truth; denormalize only as explicit projections.

## Success

One trustworthy model; ops and guests see the same reality.
