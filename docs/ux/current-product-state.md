# SECTION 3 — Current Product State — Hospitality Phase

**Status:** Authoritative for current implementation state  
**Phase:** Hospitality Phase  
**Board:** [LEKKI-BUILD.md](../LEKKI-BUILD.md) · [hospitality-phase.md](hospitality-phase.md)  
**Not to confuse with:** Blueprint [SECTION 3 — Welcome & Choose Experience](LEOS-Studio-Design-Blueprint.md#section-3--welcome--choose-experience)

```text
Guest HCI:     9/9 complete
Studio HCI:    7/7 complete
Pack paths:    6 proven
Setup Engine:  FROZEN v1
Next Proof:    Continuity polish if named
```

This section prevents future design work from accidentally reopening already-proven journeys or expanding the product into areas that are intentionally held.

---

## 3.1 Current Product Principle

LEOS is currently in the Hospitality Phase.

The product is not missing a guest journey.

The complete Arrival → Return heartbeat exists.

The remaining work is:

- continuity refinement
- craft
- operational calm
- pack terminology
- explicitly unlocked proof work

The current product should therefore be treated as:

```text
PROVEN EXPERIENCE
+ PROVEN STUDIO
+ CONTINUITY REFINEMENT
+ CRAFT
```

Not:

```text
NEW PLATFORM ARCHITECTURE
+ NEW ADMIN SYSTEM
+ NEW SETUP SYSTEM
```

---

## 3.2 Current HCI State

### Guest

9/9 moments are complete.

```text
Arrival → Join → Browse → Order → Pay → Wait → Receive → Leave → Return
```

Each moment exists in software.

The design goal now is continuity between moments.

---

## 3.3 Guest Arrival

**Human question:** “Am I in the right place?”

### Current experience

The guest enters through QR.

The experience establishes:

- venue
- environment
- place
- welcome

The interface should immediately establish confidence.

### Desired feeling

“I’m exactly where I should be.”

### Visual direction

Warm. Branded. Minimal.

No Studio language. No operational language. No business configuration.

The guest should never know how LEOS generated the experience.

---

## 3.4 Guest Join

**Human question:** “How do I enter?”

The guest should not be asked to understand:

- session IDs
- venue IDs
- product IDs
- runtime terminology

The experience establishes the person’s context automatically.

Current language includes: “You’re in.” · “See menu.”

### Desired feeling

“LEOS has already figured this out.”

---

## 3.5 Guest Browse

**Human question:** “What can I choose?”

Current experience includes:

- sections
- search
- add
- quantity
- cart continuity

Browse should remain calm. The user should be able to explore without committing.

### Important

Browse is not checkout.

Do not introduce unnecessary decision-making during discovery.

---

## 3.6 Guest Order

**Human question:** “Did they receive my request?”

Current experience communicates:

- received
- order status
- timeline

The central confidence statement is: “We’ve got your order.”

The user should never wonder whether pressing the button actually worked.

---

## 3.7 Guest Payment

**Human question:** “What am I paying?”

Current Continuity model supports:

- **Mine**
- **Visit**
- **Equal**

The payment experience should explain the financial state rather than expose payment machinery.

---

## 3.8 Mine

Mine represents the amount attributed to the current guest.

The guest sees:

- their remaining amount
- their attributed lines
- the action required

The interface should make ownership obvious.

---

## 3.9 Visit

Visit represents the broader shared visit.

The guest should understand:

- what has already been paid
- what remains
- what they can cover

The UI should avoid double counting.

---

## 3.10 Equal

Equal provides a calm alternative for shared payment.

The remaining amount is divided across unpaid **people**, not QR re-entries.

One guest at the table pays the visit. Equal stays hidden.

The experience should feel simple: “Let’s split this evenly.”

Not: “Configure allocation.”

---

## 3.11 Claim-from-table

**Status: Shipped** — [evidence](evidence/continuity-claim-from-table.md)

```text
small picker → choose what is yours → continue → Mine pay
```

**Principle:** Minimum Decisions.

Start with: “What would you like to claim?” — **inline on the bill**: tap **Claim** on Visit, then pay Mine.

Not an allocation wizard. Not a separate picker screen.

---

## 3.12 Wait

**Human question:** “Is it happening?”

Current experience uses: pulse · status · timeline.

The guest should receive reassurance without needing to refresh.

Emotional message: “They’re making it now.”

---

## 3.13 Receive

**Human question:** “Is it ready?”

Current experience provides a ready state.

Primary emotional statement: “It’s ready for you.”

The state should feel decisive. Do not make the guest interpret operational status.

---

## 3.14 Leave

**Human question:** “Am I finished?”

Current experience includes: receipt · leave action · completed entry state.

Emotional message: “You’re all set.”

The experience ends cleanly. Do not force another journey.

---

## 3.15 Return

Return is part of the product. It is not simply reopening Entry.

Current behaviour includes: short return splash · Welcome back.

**Principle:** Never Ask a Human to Remember.

Return should therefore feel familiar rather than like a first visit.

---

## 3.16 Studio HCI

Studio currently has 7/7 HCI moments complete.

```text
Welcome / Create → Choose Experience → Identity → Experience → Places → Payments → Go Live
Then: Home → Operate → Grow → Team
```

Setup Engine v1 is frozen.

Do not reopen the Setup architecture for visual redesign.

Future improvements must preserve the established anatomy.

---

## 3.17 Studio Welcome

**Human question:** “Can I get this experience live?”

**Principle:** Readiness over completion.

The owner should not be confronted with:

- progress percentages
- feature counts
- administrative dashboards
- configuration statistics

Instead: Good morning. Blue Door. Everything is ready.

---

## 3.18 Studio Create

Create establishes the business’s intention.

The owner should feel: “I’m creating something real.”

Not: “I’m configuring a software product.”

The language should remain human.

---

## 3.19 Choose Experience

**Human question:** “What kind of experience am I creating?”

Pack selection provides the starting context.

Proven paths: Restaurant · Café · Hotel · Festival · Airport · Healthcare.

Pack differences should primarily affect:

- terminology
- defaults
- available experience behaviour
- place nouns
- operational nouns

The underlying LEOS identity remains consistent.

---

## 3.20 Identity

**Human question:** “Who are you?”

The owner establishes the identity guests will encounter.

Changes should immediately affect Live Experience.

Examples: Venue name · Logo · Brand identity.

The owner should not need to save and then inspect the guest experience.

---

## 3.21 Experience

**Human question:** “What can guests experience?”

The owner defines what guests can choose. The Live Experience responds immediately.

This is not a visual builder. The owner chooses capabilities. LEOS composes the resulting experience.

No drag-and-drop canvas. No per-venue frontend design system. No custom CSS editor.

---

## 3.22 Places

**Human question:** “Where will guests join?”

Current Place model supports experience-specific nouns.

| Experience | Examples |
|------------|----------|
| Restaurant | Main Dining · Patio · Bar · Tables |
| Café | Counter · Table · Pickup |
| Hotel | Room · Suite |

The important question is not “How do I configure physical resources?”

It is: “Where will my guest join?”

---

## 3.23 Places Live Context

Selecting a place updates the Live Experience.

Example: You’re joining · Patio · Table 12.

This is the critical confidence loop:

```text
Change → See → Trust → Continue
```

---

## 3.24 Payments

**Human question:** “How will guests pay?”

The current Studio design intentionally avoids connector-heavy configuration language.

The owner should see the guest payment experience.

Examples: Card · Apple Pay · Google Pay · Tip · Split.

The Live Experience should reflect payment choices.

Payment infrastructure remains underneath the experience.

---

## 3.25 Go Live

**Human question:** “Are we ready?”

Go Live is the emotional peak. It should not feel like another settings page.

Central moment: “Your experience is live.” Guests can now scan this QR.

The owner should feel: Pride · Relief · Confidence · Completion.

---

## 3.26 Go Live QR

The QR is proof.

The owner should understand: “This is the thing I can put in the real world.”

Available actions: Download QR · Open Experience.

The QR should not feel like a technical artifact. It is the doorway into the experience.

---

## 3.27 Studio Home

Studio Home is the readiness front door.

```text
Good morning.
Blue Door
Everything is ready.
—
Today’s Experience —
Open Experience · Operate · Grow
```

No charts. No completion percentage. No widget wall. No feature inventory.

---

## 3.28 Operate

**Status: Shipped (craft glance)** — next-action hint · Needs you / Preparing / Ready · station prose · Staff handoff. [evidence](evidence/operate-craft-glance.md)

Operate is mission control.

It should answer: “What needs my attention?”

Not: “How much information can I display?”

The operator is often under pressure. Therefore: One glance · One tap · Clear place nouns · Clear status · Clear escalation.

Studio Operate stays overview. Floor work stays in Staff Experience.

---

## 3.29 Operate Visual Character

Operate may be denser than Setup.

This does **NOT** mean dashboard.

It means: faster · clearer · more operational · Touch-first · Status-first.

The interface should work when someone is busy serving guests.

---

## 3.30 Grow

Grow is deliberately calm.

It should answer: “How are things going?”

Grow should use: large numbers · sparse information · human interpretation · no BI grids · no widget walls.

**Current rule:** ≤ 1 suggestion.

Grow should create optimism rather than anxiety.

---

## 3.31 Team

**Status: Shipped (confidence pass)** — who can do what · device Idle/In use · End now names the shared device. [evidence](evidence/studio-team-confidence.md)

Team answers: “Who is helping operate this experience?”

Current concepts: assigning people · devices · sessions.

Team should remain human. Avoid enterprise HR terminology unless required by actual functionality.

Do not add invitations, audit history, or Neo to this surface.

---

## 3.32 Staff World

Staff is separate from the guest experience.

Staff enters through PIN → Service Board or Station Queue.

Staff should not be exposed to Owner configuration.

Staff needs: speed · clarity · status · place · action.

---

## 3.33 Service Board

The Service Board is operational.

It should prioritise: What needs attention now?

Each item should make clear: Where? · What? · How urgent? · What action?

---

## 3.34 Station Queue

Station views should be focused.

Examples: Kitchen · Bar · Barista · Housekeeping · Concierge.

The station should not become a generic admin page.

---

## 3.35 Pack Continuity

Pack coverage currently exists across: Restaurant · Café · Hotel · Festival · Airport · Healthcare.

The purpose of Pack variation is not to create six separate products.

It is to make LEOS feel native to each environment.

---

## 3.36 Pack Language

| Pack | Language examples |
|------|-------------------|
| Restaurant | Tables · Kitchen · Bar · Dishes |
| Café | Counter · Pickup · Barista · Coffee |
| Hotel | Room · Suite · Housekeeping · Concierge |
| Festival | Zone · Bar · Vendor · Stage |
| Airport | Gate · Counter · Terminal |
| Healthcare | Waiting area · Amenities · Service |

Pack language should appear where it helps humans understand their environment.

---

## 3.37 What Must Remain Invisible

The following machinery should not leak into normal human-facing UI:

Runtime · Schema · Capability · Connector · Platform · Tenant · Session implementation · API · Neo · Marketplace · Infrastructure

The machinery can exist. The guest and operator do not need to understand it.

---

## 3.38 Current Continuity Work

The next work should strengthen continuity rather than redesign the product.

**Shipped (craft batch):** terminology · manager help · payment visit craft · Live shell fidelity · Home live counts — [evidence](evidence/continuity-craft-gaps.md)

Continuity-safe areas still open:

- Named Continuity polish only (Tip · Ready→Pay · Leave while open · Mid-visit resume shipped)

---

## 3.39 Claim-from-table Rule

**Shipped.** Do not create an allocation wizard.

Starts with: “What would you like to claim?”

Then the smallest possible selection experience → existing Mine pay.

---

## 3.40 G-04 Choices

**Status: Shipped** — browse confidence deepen · [Interaction Craft](experience-interaction-craft.md) · [craft pointer](g04-choices-sheet.md) · [evidence](evidence/g04-choices-sheet.md)

The choices sheet is a browse-confidence improvement.

It appears when an item genuinely requires choices.

Configured Browse cards answer first: **Choose options** — then the sheet opens on +.

Required: Choose 1 · Optional: Choose up to N — Required is visually stronger than Optional.

The guest should understand why the sheet appeared.

Do not turn every menu item into a configuration workflow.

---

## 3.41 Payment Methods

**Visit craft + vault boundary: Shipped** — Card label · visit session memory · vault-backed connector secrets · [visit craft evidence](evidence/continuity-craft-gaps.md) · [vault evidence](evidence/payment-capability-vault.md)

Current payment-method UI remains calm while connector credentials route through the vault boundary.

Implementation uses **PaymentCapability** rather than inventing a separate payment architecture.

Emotional experience remains: simple · recognisable · trustworthy.

---

## 3.41b Tip Continuity

**Status: Shipped** — Guest Bill honours Setup Tips (`tipStaff`); Live already did. [evidence](evidence/continuity-tip-parity.md)

Tips off → no tip chips / tip line. Tips on → same calm tip moment. Pack defaults hide tips for festival / airport / healthcare demo tokens.

Do not invent a tip product surface. Do not reopen Setup.

---

## 3.41c Ready → Pay crispness

**Status: Shipped** — Ready + balance due → gold **Pay now** · lead bridges settle · never “Pay & finish”. [evidence](evidence/continuity-ready-pay.md) · [interaction](wireframes/guest/continuity-ready-pay.md)

Finish → receipt when balance is cleared stays unchanged. Leave stays in dock — not the primary.

---

## 3.41d Leave while visit open

**Status: Shipped** — Leave confirm affirms you’re free to leave when others still owe · quiet Visit still open amount · no allocation wizard. [evidence](evidence/continuity-leave-open.md)

Primary stays **I’m finished**. Stay still returns. Do not add Cover-from-Leave.

---

## 3.41e Mid-visit resume

**Status: Shipped** — Re-open open visit → **You’re still in** (not Welcome back, not Join). [evidence](evidence/continuity-mid-visit-resume.md) · [interaction](wireframes/guest/continuity-mid-visit-resume.md)

After Leave → Welcome back unchanged. First join → You’re in unchanged. No CRM resume-cart.

---

## 3.42 Terminology Debt

**Status: Shipped (guest / staff / Live / Operate pulse)** — Orders · Leave · Manager/Lead pack-aware where environmental. Help stays universal. [evidence](evidence/continuity-craft-gaps.md)

The goal is not arbitrary localisation. The goal is environmental confidence.

---

## 3.43 Live Experience Fidelity

**Status: Shipped (meaning parity)** — shared `catalogue-parity` layer: G-04 choice groups · guest-safe imagery · cart qty · order-state copy from `progressGuidance`. Still a lighter projection — not embedding guest runtime. [evidence](evidence/studio-live-guest-parity.md)

**Principle:** Live Experience should be the same Experience Shell guests receive.

Future work may reduce remaining rendering detail. Do not introduce another preview product. Do not add Neo to Live.

---

## 3.44 Home Live Counts

**Status: Shipped (calm floor pulse)** — open places · help/prep/ready lines from Operate floor. [evidence](evidence/continuity-craft-gaps.md)

Do not solve live counts by introducing: dashboards · charts · widget walls · dense analytics.

---

## 3.45 Explicitly Frozen

Do not reopen merely for visual experimentation:

- Setup Engine v1
- Experience Shell
- Studio Shell
- Live Experience principle
- Motion system
- Setup layout
- Core HCI journey

---

## 3.46 Explicitly Never

Do not introduce:

- Marketplace UI
- Neo chatbot into Setup
- Admin BI
- Dark glass dashboards
- Loyalty administration
- Wallet administration
- Fleet CRUD
- Inventory CRUD before the relevant Continuity work
- CRM resume-cart concepts
- Dashboard widget walls

---

## 3.47 Current Product Quality Bar

A new change should make LEOS:

Calmer · Clearer · More confident · More continuous · More native to the environment.

It should not simply make LEOS:

More powerful · More configurable · More analytical · More feature-rich.

---

## 3.48 Decision Rule

Before building anything new, ask:

1. Is this solving a missing human moment?
2. If no — is this removing uncertainty from an existing moment?
3. If no — is this reducing operational friction?
4. If no — is this proven necessary for the current Hospitality Phase?
5. If no — **Do not build it yet.**

---

## 3.49 Current North Star

LEOS quietly removes uncertainty.

**For guests:** I know where I am · what I can do · they received it · when it is ready · I’m finished.

**For owners:** I know what I’m creating · what guests will see · where they will join · how they will pay · I’m ready · I’m live.

**For staff:** I know what needs attention · where it belongs · what to do.

---

## 3.50 Final Current-State Rule

LEOS is not currently waiting for another architecture.

It is waiting for continuity, craft, and proof.

The board is calm.

The next proof is intentionally held.

Do not create work merely because a new screen can be designed.

The product is strongest when it quietly removes another piece of uncertainty.
