# Plan — the go-live moment

What the Mobbin pass actually changes, sequenced against work already specced.
Written 14 September 2026. Companion to `teardown-batch-golive-continuity.md`,
which it does not replace.

---

## The structural finding

The Mobbin pass and the go-live continuity batch land on the same screen, and
that is the useful part.

Salesforce's *Activate Store?* modal states consequences before activation —
what publishing does, who can log in, what gets sent. Our Go live button has no
confirmation at all, which is why the design review's Moment critic failed:
the human question at the pride beat is still *"Go Live · 5 of 5"*.

A confirm sheet fixes that. But look at what it has to contain:

> **Rusty Oak is about to open.**
> Guests can scan TBL-1 to TBL-12 in Main.
> Orders arrive at Kitchen — Ilse is signed in.
> Payments aren't connected, so guests pay in person.

Every clause in that sheet is an output of the one resolver from Part A, and
the sheet cannot be written unless the gate from Part B is satisfied.

**Parts A and B are done.** `resolveLiveFacts` and `canGoLive` are proven by
bar 4b/4c and unit tests. The confirm sheet is no longer the acceptance
surface for those — it is the **Moment** fix: one honest question at the
pride beat. Do not let the old argument carry it further than that.

---

## One dependency that binds three threads

The fourth line — *"Payments aren't connected, so guests pay in person"* — is
only true if the guest app actually degrades.

`allowPay` is design-intent ∧ `paymentsActive` (`PaymentConnectorInstall.status
=== 'active'` for the session venue). The same boolean is on `/entry/resolve`
and `GET /sessions/:id`, and it drives the Payments card / go-live extra row
(`Guests can pay in person` when false).

The confirm sheet can honour its fourth clause once this is live in the
running runtime (rebuild if `tsc-watch` has not picked it up).

---

## Stages

### Now — code

1. **`paymentsActive` — landed.** Last correctness item. Unblocks the sheet.
2. **Confirm sheet.** Honest Moment fix. Station not person (frozen decision 3).
3. **Post-live hub recession.** Frozen decision 2.

### Parallel — canvas (independent)

Required/optional marking · Import beside Add · recession artboard.

### Then — Stage 3 instrument (unchanged)

The population can't support a split test — a 5-point lift needs ~1,470 venues
per arm. Four counters instead:

- where in the hub a venue stops and does not return within 24h
- time from first hub visit to gate-green
- how many venues go live with payments unconnected — this number validates or
  kills the adoption-ramp decision
- how many live venues take zero orders in week one — the silent failure the
  gate exists to prevent

Plus five recorded sessions of an actual venue owner doing setup. That will
outperform any experiment this product can run.

---

## What we are not taking from Mobbin

Worth writing down so it isn't re-litigated:

- **Progress counters.** Shopify's "1 / 11 completed", Uvodo's and
  Customer.io's bars. LVES says never % complete and `studio-home`'s own
  comment already says it. With three gate rows a bar adds nothing a glance
  doesn't give. A decision, not an oversight.
- **Illustration thumbnails per row** (Shopify). Wrong weight for surgical white.
- **A dismissible setup guide** ("All caught up"). Ours gates go-live; it
  cannot be dismissed.
- **Emoji** (Uvodo's 👋). Banned.
- **Advisory activation.** Salesforce's modal says "make sure you complete the
  set up tasks" and then lets you activate anyway. They can afford that — an
  unfinished store simply doesn't sell. A restaurant with nobody listening
  drops tickets. Ours refuses. If someone later proposes aligning with the
  Salesforce pattern, this is the line that says why not.

---

## Frozen decisions (14 September 2026)

1. **Catalogue: priced to open, Free to show.** Go-live requires at least one
   item with `priceMinor > 0`. Complimentary lines may sit beside it. A
   zero-only catalogue is `missing` — same rule as `resolveLiveFacts` today.
   Guest (and the Live phone) never render `R0.00`; a zero unit price is the
   word **Free**. A zero-total bill is a hospitality close, not a PayFast
   charge. `leosMoney` stays for money; Free is a display exception at the
   catalogue/line, not a currency format.

2. **Day-two hub leads with the floor, not setup.** Recess the gate group into
   one satisfied line (`Open · Main · 12 tables · Kitchen`). What replaces it
   is **Today’s Experience** — the same two facts Studio Home already speaks
   when live: guests (places open / ready for the next guest) and the station
   (`Kitchen is calm` / tickets waiting). Gold primary is **Open Operate**.
   Optional cards (payments, menu, QR) sit under that. Not an order list (that
   is Operate). Not an empty optional stack (the owner would not know why they
   opened Studio).

3. **Confirm sheet names the station, not the person.** Durable clause:
   `Orders arrive at Kitchen`. Who is signed in is live and belongs on the
   day-two hub / Operate glance, only while it is true — never frozen onto
   the sheet. A named person at confirm is the thing the owner fears, and a
   lie five minutes later is worse than a cooler sentence.
