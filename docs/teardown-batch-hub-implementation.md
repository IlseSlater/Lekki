# Batch — the checklist hub, in code

Turns the canvas into Angular. Read against the working tree 15 September 2026.
Canvas: "Leo Studio Setup Hub", page **Go live & day two** and page **Setup**.

---

## The one thing that makes this a batch and not five patches

**The hub row does not exist as a component.** Four surfaces render it — the
not-open hub, the just-opened hub, the day-two hub, and the multi-venue hub —
and today `studio-home.page.ts:42-46` has only a label/value pair
(`studio-home__today-row`, a `__today-k` and a `__today-v`). No ring, no
sub-line, no action, no chevron.

Build the row once and every other part of this batch is data.

Row anatomy, exactly as drawn:

```
[ ring 20px ] [ title 15.5/600 ]                    [ verb 13/500 ] [ chevron 16 ]
               [ current value 13.5/400 #64748b ]
```

- container: `display:flex; align-items:center; gap:16px; padding:18px 0;`
  `border-bottom:1px solid #eae6e1` on all but the last, `cursor:pointer`
- ring **done**: `20px` circle, `background: var(--studio-success)`, white 12px check
- ring **needs**: `20px`, `border:1.5px solid var(--studio-ink)`, transparent
- ring **optional/not started**: `20px`, `border:1.5px solid #cfc7bb`, transparent
- verb: `color:#475569; font-weight:500` — never a status colour
- chevron: 16px, `stroke:#94a3b8`, stroke-width 2.2

### The rule the references gave us, and it removes a column

Apollo's integrations list heads its second column **ACTION** and fills it with
`Connect` / `Disconnect`. It carries no status badge, because the **group**
already says required-vs-optional and the **row treatment** says done-vs-not.

Ours was stating the same fact three times — group heading, ring, and a status
word (`Ready` / `Needs you` / `Optional`). The word goes. The third column is an
action verb:

| Card | not satisfied | satisfied |
|---|---|---|
| Your venue | `Set up` | `Review` |
| Your menu | `Add` | `Edit` |
| Orders go to | `Set up` | `Review` |
| Payments | `Connect` | `Manage` |
| Look & feel | `Choose` | `Change` |
| Your till | `Connect` | `Manage` |
| QR codes | — | `Print` |

Do not reintroduce a status word "for clarity". Three signals for one fact is
what we just removed.

---

## Part A — the row and the row builder

```
@angular-web @studio-architect @unit-proof

CONTEXT
The checklist hub needs one row used by four surfaces. It does not exist.

PROBLEM (verified 15 September)
studio-home.page.ts:39-49 renders Today's Experience as label/value pairs with
no state, no action and no destination. The setup surfaces have no row at all —
they are a wizard. Four artboards on the canvas draw the same row; nothing in
the codebase can render it.

SITES
apps/web/src/app/leos/studio-hub-row.component.ts   (new)
apps/web/src/app/studio/hub-rows.ts                  (new, pure)
apps/web/src/app/studio/hub-rows.test.ts             (new)
apps/web/src/app/studio/golive-gate.ts:22-38         (canGoLive — the source of `ok`)
apps/web/src/app/studio/live-facts.ts                (the source of every value)

DO

1. apps/web/src/app/studio/hub-rows.ts — pure, no Angular.

     export type HubRowState = 'done' | 'needs' | 'optional';

     export type HubRow = {
       id: GateConditionId | 'look' | 'till' | 'qr';
       title: string;          // "Orders go to"
       value: string;          // "Kitchen"  — the CURRENT value, never a status word
       state: HubRowState;
       verb: string;           // "Review" | "Set up" | ...
       route: string;
     };

     export type HubGroup = { heading: string; rows: HubRow[] };

     export function buildHubGroups(input: {
       gate: Array<GateCondition | GateExtra>;
       live: boolean;
       facts: LiveFactsResult;
     }): HubGroup[];

   Rules:
   - Two groups before live: "Before you open" (required) and
     "You can open without these" (extras). Order fixed, never sorted by state.
   - Once live, the required group collapses — see Part C. buildHubGroups
     returns ONE group, "When you have a minute", holding the extras plus menu
     and QR.
   - `verb` comes from the table above, chosen by `state`. One function,
     `verbFor(id, state)`, so the table exists once.
   - `value` is a current value or the empty string. It is NEVER 'Ready',
     'Needs you', 'Optional' or any status word — assert this in the test.
   - A row whose fact is missing gets `value: missingFactCopy(field)` from
     live-facts, so the hub and the panel say the same sentence.

2. apps/web/src/app/leos/studio-hub-row.component.ts — presentational only.
   Inputs: `row: HubRow`. No service injection, no routing logic beyond an
   output. Anatomy exactly as the table above. `role="link"`, `tabindex="0"`,
   Enter and Space both activate — it is 52px+ of clickable row and must be
   reachable without a mouse.

3. hub-rows.test.ts first:
   - a satisfied required row is state 'done' and verb 'Review'
   - an unsatisfied required row is state 'needs' and verb 'Set up'
   - an extra is state 'optional' regardless of ok, and never 'needs'
   - live:true returns exactly one group and it is not "Before you open"
   - no row's `value` is one of ['Ready','Needs you','Optional','Complete']
   - a missing fact produces the same string as missingFactCopy for that field

DONE WHEN
- One component renders every row on all four surfaces.
- verbFor is the only place a verb string is written.
- Grep proves no status word reaches a row value.

DO NOT
- Do not let the row fetch anything. It takes a HubRow and renders it.
- Do not add a status badge beside the verb. That is the column we deleted.
- Do not sort rows by state — a list that reorders under you loses the reader.
```

