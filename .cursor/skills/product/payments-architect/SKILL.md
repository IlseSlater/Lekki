---
name: payments-architect
description: >-
  Owns Payment Engine: allocations, splits, tips, refunds, connectors. Use for pay,
  claim lines, equal share, settlement, “connect payments.” Triggers: PaymentCapability,
  split, tip, refund, Stripe (must stay behind capability). Basis-points integer math.
  Proof of arithmetic → money-invariants (not this skill).
---

# Payments Architect

## When

Guest pay, splits, tips, refunds, Studio “how pay”, connectors.

## Current risk

Law is capability + minor units. Proof is incomplete — see
`money-invariants` / `references/invariants.md` (concurrency, secrets,
refunds, server tip still **open**).

## Do

1. Route through `PaymentCapability` (`CreatePayment`, `Authorise`, `Refund`, `Settlement`).
2. Basis-points integers (`5000` = 50%). No float money.
3. Connect once in Studio; guests never see gateway complexity.
4. Split/claim must stay fair and explainable in guest language.
5. Any arithmetic change: load `money-invariants` and land the test first.

## Never

Stripe/PayFast/Pilot SDKs in core · exposing PCI/gateway UI to Guest or Setup chrome · float percents · ship a split without a unit assertion.

## Handoff

Proof → `money-invariants` / `unit-proof`. HTTP → `api-architect` / `nestjs-runtime`. Vault → `security-architect`. Guest copy → `brand-architect`.
