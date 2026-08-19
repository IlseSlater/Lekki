# Studio screen summaries — user-story seeds

**Status:** Working extract (not a philosophy LEK)  
**Purpose:** One card per Studio screen so Acceptance Specs can be written without re-reading the conversation export.  
**Sources:** `lekki-Conversation.txt` (~L3414–3840 + SECTION 2) · [LEOS-Studio-Design-Blueprint.md](LEOS-Studio-Design-Blueprint.md) · [operate-craft.md](operate-craft.md) · [grow-craft.md](grow-craft.md) · [live-experience.md](live-experience.md) · [hospitality-phase.md](hospitality-phase.md)  
**Stories:** [stories/S-00-welcome.md](stories/S-00-welcome.md) …  
**Policy:** Setup v1 frozen — summarise & story; do not redesign.

---

## Global constraints (every screen)

Applies to all Studio stories unless a screen explicitly exempts (e.g. Welcome pre-engine).

| Rule | Requirement |
|------|-------------|
| Three-second test | Owner knows where they are · what they’re doing · what happens next |
| One question | Left side = decisions only — never docs / help centre / feature catalogue / dashboard |
| One gold | Primary Continue (or Go Live / Open Experience) — secondary actions are text, never gold |
| Live Experience | Real Experience Shell, not preview — instant update, no Refresh / Save / Apply |
| Autosave | Meaningful edits save quietly (“Saved automatically”) — never interrupt |
| Progress | Emotional story (Who → What → Where → How pay → Go Live) — never Step X of Y / % |
| Language | Hospitality — never Pack · connector · deploy · publish profile · admin |
| Motion | 160–360ms ease-out — understanding, not decoration; no bounce |
| A11y | AA contrast · ≥44px targets · understandable without colour · reduced motion |
| Success test | “I knew what to do · saw what guests see · never lost · never feared mistakes” |

**Pillars:** Confidence · Calm · Hospitality · Continuity.

---

## Screen index

| ID | Screen | Route | Conv | Emotion |
|----|--------|-------|------|---------|
| S-00 | Welcome | `/studio/welcome` | S0 | Safe |
| S-01 | Choose Experience | `/studio/create` | S1 | Recognition |
| S-02 | Who you are | `/studio/setup/identity` | S2 | Ownership |
| S-03 | What guests experience | `/studio/setup/experience` | S3 | Control |
| S-04 | Where guests join | `/studio/setup/places` | S4 | Certainty |
| S-05 | How guests pay | `/studio/setup/payments` | S5 | Trust |
| S-06 | Go Live | `/studio/setup/golive` | S6 | Pride |
| S-07 | Studio Home | `/studio` | Home | Readiness |
| S-08 | Operate | `/studio/operate` | S7 | Calm |
| S-09 | Grow | `/studio/grow` | Grow | Optimism |
| S-10 | Live Experience | Setup chrome (not nav) | Phone | Trust |

---

## S-00 — Welcome

| | |
|--|--|
| **Route** | `/studio/welcome` |
| **Journey** | Provider — Create |
| **Human question** | Ready to create your experience? *(headline: Let’s get your experience ready.)* |
| **Emotional goal** | Safe · welcomed · unhurried |
| **Uncertainty removed** | Will this be difficult? Am I in the right place to start? |

**Layout gist:** Single Studio column — h1 · lead · human progress story list · reassurance (“Most teams finish in under ten minutes”) · footer Home (text) + Continue (gold). Live Experience optional/calm — pre-engine.

**Live Experience:** Not required. Never a feature grid on the right.

**Confidence / readiness:** Journey visible as story, not wizard %.

**Primary / secondary:** Continue → `/studio/create` · Home → `/studio`

**Empty / success / error:** N/A forms. Success = one tap forward.

**Never-do:** Forms · Marketplace · Pack · “Create organisation” · multiple competing CTAs · % complete.

**Story seeds**

1. As a first-time owner, I see one clear invitation so I begin in one tap.  
2. As a returning owner, I can go Home without losing my place.  
3. As anyone, I understand the journey ahead in human language — not modules.

**Source:** Conversation S0 · Blueprint §3.A · `studio-welcome.page.ts`

---

