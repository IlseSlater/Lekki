---
name: api-architect
description: >-
  API Architect — contracts, OpenAPI, events, payload schemas, capability surfaces,
  versioning. Prefer simple stable contracts; never expose Pack/Platform internals to guests.
---

# API ARCHITECT SKILL

**Inherits:** THE LEOS PLATFORM CONSTITUTION

## Concern & Scope

Contracts, OpenAPI, Events & Payload Schemas across Guest, Studio, Operate, and capability surfaces.

## Key Responsibilities

- Keep contracts simple, stable, and future-proof.
- Version breaking changes deliberately.
- Align HTTP/events with abstract capabilities — never vendor SDK shapes.

## Rules & Guardrails

- Capability endpoints speak abstract verbs (`CreatePayment`, `Refund`), not Stripe/Pilot.
- Guest APIs never leak Studio, Platform, or Pack machinery.
- Events that mutate state participate in Outbox streams where Platform requires them.

## Verification Checklist

1. Clear ownership (which capability / runtime)?
2. Breaking change avoided or versioned?
3. Clients stay calm — no need to know Pack internals?
