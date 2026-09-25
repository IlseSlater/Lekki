# Leo Studio — flow and field redesign

Brainstorm, not a build order. Read against the live code on 10 September 2026.

**Decisions taken:** self-serve venue owner · checklist hub, not a wizard ·
go-live gate is venue + one place, a menu with at least one item, and a staff
account with a station — payments explicitly excluded · data model is group →
venue → area → place.

---

## Four things found in the code that change the design

**1. A third of the setup folder is dead.** No route loads
`setup-golive.page.ts`, `setup-hub.page.ts`, `setup-organisation.page.ts`,
`studio-choose.page.ts` or `studio-configure.page.ts`. The old URLs are
redirects. If the Studio has stopped making sense while reading it, this is a
real cause — and it matters for the redesign because `studio-configure` is
where the duplicate "Venue Name / First Place" pair lives. It is a ghost. Do
not port it forward.

**2. `studio-home` is already most of the hub.** It computes `progress.done`
and `progress.total`, resolves a next step, builds a resume link, and renders
readiness rows. Its own header comment says *"never dashboards · never %
complete · rewards readiness"* — the right instinct. What it does with all that
is render *"Next: Where guests join · Continue setup"*, i.e. it presents the
wizard rather than the checklist it already has the data for. This redesign is
mostly promoting `studio-home` and retiring the wizard shell, not building a
new surface.

**3. "Section" already means "area".** `setup-places` collects a
`bulkSectionName` and a `bulkCount`. That is an area and its places. The
hierarchy you chose already exists in the UI under a different word. Pick one
word and use it everywhere — recommend **area**, because "section" is also a
menu term and the two will collide the moment a menu has sections.

**4. `allowPay` is not wired to payments.** `guest-session.service.ts`
`refreshAllowPay()` calls `resolveAllowPay(token, [], sessionDesign)` — the
experience-design toggles. Nothing consults `PaymentConnectorInstall.status`.
So "go live without payments, the Pay button hides itself" is a requirement
with no implementation. See *Prerequisite* at the end.

---

## The tension in the two answers, and how to resolve it

Self-serve owner and a group → venue → area → place hierarchy pull against each
other. An owner with one restaurant should never see the word "group", and
should never be asked which venue they are editing when they have one.

Resolution: **the hierarchy lives in the data from day one and surfaces in the
UI only when it has more than one member.** One venue means no venue picker,
no group screen, and the venue name is simply the title of the hub. Adding a
second venue is what grows a switcher into the header; adding a second area is
what turns "12 tables" into a list. Nothing is asked before it exists.

This is a rule the backend already violates in the other direction:
`resolveTenant` silently picks the organisation's **oldest venue** when none is
supplied, and Studio never supplies one. That is fine while there is one venue
and wrong the moment there are two, so it has to be closed as part of this
work, not after.

---

## The shape

One hub at `/studio`. Every card carries real state and a one-line reason.
Three states only: **not started · needs attention · ready**. No percentages,
no step numbers, no forced order.

The gate is not a step called "Go Live". It is the condition
`venue ∧ menu ∧ team` being ready, at which point the hub's header changes and
QR codes become printable. Go-live stops being a place you navigate to and
becomes a thing that happens.

```
┌─ Rusty Oak ───────────────────── Not open yet ──┐
│                                                  │
│  ● Your venue          Main · 12 tables    ready │
│  ● Your menu           No items yet   needs you  │
│  ● Orders go to        Not set        needs you  │
│  ─────────────────────────────────────────────── │
│  ○ Payments            Not connected    optional │
│  ○ Look & feel         Using defaults   optional │
│  ○ Your till           Not connected    optional │
└──────────────────────────────────────────────────┘
```

Two things earn their place in that sketch. The gate cards sit above a rule
and the optional ones below it, so "what is stopping me" is answered by
position rather than by reading. And the optional cards say what happens
*without* them — "Using defaults", not "Incomplete" — because an owner who
reads "incomplete" six times will not open the doors.

---

## Card by card: what to ask, what to stop asking

### 1 · Your venue  — gate

Today `setup-identity` asks: venue name, logo, colour, menu-brand toggle,
location. Plus `setup-places` separately asks section name and table count.

Merge them. A venue and where guests sit are one thought.

| Field | Change |
|---|---|
| Venue name | Keep. The only required field on the card. |
| Where you are | Keep, relabel from "Location". The existing helper — *"City or suburb guests recognise"* — is good, keep it verbatim. Optional. |
| Logo | Keep, optional. Empty state says what happens instead: *"We'll show your name."* |
| Show logo on the guest menu | Fold into the logo field as a checkbox beneath it. It is a property of the logo, not a separate question. |
| Colour | **Replace the hex input.** `placeholder="#d7a14a"` asks a restaurant owner for a hex code. Offer four or five swatches — pulled from the logo when there is one, from the LVES palette when there isn't — plus "something else" for the one operator in fifty who knows their brand hex. |
| Area name | From `bulkSectionName`. Default **"Main"**, pre-filled, editable. Most venues never touch it. |
| How many tables | From `bulkCount`. Number, with the naming shown live: *"TBL-1 … TBL-12"*. |