## S-01 — Choose Experience

| | |
|--|--|
| **Route** | `/studio/create` |
| **Journey** | Provider — Create |
| **Human question** | What experience are you creating? |
| **Lead** | Pick the one that matches how guests will join. |
| **Emotional goal** | Recognition — “I know what I’m creating.” |
| **Uncertainty removed** | Is this for restaurants only? Will I pick the wrong thing? |

**Layout gist:** List of types (Restaurant · Café · Hotel · Festival · Airport · Healthcare) — label + one-sentence blurb · hairline separators (not heavy cards) · confidence “You’ll create · {Type}” · Back + Continue.

**Live Experience:** Shell defaults for selected type update immediately (venue placeholder · categories grammar).

**Confidence:** Waiting until select · ✓ Looks good when selected.

**Primary / secondary:** Continue (disabled until select) → start experience → Identity · Back → Welcome.

**Never-do:** “Choose Pack” · capability matrix · multi-select · compare plans · requiring name/logo first.

**Story seeds**

1. As an owner, I recognise my venue type in a short list.  
2. As I select, confidence and Live Experience defaults update instantly.  
3. As I continue, workspace seeds that type’s defaults without Pack language.

**Source:** Conversation S1 · Blueprint §3.B · `studio-create.page.ts` · `experience-registry.ts`

---

## S-02 — Who you are (Identity)

| | |
|--|--|
| **Route** | `/studio/setup/identity` |
| **Journey** | Provider — Configure |
| **UI label** | Who you are *(never “Business Information”)* |
| **Human question** | Who are you welcoming guests into? / Who are you? |
| **Why-sentence** | Guests will recognise your business. |
| **Emotional goal** | Ownership |
| **Uncertainty removed** | Will guests recognise us? Can I change this later? |

**Layout gist:** Full Setup chrome — Studio 640 + Live 420 · name field (required) · type context · autosave flash · confidence block · Back + Continue.

**Live Experience:** Typing venue name → phone pulse/fade → venue morphs (e.g. Blue Door).

**Confidence:** ✓ Guests will recognise your venue / Looks good when named.

**Primary / secondary:** Continue → Experience step · autosave (no Save button).

**Never-do:** Organisation Details · Save/Apply/Publish · Pack/profile nouns · hard-cut phone replace.

**Story seeds**

1. As an owner, I type my venue name and see it on the guest phone instantly.  
2. As I type, changes save automatically without interrupting me.  
3. As I continue, I feel the place is named and recognisable.

**Source:** Conversation S2 · Blueprint §8.3 · Motion Identity sequence · `setup-identity.page.ts`

---

## S-03 — What guests experience

| | |
|--|--|
| **Route** | `/studio/setup/experience` |
| **Journey** | Provider — Configure |
| **UI label** | What guests experience |
| **Human question** | What can guests do? |
| **Why-sentence** | Guests will choose what you’d like to offer. |
| **Emotional goal** | Control |
| **Uncertainty removed** | Do I understand what guests will see and do? |

**Layout gist:** Grouped toggles in human language (browse · order · request · pay · tip · split…) · confidence · Back + Continue.

**Live Experience:** Toggles update shell categories/actions immediately (e.g. turn off Drinks → Drinks disappear).

**Confidence:** Guests can · {summary} · ✓ Looks good when a path exists.

**Never-do:** Long forms · “Experience Capabilities” · capability IDs · empty forced complexity.

**Story seeds**

1. As an owner, I turn guest options on/off and see the phone reflect them.  
2. As an owner, I can explain the guest journey in one sentence before continuing.  
3. As an owner, I never see Pack or runtime feature jargon.

**Source:** Conversation S3 · Blueprint §8.4 · `setup-experience-step.page.ts`

---

## S-04 — Where guests join (Places)

| | |
|--|--|
| **Route** | `/studio/setup/places` |
| **Journey** | Provider — Configure |
| **UI label** | Where guests join |
| **Human question** | Where will guests join? |
| **Why-sentence** | Guests will know exactly where they are. |
| **Emotional goal** | Certainty |
| **Uncertainty removed** | Will guests know which table/room they’re at? |