---

## Part B — `studio-home` becomes the hub

```
@angular-web @studio-architect @unit-proof

CONTEXT
studio-home already computes progress and a next step; it renders a wizard
resume button instead of the checklist it has the data for.

PROBLEM (verified 15 September)
studio-home.page.ts:51-64 renders "What's next" as a row of secondary buttons —
Guest QR / Menu / Integrations — plus a primary that resumes the wizard
(`[routerLink]="resumeLink"`, `{{ primaryCta }}`). The file's own comment at
:13-15 says "readiness front door · never dashboards · never % complete", which
is the hub; the template is not.

SITES
apps/web/src/app/pages/studio-home.page.ts:21-64 (template)
apps/web/src/app/pages/studio-home.page.ts:180-210 (todayRows, resumeLink, primaryCta)
apps/web/src/styles/_studio.scss:965-995 (.studio-home__today*)

DO
1. Replace the doors/actions block with `buildHubGroups` + `studio-hub-row`.
2. Keep the hero. Add the status pill — `Not open yet` / `Open` — mirroring the
   `Status: In Progress → Active` device the references use.
3. Keep `studio-home__today` for the live case only (Part C).
4. Delete `resumeLink` and `primaryCta`. There is no resume because there is no
   wizard to resume.
5. The single gold control is `Open Operate` when live, and the first unmet
   gate row's action when not. One fill per screen, per the bar.

DONE WHEN
- /studio renders two groups pre-live and the day-two shape post-live.
- No "Continue setup" anywhere.
- The bar's one-gold-fill check passes on both states.

DO NOT
- Do not add a progress counter or bar. Four references ship one; LVES forbids
  it and with three gate rows it tells you nothing a glance doesn't.
- Do not make the optional group collapsible. Three rows is not a disclosure
  problem.
```

---

## Part C — day two

```
CONTEXT
Once live, the gate has done its job and must recede.

SITES
apps/web/src/app/pages/studio-home.page.ts (live branch)
apps/web/src/app/studio/hub-rows.ts (buildHubGroups, live:true)

DO
1. The three gate rows collapse to ONE satisfied line:
   `✓ Open · Main · 12 tables · Kitchen` with a `Review setup` text link,
   in a #f9f8f6 card with a #eae6e1 hairline. Not a row — a summary strip.
2. Today's Experience keeps its existing two rows (guests, station) and its
   existing `studio-home__today` styles. `Kitchen is calm` stays success-ink.
3. Gold goes to Open Operate.
4. "When you have a minute" holds payments, menu, QR — same row component.

DONE WHEN
- A live venue sees the floor first and setup as one line.
- Nothing on this screen is a chart, a count of money, or a trend.

DO NOT
- Do not put an order list here. That is Operate wearing a dashboard.
- Do not show only the optional cards — the owner then has no reason to have
  opened Studio.
```

---

## Part D — the confirm sheet

