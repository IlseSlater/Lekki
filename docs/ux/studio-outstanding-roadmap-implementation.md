# Studio Outstanding Roadmap Implementation

**Status:** Implemented planning artifact  
**Scope:** Studio only  
**Source roadmap:** `studio-outstanding-roadmap`  
**Authority:** `docs/LEKKI-BUILD.md` · `docs/ux/LEOS-Studio-Design-Blueprint.md` · `docs/ux/current-product-state.md`

This document turns the outstanding Studio roadmap into concrete design outputs without reopening frozen Setup v1.

## Locked Ground

The following remain fixed:

- Setup v1 is complete and must not be redesigned.
- Studio remains a guide, not an admin dashboard.
- Operate may deepen, but must stay calm and overview-first.
- Grow may deepen, but must stay prose-first and one-breath.
- New work should improve confidence before adding breadth.

## 1. Studio -> Live -> Guest Parity Audit

**Status:** Shipped in software — [evidence](evidence/studio-live-guest-parity.md)

### Audit rule

Studio may simulate only when the simulation still answers the same human question as the real guest runtime.

Studio must match runtime truth when the owner is deciding:

- what guests can do
- what guests can see
- what guests will feel when they join, order, pay, wait, and finish

### Current parity sources

- Studio projection: `apps/web/src/app/leos/live-experience-panel.component.ts`
- Studio projection model: `apps/web/src/app/studio/guest-experience-design.ts`
- Guest runtime: `apps/web/src/app/pages/guest.page.ts`

### Parity matrix

#### Strong parity already present

- Join confidence:
  Studio arrival copy and guest runtime both establish place, welcome, and immediate reassurance.
- Payment confidence:
  Studio projection shows payment nouns and available methods; guest runtime uses the same payment surface language.
- Core browse intent:
  Studio projection and runtime both frame browse as calm discovery, not checkout.

#### Highest-confidence mismatches

- Menu realism:
  Studio still relies on projection catalogue data in `guest-experience-design.ts`, while the real guest runtime uses live catalogue payloads from `leos-api.service.ts`.
- Option customisation fidelity:
  Studio can hint at choices, but runtime now has richer required-choice behaviour, configurable item editing, and cart continuity in `guest.page.ts` and `guest-choices-sheet.component.ts`.
- Imagery fidelity:
  Runtime now supports menu/option imagery and guest-side hide/show behaviour; Studio projection does not yet mirror that with the same truth model.
- Order-state confidence:
  Runtime now has more specific reassurance around order placed, staff visibility, ready states, and done states; Studio still presents a lighter simulation path.
- Cart and edit continuity:
  Runtime includes quantity badges, cart-line editing, and item-level continuity that the Studio projection does not yet fully preview.

### First parity fixes to design next

1. Replace projection-only item assumptions with a parity layer that can mirror:
   - categories
   - optional imagery
   - required/optional option groups
   - cart continuity signals
2. Align Studio order-state copy with runtime copy rules:
   - placed successfully
   - staff can see it
   - they are on it
   - all done only when complete
3. Define a strict parity checklist for all Setup steps that affect guest trust:
   - Identity
   - Experience
   - Places
   - Payments
   - Go Live

### Projection rule

Studio may stay lighter than runtime in rendering detail, but not in meaning.

Allowed:

- simpler sample data
- lighter card counts
- curated examples

Not allowed:

- different choice behaviour
- different order-state reassurance
- different payment meaning
- different presence/absence of imagery once imagery is part of the guest truth

## 2. Team Surface Maturity Map

**Status:** Shipped in software — [evidence](evidence/studio-team-confidence.md)

### Core files

- Team page: `apps/web/src/app/pages/studio-team.page.ts`
- Team APIs: `apps/web/src/app/services/leos-api.service.ts`

### Already solid

- Staff creation and editing
- Experience-first role assignment
- Manual permission refinement
- Device naming
- Session listing and revocation

### Needs design clarification next

- Permissions confidence:
  the current surface allows refinement, but still asks owners to interpret permission combinations more than ideal.
- Device trust:
  owners can see named devices, but the UI does not yet strongly answer whether a device is safe, idle, shared, or recently used.
- Session confidence:
  sessions can be ended, but the product can better communicate what ending a session will do for staff in the moment.
- Team mental model:
  the page has People, Devices, and Sessions, but there is room to make the relationship between them clearer.

### Hold for later

- invitation orchestration
- full onboarding workflows
- audit history as a separate admin product
- complex org/group hierarchies

### Next Team design scope

The next Team pass should answer three questions better:

1. Who can do what?
2. Which device is active where?
3. Is it safe to revoke or reset this right now?

### Recommended interaction direction

- Keep Experience assignment first.
- Reframe raw permissions as confidence-led grouped actions.
- Make device state more human:
  `Idle`, `In use`, `Last seen`, `Assigned here`.
- Make session actions more explicit:
  `End now`, `Ends access on shared device`, `Safe to reassign`.

## 3. Operate Depth Without Breaking Calm

**Status:** Shipped in software — [evidence](evidence/operate-craft-glance.md)

### Core files

- Studio Operate: `apps/web/src/app/pages/setup-operate.page.ts`
- Craft guardrails: `docs/ux/operate-craft.md`

### What Operate already does correctly