**Layout gist:** Sections (e.g. Main Dining · Patio · Bar) · places (Table 1…) · bulk create 1–20 · focus place · confidence · Continue.

**Live Experience (arrival mode):** You’re joining · section · place (e.g. Patio · Table 12).

**Confidence:** ✓ {n} places ready — **not** “n entities created.”

**Never-do:** Location Mapping · Venue Resources · GIS/node jargon · repetitive manual table entry without bulk.

**Story seeds**

1. As an owner, I define sections and places that match how guests arrive.  
2. As I focus a place, arrival on the phone updates immediately.  
3. As a restaurant owner, I bulk-create tables 1–20 without repetitive work.

**Source:** Conversation S4 · Blueprint §8.5 · `setup-places.page.ts`

---

## S-05 — How guests pay (Payments)

| | |
|--|--|
| **Route** | `/studio/setup/payments` |
| **Journey** | Provider — Configure |
| **UI label** | How guests pay |
| **Human question** | How will guests pay? |
| **Why-sentence** | Guests can pay with confidence. |
| **Emotional goal** | Trust |
| **Uncertainty removed** | Can guests pay easily? Will checkout look right? |

**Layout gist:** Calm option list — Card · Apple Pay · Google Pay · tip/split as design allows · confidence · Continue.

**Live Experience (pay mode):** Bill · amount · methods list update instantly.

**Confidence:** ✓ Guests can pay confidently (≥1 method).

**Never-do:** Gateway / OAuth / API / Connector wizard on this screen · “Payment Gateway Configuration” · 11-step admin density.

**Story seeds**

1. As an owner, I choose guest pay options and see them on the phone bill.  
2. As an owner, I continue with at least one method and feel guests can pay.  
3. As an owner, I never configure connector credentials on this calm step.

**Source:** Conversation S5 · Blueprint §8.6 · `setup-payments.page.ts`

---

## S-06 — Go Live

| | |
|--|--|
| **Route** | `/studio/setup/golive` |
| **Journey** | Provider — Activate |
| **Human question** | Are you ready to welcome guests? / Are we ready? |
| **Why-sentence** | You’re ready to welcome your first guest. |
| **Emotional goal** | Pride — “I did it.” *(not “Setup complete.”)* |
| **Uncertainty removed** | Will this actually work? Are we public yet? |

**Layout gist:** Promise (same experience, now public) · QR reveal · venue/place · Download QR · Open guest link · Copy · confidence · Continue → Operate.

**Live Experience:** Same shell — now public via QR/entry. Nothing about the experience changes except reach.

**Confidence:** Ready to welcome your first guest · guests can join / browse / pay / QR ready.

**Primary / secondary:** Continue / open Operate · Download QR · Open link · Copy (text/secondary, not competing gold fanfare).

**Motion:** QR scale 0.96→1 (360ms) · stagger secondary +40ms — quiet celebration, no confetti.

**Never-do:** Deployment · Publish · Activate Workspace · “100% complete” · badge farming.

**Story seeds**

1. As an owner, I go live and receive a QR guests can scan now.  
2. As an owner, I feel pride (“I did it”), not checklist completion.  
3. As an owner, I can download QR, open the guest link, or continue to Operate.

**Source:** Conversation S6 · Blueprint §8.7 · `setup-golive-engine.page.ts`

---

## S-07 — Studio Home

| | |
|--|--|
| **Route** | `/studio` |
| **Journey** | Provider — Operate readiness |
| **Human question** | Am I ready? |
| **Emotional goal** | Confidence / readiness |
| **Uncertainty removed** | What should I do next? Is everything OK? |

**Layout gist:** Greeting · venue (Fraunces) · readiness line · Today’s Experience rows · Open Experience (gold when live) · Operate · Grow text doors.

**States**

| State | Readiness | Primary |
|-------|-----------|---------|
| Empty | Let’s create your first experience. | Create |
| Setup in progress | Almost ready to welcome guests. | Continue setup |
| Live | Everything is ready. | Open Experience |

**Live Experience:** Not the Home layout focus — Open Experience leads to live QR / shell.

**Never-do:** Charts · KPIs · % complete · widgets · Marketplace tiles · “How many features exist?”

**Story seeds**

