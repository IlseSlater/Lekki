# Batch — Go-live continuity and the gate

Work order for the S-06 / Go-live QR review failure. Read against the working
tree on 14 September 2026. Device shell is down (Windows update, 8 Sept), so
everything below is from reading files, not running them — the DO steps assume
you can run the suite.

---

## The cause, before the work order

The review's finding — *"the QR card, the desk phone and the public Guest shell
do not share one venue / place / catalogue truth"* — is correct and is a
symptom. Three separate mechanisms produce it, and all three are visible in the
code.

### 1. One store, two read disciplines

Both Studio surfaces read the same object, `StudioContextService.activeExperience()`,
which is backed by **localStorage** (`studio-context.service.ts:239-273`, key
`WS_KEY`, with legacy-key migration at `:179-201`). But:

- **`setup-golive-engine.page.ts`** reads it **once**, in `ngOnInit()` (`:218-231`).
  Never again. No effect, no subscription, no re-read on navigation.
- **`live-experience-panel.component.ts`** reads it **reactively** — an `effect()`
  in the constructor (`:538-546`) keyed on `ctx.liveRevision()`,
  `ctx.liveFocusPlace()`, `ctx.livePayMethods()` and `catalogueLive.revision()`,
  plus a re-hydrate on every `NavigationEnd` (`:549-553`).

So the panel picks up context that arrives after first paint and the card does
not. The card can hold a first-paint value for the life of the screen. That
alone can produce two different venue names on one screen from one store.

### 2. Two fallback chains, ending in two different literals

Same three fields, resolved differently in each component:

| | Go-live card | Desk phone (panel) |
|---|---|---|
| typeId | `getExperience(active?.typeId)` — **no default**, so `def` is `undefined` when typeId is absent (`page:220`) | `active?.typeId ?? 'restaurant'` — **defaults to restaurant** (`panel:594`) |
| venue | `active?.venueName \|\| def?.defaults.venueName \|\| 'Your venue'` (`page:207, 221`) | `active?.venueName?.trim() \|\| def?.defaults.venueName \|\| 'Your place'` (`panel:512, 596`) |
| place | `active?.placeCode \|\| def?.defaults.placeCode` (`page:222`) | `active?.placeCode \|\| active?.placeCodes?.[0] \|\| def?.defaults.placeCode \|\| ''` (`panel:621`) |
| catalogue | not rendered | `api.getCatalogue(venueId)` (`panel:684-699`), **falling back to `projectionCatalogueForType(typeId)` sample data** when the API returns nothing (`panel:670-677`) |

Two consequences worth stating plainly:

- **"Your venue" is the card's own string literal** (`page:207`). Seeing it on
  the render proves *both* earlier lookups returned nothing — the workspace had
  no venue name **and** `typeId` did not resolve. Had typeId resolved to
  restaurant, the card would read **"Your place"** (the registry default at
  `experience-registry.ts:83`), not "Your venue".
- **"Table 12" is a demo constant.** `experience-registry.ts:85` —
  `defaults.placeCode: 'Table 12'`, sitting beside `token: 'qr-demo-restaurant'`
  (`:87`). Every experience type has a matching pair (`:114-119` cafe,
  `:146-151` hotel, `:178-183` festival, `:210-215` airport, `:242-247`
  healthcare). These are the `qr-demo` tokens still open on the teardown.

So the phone line *"Rusty Oak · Table 12"* is not one wrong source. It is a
**real venue name composited with a demo place code in a single sentence**.
That is worse than two surfaces disagreeing, because nothing on screen marks
which half is real.

The same applies to the catalogue: `loadVenueCatalogue` fetches the real
catalogue by `venueId`, but `sampleTotalFor` (`panel:670-677`) silently
substitutes `projectionCatalogueForType(typeId)` when the fetch returns empty.
"Craft Lager R45" is that substitution. The public shell's "Chef's Bowl R0.00"
is the real catalogue.

### 3. The gate is not enforced anywhere

```ts
// setup-golive-engine.page.ts:267-273
confirmGoLive() {
  if (!this.entryToken) return;
  this.ctx.upsertActive({ token: this.entryToken, live: true });
  this.ctx.markStep('golive');
  this.isLive = true;
  this.setEntryUrl(this.entryToken);
}
```

The only precondition is that a token exists. The method builds
`this.checklist` at `:236-256` with an `ok: boolean` on every row and **never
reads it**. The button's `[disabled]` is `minting || !entryToken` (`:101`) —
the same non-check.

