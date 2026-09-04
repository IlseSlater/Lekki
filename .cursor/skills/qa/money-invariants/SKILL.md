---
name: money-invariants
description: >-
  Proves Lekki money arithmetic: splits, tips, settlement, rounding, minor units.
  Use before merging anything touching payments, transactions, Decimal columns,
  toMinor, split or settle. Triggers: split bill, equal share, tip, settle,
  rounding, cents, Decimal, unit test, does the maths work. Write the test, then the fix.
paths:
  - "apps/runtime/src/leos/**"
  - "prisma/schema.prisma"
---

# Money invariants

**Agent twin:** `.cursor/agents/quality-evidence.md`

## When

Any change to money storage, arithmetic, allocation, settlement or refunds.

## Current risk

Arithmetic and mapping are gated (`src/leos/*.test.ts`). Row 5 is closed by
session `billMinor`/`paidMinor`/`version` plus 409 mapping — not by a race
harness. Row 10 is a stub tripwire. Last-payer sequential allocation (row 2)
is still partial.

## Do

1. Write the failing test first. Money changes land test-first, no exceptions.
2. Assert against the table in `references/invariants.md`. Add a `node:test`
   case under `apps/runtime/src/leos/*.test.ts` and register it in
   `apps/runtime/package.json` `test` if it is a new file.
3. Money is `Decimal` at rest, **integer minor units** in arithmetic
   (`toMinor` / `fromMinor` / `addMinor`). Never float, never an epsilon.
4. Every allocation must sum back to the total. Prove it, do not reason it.
5. Concurrency counts: two payers racing is a test, not an edge case.
6. Run `pnpm --filter @lekki/runtime-app test` before calling the change done.

## Never

Approve money on a browser screenshot · compare with a tolerance ·
round mid-calculation · trust a client-supplied amount · skip the table
because “the journey looks right.”

## Handoff

Design law → `payments-architect`. Schema → `data-architect`.
Generic unit tests → `unit-proof`. Journey evidence → `qa-architect`.