- Calm mission-control greeting
- Escalation-first display
- Floor pulse / row-based glance
- Staff Experience handoff instead of pretending Studio is the floor tablet

### Allowable deepening moves

- Clearer escalation priority ordering:
  make the top owner action more obvious when multiple rows need attention.
- Better cross-station glance:
  show clearer plain-language station summaries without adding dense dashboards.
- Better readiness truth:
  strengthen the difference between calm, preparing, ready, and needs-you across the floor rows.
- Better handoff confidence:
  reinforce when Studio is overview-only and when the next action continues in Staff Experience.
- Better multi-place pulse:
  express where pressure is rising without turning rows into analytics.

### Forbidden moves

- dashboard cards in cards
- charts, widgets, and report blocks
- a second operating system inside Studio
- turning Studio Operate into the same tool as Kitchen / Bar / Waiter

### Operate design rule

Every Operate row must still resolve to one glance, one tap, one decision.

If a deepening move adds scanning without improving action confidence, reject it.

## 4. Grow Content Model

### Core files

- Grow page: `apps/web/src/app/pages/studio-grow.page.ts`
- Craft guardrails: `docs/ux/grow-craft.md`

### Existing shape

Grow already follows the right emotional structure:

- greeting
- short story
- one trading breath
- one wait signal
- one delight statement
- one suggestion

### What can deepen next

- Sharper daily story ordering:
  decide more clearly which one fact matters most today.
- Better favourite memory:
  improve how the popular item line feels contextual rather than generic.
- Better explanation of change:
  when wait or delight worsens, explain it in one human sentence.
- Better suggestion quality:
  keep one suggestion, but make it feel more situational and less template-like.
- Better pack nouns:
  preserve continuity across restaurant, cafe, hotel, airport, festival, and healthcare.

### Allowed Grow signals

- guests welcomed
- one trading figure in prose
- average wait
- payment health
- popular item or service
- one suggestion

### Signals to keep out

- chart galleries
- filter bars
- export flows
- multi-card metric dashboards
- long recommendation feeds

### Recommended content pattern

Grow should keep this order:

1. Greeting
2. One sentence of welcome/trading truth
3. Optional supporting memory
4. One emotional read
5. One suggestion

### Grow design test

If a busy owner cannot understand the page in one breath, the content is too heavy.

## 5. Legacy Setup/Auth Cleanup Matrix

### Core files

- `apps/web/src/app/pages/studio-choose.page.ts`
- `apps/web/src/app/pages/studio-configure.page.ts`
- `apps/web/src/app/pages/setup-golive.page.ts`
- `apps/web/src/app/pages/setup-organisation.page.ts`
- `apps/web/src/app/pages/studio-signin.page.ts`
- `apps/web/src/app/services/studio-auth.service.ts`
- `apps/web/src/app/services/studio-context.service.ts`
- Route truth: `apps/web/src/app/app.routes.ts`

### Matrix

#### Redirect / retire

- `studio-choose.page.ts`
  - Current role: legacy localStorage pack picker
  - Decision: retire as a standalone flow
  - Reason: route already redirects to `studio/create`

- `studio-configure.page.ts`
  - Current role: legacy localStorage venue/place configurator
  - Decision: retire as a standalone flow
  - Reason: route already redirects to `studio/setup/identity`

- `setup-golive.page.ts`
  - Current role: old go-live surface
  - Decision: deprecate in favour of `setup-golive-engine.page.ts`
  - Reason: the Setup Engine path is the frozen truth

#### Keep temporarily for compatibility

- `studio-context.service.ts`
  - Current role: workspace truth plus legacy migration bridge
  - Decision: keep during migration
  - Reason: it currently preserves continuity between old localStorage keys and the workspace model

#### Replace / connect to backend later

- `studio-signin.page.ts`
  - Current role: polished sign-in UI proof
  - Decision: keep the surface direction, replace mocked auth behaviour later
  - Reason: the UX can stay; the auth substrate should become real

- `studio-auth.service.ts`
  - Current role: localStorage-backed auth proof
  - Decision: replace with real auth/session integration later
  - Reason: it is explicitly a proof, not production auth

#### Explicitly demo-only

- `setup-organisation.page.ts`
  - Current role: demo organisation/venue truth
  - Decision: keep only if needed for demos; otherwise fold its value into real Studio APIs
  - Reason: it is hardcoded and says so in its own file header

### Cleanup sequence

1. Keep redirects in place.
2. Remove dependence on legacy standalone pages from any remaining navigation.
3. Preserve `studio-context.service.ts` migration logic until no active flows require old keys.
4. Replace fake auth only when the real Studio account/session model is ready.

## Recommended Build Sequence

1. ~~Build the Studio -> Live -> Guest parity pass first.~~ **Done.**
2. ~~Deepen Team next, because it is functional but still under-designed.~~ **Done.**
3. ~~Do the Operate craft pass after Team.~~ **Done.**
4. Tighten Grow content quality after Operate.
5. Finish with legacy Setup/auth cleanup once the primary confidence surfaces are stronger.

## Decision Filter

Use this filter for every Studio change:

1. Does it increase confidence?
2. Does it preserve calm?
3. Does it avoid admin sprawl?
4. Does it keep Setup frozen?
5. Does it bring Studio closer to runtime truth?

If the answer to any of the first four is no, do not ship the change.