That is the review's own Must Fix — *"do not mark live while the checklist
still says places are none"* — and it is the go-live gate agreed in the hub
flow. It is not implemented on this screen or anywhere else.

**And the checklist is missing a gate condition.** Its four rows are *Who you
are · What guests experience · Where guests join · How guests pay*
(`:236-256`). There is **no menu row**. The agreed gate is venue + place, a
menu with at least one item, and a staff member with a station — so the screen
checks one condition it should not gate on (pay) and omits two it should
(menu, staff/station).

### 4. A contradiction the review should have caught

`mintEntryToken` **does** guard on places: *"Venue places aren't ready yet —
finish Places setup first."* (`:329`). The reviewed screen has a minted token
(`e_c98018248574`), so that guard passed — the **server resolved a physical
context**. Yet the Studio checklist on the same screen says places are
*"None yet"*, because `placeCount` (`:227-229`) reads Studio's localStorage
copy, not the server.

So "None yet" is not a truthful report of empty state. It is the client store
being stale relative to a server that just minted against real places. Fixing
the label without fixing the read would hide a real drift.

---

## Why not to scope this as "close the continuity gap"

Scoped as parity, the cheapest passing fix is to make the phone read whatever
the card reads. All three surfaces then agree on *"Your venue · Table 12"*, the
bar goes green, and the owner is shown a consistent fiction. Parity is the
wrong success condition when two of the three readers are on fallbacks.

The success condition is **one resolver, no silent fallbacks**.

---

## Part A — one resolver

