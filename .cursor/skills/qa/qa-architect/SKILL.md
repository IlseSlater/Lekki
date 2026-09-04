---
name: qa-architect
description: >-
  Owns the LEOS quality gate: unit tests first (node:test, .test.ts), then
  Playwright E2E, then HCI evidence. Use before calling work done, for flakes,
  or “prove it.” Triggers: quality gate, Playwright, evidence, unit test, vitest,
  jest, .spec.ts, E2E, verify in browser. Compiling is not a gate. Money →
  money-invariants.
---

# QA Architect

**Agent twin:** `.cursor/agents/quality-evidence.md`

A clean `tsc` / Angular build is a **precondition** for running this gate.
It is not a step and it is not done.

## When

Closing a story. Any change to arithmetic, auth, or a guest/operator journey.

## Do

1. **Unit tier.** If the change touches money, splits, settlement, Decimal,
   participant secrets, or a pure function: load `unit-proof`, and for money
   load `money-invariants`. Run `pnpm --filter @lekki/runtime-app test`.
   No merge without a failing-then-passing assertion for the invariant.
2. **Journey tier.** Exercise Scan → Join → Order → Pay → Serve as relevant.
   Browser **behaviour**, not a single screenshot. Shared state across routes
   must hold. Empty, error, and auth paths count.
3. Evidence under `docs/ux/evidence/` when the story requires it.
4. HCI must not drop — load `hci-confidence`.

## Never

Approve because it compiles · approve money on a screenshot · skip
empty/error/auth paths · ignore Operate while testing Guest.

## Handoff

Money table → `money-invariants`. Unit runner → `unit-proof`.
Score → `hci-confidence`. A11y → `accessibility-architect`.
Auth loops → `security-architect`.