Seven fields, one required, five pre-filled or optional. The phone preview that
already exists should sit beside them and update as they type — it is the only
honest answer to "what will guests see".

### 2 · Your menu — gate

Gate rule is **one item**. So adding one item must cost one row, not a trip
into an editor.

Empty state is a single inline row: **name · price · Add**. That is the whole
first-run interaction. The card goes ready and the owner moves on.

The full editor — sections, description, dietary tags, allergens, availability
and 86, age-restricted — is what they graduate into afterwards, and it already
exists. Do not put it in the owner's path on day one. Everything except name
and price is a refinement, and refinements asked too early read as work.

### 3 · Orders go to — gate

Today this is two large screens: `studio-team` and `setup-operate`. Neither is
a first-run question.

The owner setting up alone does not have a team. They are the team. So the
card's question is not "add your staff", it is **"Who's receiving orders?"**

| Field | Change |
|---|---|
| Name | Pre-filled with the signed-in account. |
| PIN | Required. The only thing actually being collected. |
| Where orders arrive | Single select from the pack's stations, defaulted to the first — Kitchen for restaurant. |

Two decisions, one of them pre-answered. Roles, permissions, multiple staff and
multiple stations all move behind "Add someone else", post-gate.

This card is the one that prevents the black hole you named: a ticket with
nobody listening. Its ready state should say what it protects — *"Orders arrive
at Kitchen"* — not *"1 staff member"*.

### 4 · Payments — optional

The card leads with what is true without it:

> Guests can browse and order now. Connect a provider to let them pay from
> their phone; until then, they pay at the till.

Fields come from the connector's declared `credentials[]` — that is what the
contract was built for, and this card is the first thing that consumes it. No
bespoke PayFast page.

Two structural changes from today:

- **Everything happens on this card.** Today step 4 of the wizard collects
  nothing and links out to `/studio/integrations/payfast`, which sits outside
  the flow and whose Back button returns to `/studio/integrations`. The
  operator is teleported out of setup at the one step that must succeed, and
  the step has no way to learn whether it did.
- **The last field is a round-trip, not a Save.** Show the notify URL, have the
  operator complete a sandbox checkout, and wait for the ITN. `/ping` proves
  credentials; only the round-trip proves PayFast can reach the server. This is
  also where `verifiedEnvironment` becomes visible: the card shows
  *"Verified for sandbox"* and going live is an explicit second act, not a
  dropdown.

### 5 · Look & feel — optional

The `setup-experience-step` toggle groups. Today these are **step 2 of 5** —
the owner is asked what guests should experience before a single menu item
exists. Nothing in that screen gates anything. Move it below the line and let
the defaults ride.

One exception: whichever toggle drives pay-at-table has to stop being a free
choice and become dependent on the payments card. See below.

### 6 · Your till — optional

`setup-pilot`. Unchanged in scope, moved below the line.

---

## What to delete

- The wizard shell `setup-engine-host` and the `index`-ordered `SETUP_STEPS`.
  The five `why` strings in that registry are the best copy in the Studio —
  *"Guests will know exactly where they are"* — keep them as card subtitles.
- `setup-payments.page.ts` in its current form: a chooser that collects nothing.
- The five orphaned page files.
- The hex colour input.
- "Menu brand" as a standalone toggle.
- `/studio/setup/*` as a URL space. Cards deep-link to `/studio/venue`,
  `/studio/menu`, `/studio/orders`, `/studio/payments`. Keep redirects.

---

## Prerequisite this flow depends on

Going live without payments only works if the guest app degrades. It does not
today.

`allowPay` must become **design wants pay ∧ payments are active**, and
`paymentsActive` has to reach the guest session — it is currently only readable
through a staff-authenticated endpoint. Practically: put a boolean on the
session payload the guest already receives, derived from
`PaymentConnectorInstall.status === 'active'` for that venue.

The same boolean is what the Payments card renders as its state, so it is one
signal serving both surfaces rather than two that can disagree.

Without it, the first venue that follows your gate opens the doors with a Pay
button that cannot take money — which is a worse first impression than no Pay
button at all.

---

## Open, for the next pass

- **Second venue.** What does adding one look like from the hub — a switcher in
  the header, or a separate venues list? This is also where the backend's
  oldest-venue fallback has to be closed.
- **Areas beyond the first.** One area is a field. Two or more is a list. Where
  does the second one get created — inside the venue card, or a screen of its
  own once it exists?
- **Re-entry.** An owner who leaves at 11pm and returns at 9am — does the hub
  say anything different, or is the card state enough?
- **The word.** Area or section. Pick before anything is built.