```
@angular-web @studio-architect @unit-proof

CONTEXT
S-06 Go-live QR — the Studio card, the desk phone and the public /entry render
different venue, place and catalogue for the same token.

PROBLEM (verified 14 September)
Two components resolve the same three facts through two different fallback
chains, with two different terminal literals ('Your venue' vs 'Your place') and
two different typeId defaults (none vs 'restaurant'), reading one localStorage
store under two different disciplines (one-shot ngOnInit vs effect + NavigationEnd).
Registry demo constants ('Table 12', projectionCatalogueForType) fill the holes,
so a single rendered line can be half real and half fabricated.

SITES
apps/web/src/app/pages/setup-golive-engine.page.ts:207-231
apps/web/src/app/pages/setup-golive-engine.page.ts:55-62 (QR label, place line)
apps/web/src/app/leos/live-experience-panel.component.ts:512-537 (field defaults)
apps/web/src/app/leos/live-experience-panel.component.ts:538-553 (effect + ngOnInit)
apps/web/src/app/leos/live-experience-panel.component.ts:593-625 (hydrate)
apps/web/src/app/leos/live-experience-panel.component.ts:660-699 (sample catalogue fallback)
apps/web/src/app/studio/experience-registry.ts:82-88, 114-119, 146-151, 178-183, 210-215, 242-247
apps/web/src/app/services/studio-context.service.ts:161-175 (server overview sync)
apps/web/src/app/studio/live-facts.ts (new, pure)
apps/web/src/app/studio/live-facts.test.ts (new)

DO

1. Write apps/web/src/app/studio/live-facts.ts — pure, no Angular, no HTTP.
   Same shape as payment-session-cap.ts / outbox-policy.ts / guest-visible-event.ts.

     export type LiveFactsInput = {
       /** Server truth for the minted token. Absent until it loads. */
       session: {
         venueName?: string | null;
         placeCode?: string | null;
         catalogue?: Array<{ label: string; priceMinor: number }> | null;
       } | null;
       /** Studio's local workspace copy. Never a source of record. */
       workspace: {
         venueName?: string | null;
         placeCode?: string | null;
         placeCodes?: string[] | null;
       } | null;
     };

     export type LiveFactsField = 'venueName' | 'placeCode' | 'catalogue';

     export type LiveFacts = {
       venueName: string;
       placeCode: string;
       catalogue: Array<{ label: string; priceMinor: number }>;
     };

     export type LiveFactsResult =
       | { resolved: true; facts: LiveFacts; source: 'session' }
       | { resolved: false; missing: LiveFactsField[]; partial: Partial<LiveFacts> };

     export function resolveLiveFacts(input: LiveFactsInput): LiveFactsResult;

   Rules the function must implement:
   - Session wins for every field, always. Workspace is used ONLY to render an
     optimistic value BEFORE the session loads, and when it is used the result
     is `resolved: false` with that field listed in `missing`.
   - No registry defaults. No string literals. A field with no session value and
     no workspace value is `missing`, never a placeholder.
   - `catalogue` is `missing` when the session catalogue is null OR empty. An
     empty menu is a missing fact, not an empty list to paper over.
   - `resolved: true` requires all three present from session. Nothing else
     returns true.

2. Add a second pure module for the spoken line, so both surfaces render the
   same sentence from the same function:

     export function spokenPlaceLine(facts: LiveFacts): string;
       // "Rusty Oak · T1" — one join, one separator, one order.

   Both the card (`page:57-62`) and the phone (`panel:61`, `:153`) call it.
   Never two template expressions building the same sentence.

3. Delete the terminal literals and the registry fallbacks from both runtime
   read paths:
   - `page:207` `venueName = 'Your venue'` — remove the field default.
   - `page:220-222` — stop calling `getExperience(...)` for venue/place.
   - `panel:512` `venueName = 'Your place'` — remove.
   - `panel:594` `active?.typeId ?? 'restaurant'` — do not default typeId for
     FACT resolution. Keep it, if needed, for `terminology` and `mode` only,
     and say so in a comment.
   - `panel:596, 621` — replace both chains with `resolveLiveFacts`.
   - `panel:670-677` `sampleTotalFor` — the `projectionCatalogueForType`
     fallback goes. When the venue catalogue is empty the panel renders the
     unresolved state, not a sample.

   Registry `defaults` may stay in the file for pack seeding and for the
   create-flow's example content. They must not be reachable from the go-live
   or live-panel read path. Prove it: no import of `getExperience` in the
   fact-resolution code path.

4. Make the card reactive. `page` currently snapshots in `ngOnInit`. Give it
   the same trigger set the panel uses (`ctx.liveRevision()` at minimum) so a
   context that arrives after first paint updates both. A one-shot read on a
   screen that mints asynchronously is the bug, not the style.

5. Render the unresolved state honestly. When `resolved: false`, the affected
   line shows what is missing and how to fix it — "No venue name yet ·
   Add it in Your venue" — using ink, not a name-shaped placeholder. Never
   render a string that could be mistaken for the venue's actual name.

6. Write apps/web/src/app/studio/live-facts.test.ts FIRST and watch it fail.
   Minimum cases:
   - session complete → resolved:true, facts are the session values verbatim
   - session venue present, workspace venue different → session value wins
   - session null, workspace complete → resolved:false, all three in `missing`,
     `partial` carries the workspace values
   - session catalogue `[]` → 'catalogue' in `missing`
   - session catalogue null → 'catalogue' in `missing`
   - no session and no workspace venue → 'venueName' in `missing`, and the
     result contains no string from experience-registry (assert the literal
     'Table 12' and 'Your place' appear nowhere in the output)
   - spokenPlaceLine joins with exactly one ' · ' and no trailing separator

7. Re-run: pnpm --filter @lekki/web test (or the workspace test script — the
   glob is now src/**/*.test.ts, so a new file in src/app/studio/ runs).

DONE WHEN
- `resolveLiveFacts` is the only place venue, place or catalogue is chosen, and
  both the card and the phone call it.
- Grep proves it: 'Your venue', 'Your place' and `defaults.placeCode` appear in
  no file on the go-live or live-panel render path.
- With a workspace that has a venue name and no typeId, the card and the phone
  render the SAME venue string — not two literals.
- With an empty venue catalogue, the phone shows the unresolved state and no
  sample item. 'Craft Lager' and 'Classic Burger' cannot reach the screen.
- A context update after first paint changes the card, not just the phone.
- Test count does not drop; new tests are green.

DO NOT
- Do not make the phone read the card's values to force parity. That produces
  three surfaces agreeing on demo data, which passes the bar and ships a lie.
  Session is the source; everything else is an optimistic pre-load.
- Do not keep a "friendly" fallback string for the unresolved case. A
  placeholder that reads like a name is the exact defect being fixed.
- Do not delete `defaults` from experience-registry.ts wholesale in this batch —
  the create flow may still seed from it. Cut the read path, not the data.
- Do not touch the public /entry or guest shell rendering. It is already the
  correct reader; the two Studio surfaces are what changed.
- Do not touch frozen Setup step order, or any surface outside SITES.
```