1. As a live owner, I see “Everything is ready” and clear next doors.  
2. As an owner mid-setup, I resume without step counters or %.  
3. As a new owner with no experience, I get one Create CTA — momentum, not guilt.

**Source:** Conversation Home · Blueprint §9 · readiness principle · `studio-home.page.ts`

---

## S-08 — Operate

| | |
|--|--|
| **Route** | `/studio/operate` |
| **Journey** | Provider — Operate |
| **Human question** | What needs attention? |
| **Feeling** | Everything is under control. |
| **Emotional goal** | Calm under pressure |
| **Uncertainty removed** | What do I do right now? |

**Layout gist:** Glance board — place · status · hint · tap → act. Quiet empty when kitchen is calm. Foot: Open station · Floor.

```text
Table 12 · Preparing · ~2 mins
Table 8 · Ready · Pickup
Table 16 · Needs attention
```

**Principles:** One glance · one tap · one decision · no searching · no remembering · no surprises.

**Live Experience:** Not primary; optional later glance. Warm denser Studio — never dark ops theme.

**Never-do:** Dashboard · BI · widgets · cards-in-cards · reports · celebration bounce.

**Story seeds**

1. As a host, I see what needs attention in one glance and tap to act.  
2. As a host in a quiet moment, I see a calm empty — ready when guests arrive.  
3. As a host, I never hunt charts or multi-primary station mosaics on the hub.

**Source:** Conversation S7 · [operate-craft.md](operate-craft.md) · `setup-operate.page.ts`

---

## S-09 — Grow

| | |
|--|--|
| **Route** | `/studio/grow` |
| **Journey** | Provider — Grow |
| **Human question** | How are we doing? *(answered as a trusted manager, not Excel)* |
| **Emotional goal** | Optimism · calm truth |
| **Uncertainty removed** | Are we doing well? What should I change? |

**Layout gist (frozen craft — prefer over conversation chart paste):**

```text
Good evening.
You welcomed 42 guests today.
Most guests ordered what they love here.
Average wait · 6 minutes
Guests were delighted.
────────
One suggestion
Open another station on Friday evenings.
```

**Conversation drift (do not ship as primary UI):** Revenue grids · return-rate KPI walls · chart galleries.

**Primary:** Back to Operate (when live) · Continue setup (when not).

**Never-do:** Insights product · filter bars · export toolbars · multi-suggestion carousels.

**Story seeds**

1. As an owner, I understand today in one breath without squinting at charts.  
2. As an owner, I get at most one suggestion I can act on.  
3. As an owner not yet live, I’m guided to go live before memory appears.

**Source:** Conversation Grow (emotion) · [grow-craft.md](grow-craft.md) *(UI truth)* · `studio-grow.page.ts`

---

## S-10 — Live Experience (chrome)

| | |
|--|--|
| **Route** | Permanent Setup chrome — **not** a nav destination |
| **Journey** | Provider — Configure confidence |
| **Human question** | *(implicit)* What will my guests experience? |
| **Emotional goal** | Trust the phone — “If it looks like this here, guests see exactly this.” |

**Layout gist:** Phone on desk · generous whitespace · soft shadow · large radius · notch · no browser chrome · modes shell / arrival / pay · optional fullscreen from panel.

**Behaviour:** Every material Studio edit updates immediately · one Experience Shell · Go Live makes public · no Refresh/Save/Apply.

**Never-do:** Preview as product noun · second UI · fake content that can’t ship · Live Experience as sidebar nav item · freeform builder.

**Story seeds**

1. As an owner configuring Setup, I always see the real guest shell beside my decision.  
2. As I change name, places, or pay options, the phone updates without a refresh.  
3. As I go live, I trust the public experience matches what I already saw.

**Source:** Conversation Experience Phone · [live-experience.md](live-experience.md) · Blueprint SECTION 2 Right Side · `live-experience-panel.component.ts`

---

## Wireframe ID note

Legacy [`wireframes/studio/README.md`](wireframes/studio/README.md) IDs (S2=configure, S5=live achievement…) **do not match** conversation S0–S7 or this index. Prefer this file + Blueprint for story Spec links.

---

*End of studio screen summaries*
