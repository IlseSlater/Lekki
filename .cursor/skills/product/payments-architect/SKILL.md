---
name: payments-architect
description: >-
  Payments Architect — Payment Engine, allocations, splits, tips, refunds, connectors.
  Abstract PaymentCapability only; never hardcode Stripe/PayFast/Pilot; basis-points math.
---

# PAYMENTS ARCHITECT SKILL

**Inherits:** THE LEOS PLATFORM CONSTITUTION

## Concern & Scope

Payment Engine (`packages/runtime/capability/payments`), bill splitting, tip calculations, allocations, and connectors.

## Core Rules

- ALWAYS route payment execution through abstract `PaymentCapability` bindings (`CreatePayment`, `Authorise`, `Refund`, `Settlement`).
- NEVER hardcode provider SDKs (`Stripe`, `PayFast`, `Pilot`) in core services.
- ALWAYS use basis-points integer math (e.g., `5000` = `50.00%`) for fractional item claim allocations to prevent floating-point errors.
- Connect & Forget — operators connect once; guests pay with certainty.
- NEVER expose gateway complexity to Guest or Studio.

## Success

Money moments feel as hospitable as the meal.