---

## Part B — enforce the gate

```
@angular-web @studio-architect @unit-proof

CONTEXT
S-06 — the screen marks a venue live without checking its own checklist.

PROBLEM (verified 14 September)
confirmGoLive (setup-golive-engine.page.ts:267-273) checks only that a token
exists. It builds this.checklist with an `ok` flag per row at :236-256 and never
reads it. The primary button's [disabled] (:101) is the same non-check. The
checklist also omits two agreed gate conditions (menu, staff+station) and
includes one that is not a gate condition (payments).

SITES
apps/web/src/app/pages/setup-golive-engine.page.ts:101 (button disabled)
apps/web/src/app/pages/setup-golive-engine.page.ts:236-256 (checklist rows)
apps/web/src/app/pages/setup-golive-engine.page.ts:267-273 (confirmGoLive)
apps/web/src/app/pages/setup-golive-engine.page.ts:227-229 (placeCount source)
apps/web/src/app/studio/golive-gate.ts (new, pure)
apps/web/src/app/studio/golive-gate.test.ts (new)

DO

1. apps/web/src/app/studio/golive-gate.ts — pure:

     export type GateConditionId = 'venue' | 'places' | 'menu' | 'orders';

     export type GateCondition = {
       id: GateConditionId;
       label: string;      // "Your venue"
       value: string;      // "Rusty Oak · Main"
       ok: boolean;
       required: true;     // every gate condition is required, by definition
     };

     export type GateExtra = {
       id: string;
       label: string;
       value: string;
       ok: boolean;
       required: false;    // shown, never blocking — payments lives here
     };

     export function canGoLive(rows: Array<GateCondition | GateExtra>): {
       ok: boolean;
       blocking: GateConditionId[];
     };

   `canGoLive` returns ok only when every `required: true` row is ok. A row it
   does not recognise is NOT treated as satisfied — an unknown id with
   `required: true` and `ok: false` blocks. Fail closed, same rule as the
   station table.

2. Rebuild the checklist against the agreed gate:
   - `venue` — required. Venue name present AND at least one place.
   - `menu` — required. At least one catalogue item. **This row does not exist
     today and must be added.** Source it from the same session catalogue
     Part A resolves, so the checklist and the phone cannot disagree.
   - `orders` — required. At least one staff member with a station. Also absent
     today.
   - `experience` — keep as an extra (`required: false`). Nothing about it
     blocks a scan.
   - `pay` — move to `required: false`. A venue opens without payments; guests
     pay in person. This was decided and it is what the guest UI must degrade to.

3. Fix the places source. `placeCount` (:227-229) reads Studio's localStorage
   copy while `mintEntryToken` (:315-332) proves the SERVER has places. Read the
   gate's place count from the same session facts Part A resolves. If they
   disagree, the gate trusts the session.

4. Wire it:
   - `confirmGoLive` starts with `const gate = canGoLive(this.rows); if (!gate.ok) return;`
     and surfaces `gate.blocking` — naming what is missing and linking to it.
   - The primary button's `[disabled]` becomes `minting || !entryToken || !gate.ok`.
   - Both read the same `canGoLive` result. Not two expressions.

5. Tests first, in golive-gate.test.ts:
   - all required ok, extras not ok → ok:true (payments not blocking)
   - places not ok → ok:false, blocking contains 'places'
   - menu not ok → ok:false, blocking contains 'menu'
   - orders not ok → ok:false, blocking contains 'orders'
   - an unrecognised required row that is not ok → ok:false (fail closed)
   - empty rows array → ok:false, not true

DONE WHEN
- With places, menu or orders unsatisfied, the Go live button is disabled and
  confirmGoLive is a no-op, and the screen names which condition is unmet.
- With payments unconnected and everything else satisfied, going live works.
- The checklist shows five rows: four gate conditions and payments as an extra,
  visually separated the way the hub separates them.
- 'None yet' can no longer appear beside a screen that successfully minted a
  token, because both read the session.

DO NOT
- Do not gate on payments. That is the adoption ramp and it was decided.
- Do not make the gate advisory (a warning the operator can dismiss). If it can
  be dismissed it is not a gate and the three-way split comes back.
- Do not compute readiness in the template. One function, two call sites.
```

---

## Part C — token drift on the same file

