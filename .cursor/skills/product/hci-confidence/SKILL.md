---
name: hci-confidence
description: >-
  Scores a change against the Human Confidence Index (CX, DX, OX, PX) and LEOS
  success triad. Use when the user mentions HCI, confidence, uncertainty, “is this
  calmer”, quality of a screen, or before calling a story done. Pair with qa-architect
  for Playwright evidence. Not for inventing metrics dashboards.
---

# Human Confidence Index

**Source:** `docs/LEK-040-human-experience-engineering.md` · `docs/NORTH-STAR.md`

Every change must **maintain or increase** HCI. Confidence is the product.

## When

Before shipping UI, copy, flow, or API behaviour that a human will feel.

## Do

Score the *moment*, not the ticket:

| Axis | Question | Fail if |
|------|----------|---------|
| **CX** Guest | Do I know where I am, what I can do, what happens next? | Explanation required |
| **DX** Designer/builder | Can I extend this without a new abstraction? | New concept without proof |
| **OX** Operator | Can I finish the job in two taps, under pressure? | Charts, floor plans, remember-this |
| **PX** Provider/owner | Can I go live / stay live without assistance? | Extra Setup steps, jargon |

Then the success triad:

1. Go live in minutes?
2. Delightful QR?
3. Pack without Platform change?

State the **uncertainty removed** in one sentence. If you cannot, the change is not ready.

## Never

- Approve because it compiles.
- Add a step that asks a human to remember.
- Ship a second gold button “just this screen.”
- Treat HCI as a slide — it is a gate.

## Handoff

Evidence and Playwright → `qa-architect`. Copy tone → `brand-architect`. Layout tokens → `ux-architect`.

## Read

`docs/NORTH-STAR.md` · `docs/ux/LEOS-Studio-Design-Blueprint.md`