```
CONTEXT
Go live has no confirmation. The Moment critic failed on exactly that.

PROBLEM (verified 15 September)
setup-golive-engine.page.ts has no sheet — grep for confirmOpen / dialog /
"Open for guests" returns nothing. confirmGoLive() marks live directly once
canGoLive passes.

SITES
apps/web/src/app/pages/setup-golive-engine.page.ts:278-292 (confirmGoLive)
apps/web/src/app/pages/setup-golive-engine.page.ts:118-126 (primary button)
apps/web/src/app/leos/golive-confirm-sheet.component.ts (new)

DO
1. `Go live` opens the sheet. `confirmGoLive()` moves behind the sheet's
   primary. The gate check stays where it is AND runs again on confirm.
2. Sheet content — three clauses, each from resolveLiveFacts:
   - "Guests can scan **TBL-1 to TBL-12** in Main."
   - "Orders arrive at **Kitchen**."
   - "Guests can pay in person — payments aren't connected. [Connect]"
   The third line reads "Payments are connected." when paymentsActive.
3. Headline in Fraunces, 30px/400 — the ONLY Fraunces on the sheet, and the
   pride sentence the review asked for.
4. Buttons: `Not yet` (outline) then `Open for guests` (gold).
   **Escape left, primary right** — that is the order
   ExperienceScreenComponent renders its slots in (:41-46, escape then
   primary), and setup-golive-engine already follows it in its own footer.
5. `Connect` is a text link, never a button. One gold fill per surface.
6. If any clause cannot be filled, the sheet does not open — the gate refused.
   There is no partial sheet. Assert it.

DONE WHEN
- Going live requires two deliberate acts and the second states consequences.
- The sheet names the station, never the person signed in.
- Esc closes; focus returns to the Go live button.

DO NOT
- Do not celebrate. No confetti, no badge, no bounce — the bar forbids all
  three, and the settle token (360ms) already carries the QR reveal after.
- Do not name Ilse. Who is signed in is live state and is false the moment
  they sign out.
```

---

## Part E — field marking

```
SITES
apps/web/src/app/pages/setup-identity.page.ts (venue name, location, logo, colour)
apps/web/src/app/pages/setup-places.page.ts (area, tables)
apps/web/src/app/pages/studio-menu.page.ts (first-item row)

DO
1. Mark BOTH required and optional on every field, as a muted inline suffix at
   `font-weight:500; text-transform:none; color:#64748b`.
2. Menu first item: name and price are both required — price because a
   zero-only catalogue stays `missing` in resolveLiveFacts and cannot open.
3. Replace the colour hex input with swatches plus "Something else".
4. Add `Import a list` beside the inline Add.

DONE WHEN
- No field in the setup flow is unmarked.
- An owner cannot add a priced-nothing item and wonder why the card stays unmet.

DO NOT
- Do not add a sample-menu shortcut. Sample data is what the catalogue lock
  just removed from the read path.
```

---

## Part F — retire the wizard (sequence after A–C are green)

`setup-engine-host` and the `index`-ordered `SETUP_STEPS` exist only to drive a
linear flow the hub replaces. Retiring them removes `/studio/setup/*` as a URL
space (keep redirects) and deletes the five orphaned page files
(`setup-golive`, `setup-hub`, `setup-organisation`, `studio-choose`,
`studio-configure`) that no route loads today.

Keep the five `why` strings from SETUP_STEPS — *"Guests will know exactly where
they are"* is the best copy in the Studio and belongs on the cards.

Not in this batch unless you want it. It is safe only once the hub is the real
front door.

---

## Sequence

1. **A** — the row and the builder. Everything else is data on top of it.
2. **B** — studio-home becomes the hub.
3. **C** — day two. Same component, `live:true`.
4. **D** — confirm sheet. Independent of A–C; land it whenever, but it is the
   Moment fix and the review is waiting on it.
5. **E** — field marking. Independent, small.
6. **F** — retire the wizard, once A–C hold.

## One open risk

Part E marks price as required in the UI. `resolveLiveFacts` already treats a
zero-only catalogue as missing, so the gate is safe either way — but if the item
editor still accepts a blank or zero price, an owner can add an item, watch the
menu card stay unmet, and have nothing tell them why. Either the editor enforces
it or the card's `value` says "1 item, no price yet". Pick one.