```
@angular-web @brand-architect @unit-proof

CONTEXT
S-06 System critic — hardcoded colour and wrong token fallbacks on the Go Live card.

PROBLEM (verified 14 September)
setup-golive-engine.page.ts:126 sets `color: #b42318` with no token. Worse, the
`var(--token, #fallback)` pairs in the same stylesheet carry values that are not
the tokens' real values, so a missing shell class renders a near-miss palette
rather than the right one — harder to spot than an unstyled page:

  :120  var(--studio-ink-secondary, #6b7280)   real token #64748b
  :142  var(--studio-line, #e7e2db)            real token #eae6e1
  :146  var(--studio-ink-tertiary, #8f96a3)    real token #94a3b8
  :154  var(--studio-ink, #1b2230)             real token #0f172a
                                                (#1b2230 is --leos-on-brand,
                                                 the gold-button label colour)
  :158  var(--studio-ink-secondary, #6b7280)   real token #64748b

SITES
apps/web/src/app/pages/setup-golive-engine.page.ts:110-200 (styles block)

DO
1. Replace #b42318 with var(--leos-danger) (#c65b52).
2. Drop every hex fallback. `var(--studio-ink)` with no second argument. The
   shell class is always present on this route; a missing token should fail
   visibly, not silently render a different palette.
3. Add the check to the existing CI lint pass: a hex literal inside
   apps/web/src/app/pages/**/*.page.ts styles is a failure, with a KNOWN_OPEN
   set seeded from today's real hits so CI goes green and novel sites fail.
   Same shape as the noun linter.

DONE WHEN
- No hex literal in this file's styles block.
- The linter fails on a newly introduced one.

DO NOT
- Do not "fix" the fallbacks by correcting their hex values. The fallback is
  the defect; a correct duplicate is a second source of truth.
```

---

## Bar amendment

Item 4 currently reads *"The right pane is labeled Live Experience and shows
Guest shell grammar (venue, place, catalogue). It is not a static mock, not
labeled Preview."* You failed it for parity — and the review says so
explicitly: *"Public Guest after skip is the running shell... The failure is
parity, not a fake preview."*

As written, the next run makes the phone real, passes item 4, and still fails
the owner. Split it:

> **4.** The right pane is labeled Live Experience and shows Guest shell
> grammar. It is not a static mock, not labeled Preview.
>
> **4b.** For the minted token, the desk phone's venue name, place code and
> first catalogue line are **character-identical** to the public `/entry`
> render. Compare the two strings, not the impression. Evaluate only when
> both sides are resolved (`facts.resolved === true`). Identical unresolved
> copy (`No priced menu yet`) is a 4c fail, not a 4b pass.
>
> **4c.** No string from `experience-registry.ts` `defaults` or
> `projectionCatalogueForType` appears on either surface. Grep the rendered
> DOM for `Table 12`, `Your place`, `Craft Lager`, `Classic Burger`.

And one to add, because the gate is now enforceable:

> **8.** Go live is refused while any gate condition is unmet, and the screen
> names the unmet condition. A checklist row reading "None yet" and a live
> venue cannot coexist.

---

## One decision this needs from you

**`R0.00` on the public shell.** The review calls it out of scope. It is not.
The agreed gate is a menu with at least one item; a catalogue of zero-priced
items means the gate passed on an item with no price. Either:

- **(a)** a price is part of what makes an item count for the gate — the menu
  card's first-item row requires it, and `resolveLiveFacts` treats a
  zero-priced-only catalogue as `missing`; or
- **(b)** zero is legitimate (comped water, a free side) and the guest UI has a
  defined render for it — "Free", not "R0.00" — and the pay path handles a
  zero-total order.

I would take (a) for the gate and (b) for the renderer: require a priced item
to open, and still render free items properly once open. But it is a product
call, and Part A's `catalogue` rule depends on which way it goes.

---

## Sequence

1. **Part B** first, despite being the smaller change. It is three lines plus
   two new rows, and while it is missing every other fix can be reverted by an
   operator going live into an unmet state.
2. **Part A** — the resolver. Largest, and the one the review actually asked
   for.
3. **Part C** with either, it touches only the stylesheet.
4. Re-run the bar with 4b, 4c and 8 added.

The `qr-demo-*` tokens in `experience-registry.ts` stay open on the teardown
after this batch — Part A cuts them out of the *read path*, which removes the
symptom, but the constants remain in the file. Closing them properly is a
separate pass, and now it has a visible failure to point at.
