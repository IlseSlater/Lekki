---
name: nestjs-runtime
description: >-
  Implements Lekki NestJS runtime in apps/runtime: HTTP, Prisma, Outbox, staff auth,
  WebSocket, LEOS services. Use when changing API behaviour, health, payments
  capability wiring, catalogues, sessions, or “the API is down.” Not for Angular UI.
  Money arithmetic → money-invariants.
paths:
  - "apps/runtime/**"
---

# NestJS runtime (LEOS)

**Agent twin:** `.cursor/agents/backend-builder.md`

## When

Any change under `apps/runtime/`.

## Do

1. **Follow existing layers.** `http/` controllers, `leos/` domain services, `events/` Outbox, `prisma/`, `staff-auth/`, `ws/`.
2. **Capabilities, not vendors.** Call `PaymentCapability.CreatePayment` (and siblings). Never import Stripe/PayFast/Pilot SDKs in core services.
3. **Mutations that must be reliable** go through Outbox (`events/outbox.service.ts`, publisher). Do not add a second “emit if we remember.”
4. **Tenant isolation.** Workspace-scoped queries. No cross-workspace leaks for “demo convenience.”
5. **Money** is integer minor units (`leos/money.ts`). Load `money-invariants`; land the `node:test` first.
6. **Keep contracts calm.** Guest payloads never mention Studio, Pack, or runtime internals.
7. **Industry nouns** (`table`, `menu`, `kitchen`) stay in pack/profile data, not new generic runtime types.
8. **Health.** `/health` must stay truthful (database up/down). Do not kill port 3000 unless the user asks.
9. **Logs.** `correlationId` must appear on the HTTP/request log for the session it belongs to — domain fields that never reach the log are not observability.

## Never

- Direct DB writes that skip the owning service / Outbox where the platform already uses them.
- New architectural concepts without a proven caller and an ADR (Chief Architect).
- Exposing vault secrets in logs or evidence packages.
- Shipping money/split changes with only a browser check.

## Handoff

Boundary / Pack leakage → `platform-architect` + `chief-architect`. Schema truth → `data-architect`. Auth → `security-architect`. Payments law → `payments-architect`. Money proof → `money-invariants`.

## Read

`docs/LEKKI-MAP.md` · `docs/adr/`
