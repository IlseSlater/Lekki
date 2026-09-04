---
name: unit-proof
description: >-
  Owns Lekki unit tests: node:test, .test.ts, and the runtime `test` script.
  Use when adding or changing pure functions, money, settlement, profile-engine,
  or when the user says unit test, vitest, jest, .spec.ts, .test.ts, prove it,
  or “write a test.” Not Playwright and not HCI. Write the failing test first.
paths:
  - "**/*.test.ts"
  - "apps/runtime/src/leos/**"
  - "packages/profile-engine/**"
---

# Unit proof

**Agent twin:** `.cursor/agents/quality-evidence.md`

This repo does **not** use Vitest or Jest. Runtime unit tests are
`node:test` + `tsx` via `apps/runtime/package.json` `"test"`.
Angular continuity checks live as `apps/web/src/app/**/*.test.ts`.

## When

Any change to a pure function, money, settlement, secrets, or profile-engine.
Any request that names unit test / jest / vitest / spec.

## Do

1. Write the failing `*.test.ts` first. Then the fix.
2. Money, split, settle, Decimal → load `money-invariants` and assert the table.
3. New runtime test files under `src/leos/*.test.ts` are picked up by the
   `test` glob in `apps/runtime/package.json`. Self-check scripts still are not.
4. Prefer `node:assert/strict` exact equality. No `Math.abs(a - b) < epsilon`.
5. Self-check scripts (`test:refund`, `test:vault`, …) are not the gate.
   Promote a self-check to `*.test.ts` + the `test` script when the behaviour
   must not regress.
6. Run the relevant `pnpm --filter … test` (runtime: `@lekki/runtime-app`).

## Never

Ship logic with only Playwright · leave tests unlisted in `package.json` ·
approve because `tsc` is clean · introduce Vitest/Jest without a repo-wide
decision.

## Handoff

Money table → `money-invariants`. Browser journey → `qa-architect`.
Schema → `data-architect`.
