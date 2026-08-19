# LEOS Studio Design Blueprint v1

**Status:** Living Document · Design Constitution  
**Version:** 1.2  
**Date:** 2026-08-11  
**Source:** LEK-040 · LVES · LEK-029 · HCI · Studio / Experience Shell Constitution · Hospitality Phase · Studio Design System v1 · Motion System · Operate / Grow craft  
**Purpose:** Define exactly how LEOS Studio should look, feel, behave, and guide businesses from sign-up to operating live experiences.  
**Audience:** Designers · Engineers · AI tools (MagicPath · Cursor · Claude Code · OpenArt)  
**Code mirrors:** `apps/web/src/styles/_studio.scss` · Setup Engine · Live Experience panel · Studio Home · Operate · Grow  

**Related frozen specs (do not contradict):**

| Spec | Path |
|------|------|
| Feel | [LEK-040](../LEK-040-human-experience-engineering.md) |
| Look | [LVES](lves.md) |
| Parts | [LEK-028](../LEK-028-component-catalogue.md) |
| Studio DS | [studio-design-system.md](studio-design-system.md) |
| Motion | [leos-motion-system.md](leos-motion-system.md) |
| Live Experience | [live-experience.md](live-experience.md) |
| Studio → Live → Guest | **SECTION 3A** in this blueprint · [Experience Interaction Craft](experience-interaction-craft.md) |
| IA | [ia-experience-studio-shells.md](ia-experience-studio-shells.md) |
| Hospitality Phase | [hospitality-phase.md](hospitality-phase.md) |
| Operate | [operate-craft.md](operate-craft.md) |
| Grow | [grow-craft.md](grow-craft.md) |
| Board | [LEKKI-BUILD](../LEKKI-BUILD.md) |

**Change policy:** Setup screens in this blueprint are **frozen v1** — document them; do not redesign. Operate · Grow · Experience craft may deepen without violating pillars, Never-list, or Motion System. Structural product changes require ADR.

## Table of contents

1. [Purpose](#1-the-purpose-of-leos-studio)  
2. [Design Philosophy](#2-design-philosophy)  
3. [**SECTION 2 — Global Studio Experience**](#section-2--global-studio-experience)  
4. [**SECTION 3A — Studio → Live → Guest Contract**](#section-3a--studio--live-experience--guest-interaction-contract)  
5. [**SECTION 3 — Welcome & Choose Experience**](#section-3--welcome--choose-experience)  
6. [Setup Engine pages (Identity → Go Live)](#8-every-setup-page)  
7. [Studio Home](#9-studio-home) · [Operate](#10-operate) · [Grow](#11-grow)  
8. [Motion](#12-motion-system) · [Components](#13-component-library-studio) · [Writing](#14-writing-guidelines)  
9. [Golden Rules](#15-golden-rules) · [Engineering](#16-engineering-notes) · [Never](#17-never-do-quick-reference)

> SECTION 2 is global Studio rules. **SECTION 3A** is the Studio→Live→Guest contract (not Welcome). Welcome & Choose detail lives in SECTION 3 (3.A / 3.B).

---

## 1. The Purpose of LEOS Studio

LEOS Studio is **not** an admin dashboard.

LEOS Studio is a **guide** that helps organisations create experiences.

| Traditional software | LEOS Studio |
|----------------------|-------------|
| Configure your account. | Let’s prepare a wonderful experience for your guests. |
| Save · Publish · Hope | Change → See → Trust → Go Live |
| Admin · Settings · Modules | Moments · Feel · Trust |

**One sentence (product):**

> LEOS feels like a luxury hotel concierge disguised as software.

**One sentence (system):**

> LEOS is an operating system that gives people confidence throughout an experience.

---

## 2. Design Philosophy

### 2.1 Four pillars

Judge every future decision against these. If a feature increases **none**, it does not belong.

| Pillar | Feeling |
|--------|---------|
| **Confidence** | I know what’s happening. |
| **Calm** | Nothing feels stressful. |
| **Hospitality** | I’m being welcomed. |
| **Continuity** | The software remembers me. |

### 2.2 Human Confidence

Sacred outcome: **reduce uncertainty**.

Every screen must answer:

1. Where am I?  
2. What is happening?  
3. What should I do?  
4. Can I trust this?  
5. What happens next?  

If one answer is missing — the screen is incomplete.

### 2.3 Never Ask a Human to Remember

Studio remembers venue · places · payments · progress.  
Operators never re-enter what they already told us.  
Guests never re-learn where they are.

### 2.4 Never Ask a Human to Imagine

If an owner must mentally simulate the guest outcome, the design isn’t finished.  
**Live Experience** shows the consequence of every change — immediately — using the **same Experience Shell** guests will use after Go Live.

### 2.5 Studio vs Experience

| | Studio | Experience |
|--|--------|------------|
| Who | Organisations · staff | Guests · people |
| Feeling | I’m ready to welcome guests. | I’m in the right place. |
| Shell | Studio Shell | Experience Shell |
| Never | Guest chrome · Pack language | Studio · Operate · Grow · admin |

Guest **never** learns Studio exists.

### 2.6 Design principles (Studio)

1. **One question per page**  
2. **One primary action** (one gold Continue)  
3. **Live Experience is always visible** (Setup)  
4. **Typography creates hierarchy** — whitespace over borders  
5. **Hospitality before software**  
6. **Calm by Default**  
7. **Readiness over completion** — never “100% complete”

### 2.7 Emotional journey (Provider)

```text
Website → Create account → Welcome → Choose Experience
  → Who you are → What guests experience → Where guests join
  → How guests pay → Go Live → Studio Home → Operate → Grow
```

| Stage | Emotion to design for |
|-------|------------------------|
| Welcome | Safe to start |
| Choose | Clear identity of the experience |
| Identity → Payments | Progressive confidence |
| Go Live | “I did it.” (not “Setup complete”) |
| Home | Everything is ready |
| Operate | Everything is under control |
| Grow | A trusted manager told me the truth |

### 2.8 Roadmap mindset (Hospitality Phase)

```text
Not:  Pages → Features → Settings
Yes:  Moments → Feel → Trust
```

**Setup v1 is COMPLETE and FROZEN.** Craft goes to Operate · Grow · Experience.

---

# SECTION 2 — Global Studio Experience

This section defines everything that **never changes** throughout Studio.

Regardless of whether the company is configuring a restaurant, café, hotel or airport, Studio should always feel familiar.

The user should never have to learn a different interface.

**Only the content changes. Never the experience.**

---

## The Studio Promise

Every time someone opens LEOS Studio they should immediately feel:

> “I know where I am.”  
> “I know what I’m doing.”  
> “I know what happens next.”

If any of those questions cannot be answered in **under three seconds**, the page has failed.

---

## The Studio Personality

Studio should feel like a **calm hospitality consultant**.

Never like software.  
Never like enterprise administration.  
Never like an IT system.

Imagine an experienced hotel concierge sitting beside the owner saying:

> “Let’s do this together.”

Not:

> “Complete the following configuration.”

**Product sentence:** *LEOS feels like a luxury hotel concierge disguised as software.*

---

## The Human Story

Every company owner arrives carrying uncertainty. They are wondering:

- Will this be difficult?  
- Am I doing this correctly?  
- Can I change this later?  
- Will my guests understand this?  
- Will this actually work?  

The Studio exists to **remove those questions before they are spoken.**

Every page reduces uncertainty. That is the job.

---

## Global Layout Rules

Studio always uses the same overall anatomy.

```text
┌───────────────────────────────────────────────────────────────┐
│ LEKKI                                         Live ●          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│ Studio                     Live Experience                    │
│                                                               │
│ One Question              Actual Experience                   │
│                                                               │
│ One Card                  Same shell guests use               │
│                                                               │
│ One Primary Action        Updates instantly                   │
│                                                               │
├───────────────────────────────────────────────────────────────┤
│ Back                                    Continue              │
└───────────────────────────────────────────────────────────────┘
```

| Zone | Role |
|------|------|
| Top chrome | Brand · Live status · quiet mode switch |
| Left · Studio (~640px) | Decisions only |
| Right · Live Experience (~420px) | Confidence only |
| Sticky footer | Back (text) · Continue (gold) |

**Nothing else changes** between Setup pages — only the question, card content, confidence fact, and phone state.

**Code:** `setup-engine-host` · `leos-experience-screen` · `leos-live-experience-panel` · tokens in `_studio.scss`.

---

## The Left Side

The left side exists for **decisions**. Nothing else.

It should never become:

- documentation  
- help centre  
- feature catalogue  
- dashboard  

Every page asks exactly **ONE** human question.

| Step | Question | Never title it |
|------|----------|----------------|
| Identity | Who are you welcoming guests into? | Business Information · General Configuration · Organisation Details |
| Experience | What can guests do? | Experience Capabilities · Guest Runtime Features · Capability Configuration |
| Places | Where will guests join? | Physical Layout Configuration · Venue Resources · Location Mapping |
| Payments | How will guests pay? | Payment Gateway Configuration · Merchant Provider · Connector Settings |
| Go Live | Are you ready to welcome guests? | Deployment · Publish · Activate Workspace |

UI labels in product: **Who you are** · **What guests experience** · **Where guests join** · **How guests pay** · **Go Live** — human story, not engineering nouns.

---

## The Right Side

The right side exists for **confidence**.

Not preview. **Confidence.**

| Preview (forbidden) | Live Experience (required) |
|---------------------|----------------------------|
| Something fake | The real application before publishing |
| A second UI | The same Experience Shell |
| “Hope this matches production” | “If it looks like this here… guests see exactly this.” |

Rules:

1. Nothing appears in Live Experience that cannot exist after Go Live.  
2. Nothing guests will eventually see should be absent from Live Experience (for the moment being configured).  
3. There is **only ONE Experience Shell**. Studio projects it. Publishing makes it public.

```text
Studio edits  →  Live Experience (Experience Shell)  →  Go Live (same shell, public)
```

---

## Phone Frame

The Live Experience always appears inside a phone.

Not because guests only use phones — because phones create **emotional context**.

The owner instantly understands: *“This is what my customer will hold.”*

| Do | Don’t |
|----|--------|
| Sit in generous whitespace | Touch page edges |
| Feel like a premium object on a desk | Feel like another Studio card |
| Large corner radius · soft shadow | Hard chrome · browser toolbar |
| Warm cream behind the device | Decorative gradients · glow stacks |

---

## Live Experience Behaviour

Every interaction inside Studio updates the phone **immediately**.

| Studio action | Phone consequence |
|---------------|-------------------|
| Typing venue name | Venue title morphs |
| Turning off Drinks | Drinks disappear |
| Changing logo | Splash / brand updates |
| Focusing a place | Arrival screen changes |
| Enabling tipping | Checkout updates |

Everything is immediate.

**No Refresh button. No Save button. No Apply button.**

---

## Autosave Philosophy

Studio should never ask: *Do you want to save?*

Every meaningful change is automatically saved. The user receives quiet reassurance:

- ✓ Saved / Saved automatically  
- Looks good  
- Everything is up to date  

Never interrupt flow. Never force confirmation dialogs for ordinary edits.

**Timing:** Debounce typing (~220ms) · flash ~1.6s · fade — see Motion System.

---

## Progress Story

Progress is **emotional**, not numerical.

| Bad | Good |
|-----|------|
| Step 3 of 7 | Who you are |
| Progress: 42% | ↓ What guests experience |
| Wizard chrome | ↓ Where guests join |
| | ↓ How guests pay |
| | ↓ Go Live |

The owner feels like they are preparing to welcome someone — not completing software.

**Readiness over completion:** never celebrate “100% complete.”

---

## Primary Action

Every screen ends with **one gold button** — usually **Continue**.

Nothing competes with it.

Secondary actions remain text / ghost:

- Back  
- Skip for now  
- Learn more  
- Open Experience  

Those are **never gold**.

Gold means: *this matters*.

---

## Empty States

Every empty state should create **momentum**, never guilt.

| Bad | Good |
|-----|------|
| You have no products. | Let’s create your first experience. |
| No data found. | Kitchen is quiet — you’re ready when guests arrive. |

One clear button. One next step. Start / Continue / Create.

---

## Success States

Every success message should answer:

1. What happened?  
2. What should I do next?  

Examples:

> ✓ Guests will see this immediately.  
> Continue to Places.

> ✓ Your experience is live.  
> Guests can now scan your QR.  
> Open Experience · Download QR · Continue to Studio

---

## Error States

Studio never blames people.

| Bad | Good |
|-----|------|
| Invalid Configuration | Let’s fix one small thing before continuing. |

Explain. Highlight. Recover. Never punish.

---

## Loading

Loading should reassure.

| Prefer | Avoid |
|--------|--------|
| Updating your Live Experience… | Loading… |
| Preparing your QR… | Please wait… |
| Saving changes… | Processing… |

Soft gold pulse allowed. Never a mute spinner with no words.

---

## Motion Philosophy

Motion exists for **understanding**, never decoration.

Animation should answer:

- What changed?  
- Where did it go?  
- What should I look at?  

Examples: phone fades between arrival screens · venue title morphs · cards gently appear · buttons compress on press.

Nothing bounces. Nothing spins.  
Nothing celebrates except the quiet Go Live QR reveal (no confetti).

**Tokens:** 160 / 220 / 280 / 360ms · warm ease-out — [leos-motion-system.md](leos-motion-system.md).

---

## Micro-interactions

| Element | Behaviour |
|---------|-----------|
| Button hover | Subtle lift (~2px) or background shift · 160ms |
| Button press | Scale 0.98 |
| Checkbox / toggle | Soft scale · gold accent |
| Phone update | Fade / morph ~220ms |
| Autosave | Fade-rise |
| Cards | Shadow increases slightly |

Everything should feel alive. Nothing should demand attention.

`prefers-reduced-motion`: shorten or disable non-essential motion; keep instant Live updates.

---

## Accessibility

- Understandable **without colour** — gold alone does not communicate importance  
- Icons support colour; **labels support icons**  
- Motion respects reduced-motion settings  
- Touch targets **minimum 44px**  
- Text contrast **WCAG AA**  
- Live region / `role="status"` for autosave and confidence  
- One clear `h1` question per Setup page  

---

## Success Test (Global)

A business owner who has never used LEOS should finish any Studio page and say:

1. “I knew exactly what to do.”  
2. “I could see exactly what my guests would experience.”  
3. “I never felt lost.”  
4. “I never worried about making a mistake.”  

If they cannot honestly say all four — **the page is unfinished.**

---

# SECTION 3A — Studio → Live Experience → Guest Interaction Contract

**Status:** Authoritative  
**Purpose:** Prevent Studio configuration from drifting away from the guest experience.  
**Complements:** [Experience Interaction Craft](experience-interaction-craft.md) (guest patterns) · [live-experience.md](live-experience.md) (Live surface) · [Current Product State](current-product-state.md)

LEOS has three connected layers:

```text
Studio
→ business makes decisions

Live Experience
→ business sees the consequence

Experience
→ guest uses the consequence
```

These are not three different designs.

They are three views of the same experience.

---

## Core Rule

> Every meaningful Studio decision must have a visible consequence in Live Experience.

The business owner should never have to mentally translate:

"I enabled this capability..."

into:

"...therefore my guest will see this."

LEOS shows the consequence immediately.

---

## Example — Drinks

**Studio:** Enable Drinks.

**Live Experience:** Drinks category appears.

**Guest:** Drinks category is available.

---

## Example — Place

**Studio:** Create Table 12.

**Live Experience:**

```text
You're joining
Table 12.
```

**Guest:**

```text
You're joining
Table 12.
```

---

## Example — Tip

**Studio:** Enable tipping.

**Live Experience:** Tip option appears at checkout.

**Guest:** Tip option appears at checkout.

---

## Example — Required choices (G-04)

**Studio:** Create required side choices.

**Live Experience:**

```text
Choose your side
Required · Choose 1.
```

**Guest:** Chooses a side.

---

## No Drift Rule

The following must never happen:

- Studio says one thing.
- Live Experience shows another.
- Guest experiences something different again.

If these three states disagree, the feature is **not complete**.

---

## Studio Confidence Test

Before a configuration step is considered complete, the owner should be able to answer:

1. What will my guest see?
2. What will my guest choose?
3. What will my guest pay?
4. What happens after they choose?
5. What will their cart or confirmation remember?
6. What happens if something goes wrong?

The Live Experience should answer these questions visually wherever possible.

---

## Experience Confidence Test

The guest should never need to understand:

- configuration
- capabilities
- schemas
- modifiers
- runtime
- packs
- stations
- connectors
- payment providers
- Studio

The guest only understands:

- Where am I?
- What can I do?
- What do I want?
- What happens next?
- Did it work?

---

## Relationship to HCI

Every Studio decision should increase business-owner confidence.

Every Experience interaction should increase guest confidence.

The same principle applies to both surfaces.

But the language and visual treatment remain different.

| Surface | Feels like |
|---------|------------|
| **Studio** | A calm guide. |
| **Live Experience** | The actual guest experience. |
| **Guest Experience** | Being hosted. |

---

## Canonical Flow

```text
Business decision
      ↓
Studio
      ↓
Immediate consequence
      ↓
Live Experience
      ↓
Publish
      ↓
Experience Shell
      ↓
Guest interaction
```

---

## Spec stack (do not confuse)

| Layer | Governs |
|-------|---------|
| LEK-040 | How LEOS should **feel** |
| LVES | How LEOS should **look** |
| Studio Blueprint (this doc) | How the business owner **moves through Studio** |
| **SECTION 3A (this section)** | Studio → Live → Guest **must not drift** |
| [Experience Interaction Craft](experience-interaction-craft.md) | How the guest **actually interacts** |
| LEK-028 | Reusable parts |
| LEK-029 | Composition / capability truth |

**Key bridge:** Studio configures → Live Experience demonstrates → Guest Experience executes.

---

# SECTION 3 — Welcome & Choose Experience

Figma-depth specification for the first two Studio moments.  
**Status:** Setup v1 frozen — document & implement fidelity; do not invent alternate onboarding funnels.  
**Routes:** `/studio/welcome` · `/studio/create`  
**Code:** `studio-welcome.page.ts` · `studio-create.page.ts` · `experience-registry.ts`

> **Naming:** SECTION **3A** above is the interaction contract. SECTION **3.A** below is Welcome.

---

## 3.0 Journey position

```text
Website / Sign in
    ↓
Welcome          ← SECTION 3.A
    ↓
Choose Experience ← SECTION 3.B
    ↓
Who you are (Identity) → …
```

**Emotional arc:** Safe to start → Clear what I’m creating → Ready for naming.

Live Experience panel: optional / quiet on Welcome; **active** on Choose Experience (shell defaults for the selected type).

---

## 3.A Welcome

### 3.A.1 Intent

Invite the owner into Setup without fear, forms, or feature catalogues.

### 3.A.2 Human question

> Ready to create your experience?

*(Product headline may read: “Let’s get your experience ready.” — same intent.)*

### 3.A.3 Emotional goal

| Feel | Not |
|------|-----|
| Safe · welcomed · unhurried | Examined · sold to · configured |

### 3.A.4 User stories

1. As a first-time owner, I see one clear invitation so I can begin in one tap.  
2. As a returning owner who landed here again, I can go Home without losing my place.  
3. As anyone, I understand the journey ahead in human language — not software modules.

### 3.A.5 Layout hierarchy

```text
┌─ Studio column (max 640) ─────────────────────┐
│                                               │
│  Let’s get your experience ready.     (h1)    │
│  A few calm steps — then guests can           │
│  scan a QR and join.                  (lead)  │
│                                               │
│  · Choose what you’re creating                │
│  · Who you are                                │
│  · What guests experience                     │
│  · Where guests join                          │
│  · How guests pay                             │
│  · Go Live                                    │
│                                               │
│  Most teams finish in under ten minutes.      │
│                                               │
├───────────────────────────────────────────────┤
│  Home (text)              Continue (gold)     │
└───────────────────────────────────────────────┘
```

**Spacing:** Outer 48 · section 40 · list gap via 8pt rhythm · footer sticky.

**Live Experience:** May show calm brand / empty phone or hide density — Welcome is **pre-engine**. Never a feature grid on the right.

### 3.A.6 Component hierarchy

1. `leos-experience-screen`  
2. Purpose (Fraunces/Sora per DS) · lead  
3. Progress story list (typography, not wizard chrome)  
4. Muted reassurance line  
5. Escape: Home · Primary: Continue  

### 3.A.7 Copy (frozen tone)

| Element | Copy |
|---------|------|
| Headline | Let’s get your experience ready. |
| Lead | A few calm steps — then guests can scan a QR and join. |
| Steps | Choose what you’re creating · Who you are · What guests experience · Where guests join · How guests pay · Go Live |
| Reassurance | Most teams finish in under ten minutes. |
| Primary | Continue |
| Escape | Home |

**Never:** Create organisation · Configure workspace · Select modules · Get started free trial jargon · Marketplace.

### 3.A.8 Interactions

| Action | Result |
|--------|--------|
| Continue | Navigate `/studio/create` |
| Home | Navigate `/studio` |
| No forms | No validation walls on this page |

### 3.A.9 Live Experience behaviour

No required sync. If phone is visible: static hospitality calm — not a fake dashboard.

### 3.A.10 Motion

- Page enter: 280ms fade-rise  
- Primary press: scale 0.98 / 160ms  
- List: no staggered carnival — optional soft appear  

### 3.A.11 Success criteria

- [ ] One gold action only  
- [ ] Journey readable in &lt;3 seconds  
- [ ] Zero forms  
- [ ] Zero Pack / admin language  
- [ ] Owner can answer the four global success questions  

### 3.A.12 Accessibility

- Single `h1`  
- List is an ordered list (semantics)  
- Footer buttons ≥44px  
- Focus order: content → Home → Continue  

### 3.A.13 Engineering notes

- `StudioWelcomePageComponent`  
- No workspace mutation on this page  
- Do not attach Live Experience host requirement if shell omits it on Welcome — Setup Engine host begins at Identity; Create may sit in Studio shell without full two-column until Setup Engine — **keep Welcome calm even if single column**

### 3.A.14 Never do

- Feature comparison tables  
- “Coming soon” Marketplace tiles  
- Progress %  
- Multiple CTAs of equal weight  
- Asking for business details here  

### 3.A.15 Future considerations

Optional first-name greeting if Continuity pillar already knows them — still one question, one gold button.

---

## 3.B Choose Experience

### 3.B.1 Intent

Let the owner pick the hospitality shape of their experience. Packs remain implementation; UI never says Pack.

### 3.B.2 Human question

> What experience are you creating?

### 3.B.3 Why-sentence / lead

> Pick the one that matches how guests will join.

### 3.B.4 Emotional goal

| Feel | Not |
|------|-----|
| “I know what I’m creating.” | “I must understand a platform taxonomy.” |

### 3.B.5 User stories

1. As an owner, I scan a short list of familiar venue types and recognise myself.  
2. As I select, I see confidence (“You’ll create · Restaurant”) and the Live Experience shell defaults update.  
3. As I continue, a workspace experience is started with that type’s defaults — I can change my mind later via Start over paths, not fear.

### 3.B.6 Layout hierarchy

```text
┌─ Studio 640 ────────────┬─ Live Experience 420 ─┐
│ What experience are     │  Phone on desk        │
│ you creating?           │  Shell defaults for   │
│                         │  selected type        │
│ Pick the one that       │  Venue placeholder    │
│ matches how guests      │  Categories / home    │
│ will join.              │                       │
│                         │                       │
│ Restaurant              │                       │
│ Guests order and dine.  │                       │
│ ─────────────────────── │                       │
│ Café                    │                       │
│ Fast coffee service.    │                       │
│ ─────────────────────── │                       │
│ …                       │                       │
│                         │                       │
│ ✓ Looks good            │                       │
│ You’ll create           │                       │
│ Restaurant              │                       │
├─────────────────────────┴───────────────────────┤
│ Back                          Continue (gold)   │
└─────────────────────────────────────────────────┘
```

**Row anatomy (each type):**

- Label (semibold ~17px)  
- Blurb (one sentence, secondary)  
- Selected: label shifts to gold-dark · `aria-selected`  
- Separator: quiet hairline — **not** boxed dashboard cards  

### 3.B.7 Experience catalogue (content)

| Type | Blurb (product) | Default venue (internal) | Guest join intuition |
|------|-----------------|--------------------------|----------------------|
| Restaurant | Guests order and dine. | Blue Door | Table QR |
| Café | Fast coffee service. | Harbor Roast | Counter / stand |
| Hotel | Guest services and room experiences. | Coastal Lodge | Room QR |
| Festival | On-site food and drinks. | *(registry)* | Zone / stall |
| Airport | Gate and lounge service. | *(registry)* | Gate / lounge |
| Healthcare | Clinic café and pharmacy pickup. | *(registry)* | Clinic context |

Expand blurbs in UI only if still **one glance** — never multi-paragraph cards.

**Illustration:** optional light mark; typography-led list is the frozen v1 pattern (no collage tiles).

### 3.B.8 Component hierarchy

1. `leos-experience-screen`  
2. Listbox of `studio-create-row` options  
3. `leos-confidence-indicator` — eyebrow “You’ll create” · fact = selected label  
4. Back → Welcome · Continue (disabled until selection)  

### 3.B.9 Copy

| Element | Copy |
|---------|------|
| Question | What experience are you creating? |
| Lead | Pick the one that matches how guests will join. |
| Confidence waiting | Choose an experience type to continue |
| Confidence ready | ✓ Looks good · You’ll create · {Type} |
| Primary | Continue |
| Escape | Back |

**Never:** Choose Pack · Select profile · Capability template · Industry vertical (enterprise).

### 3.B.10 Interactions

| Action | Behaviour |
|--------|-----------|
| Click / tap row | Select · update confidence · touch Live defaults |
| Keyboard | Listbox / option semantics · arrow keys where implemented |
| Continue | `startExperience(typeId)` · navigate Setup Identity |
| Back | `/studio/welcome` |
| Reselect | Allowed · confidence and phone update |

### 3.B.11 Live Experience behaviour

| When | Phone shows |
|------|-------------|
| Nothing selected | Calm empty / last selection / generic hospitality shell |
| Restaurant selected | Blue Door defaults · Food / Drinks categories grammar |
| Café selected | Harbor Roast · coffee grammar |
| … | Type defaults from registry |

**Sync rule:** Selection is a material Studio change → `touchLive()` / hydrate. Instant. No Apply.

### 3.B.12 Motion

- Row select: colour ease 160ms  
- Confidence settle when ready: 360ms fade-rise  
- Phone: pulse + morph 220ms on type change  
- Continue enable: no fanfare  

### 3.B.13 Microcopy & states

| State | UI |
|-------|-----|
| Empty selection | Continue disabled · confidence waiting line |
| Selected | Continue enabled · ✓ Looks good |
| Error starting | Calm recover: “Let’s try that again.” (rare) |

### 3.B.14 Success criteria

- [ ] Owner identifies their type in &lt;3 seconds  
- [ ] Pack never appears in UI  
- [ ] Live Experience matches selected type defaults  
- [ ] One gold Continue  
- [ ] Confidence block present  
- [ ] Four global success questions pass  

### 3.B.15 Accessibility

- `role="listbox"` / `role="option"` · `aria-selected` · `aria-activedescendant`  
- Continue disabled state announced implicitly via focus + disabled  
- Contrast AA on selected gold-dark text  
- Touch rows full width ≥44px height  

### 3.B.16 Engineering notes

- Source of truth: `EXPERIENCE_REGISTRY`  
- `StudioContextService.startExperience(id)` seeds venue · places · design defaults  
- `packId` internal only  
- Do not route through Marketplace  

### 3.B.17 Never do

- Pack picker / capability matrix  
- Multi-select types  
- “Compare plans”  
- Heavy illustrated marketing cards that bury the blurb  
- Requiring logo/name before type choice  
- Preview iframe of a different product  

### 3.B.18 Future considerations

- Smarter default type from website intent — still one list, one question  
- “Not sure?” helper as **text** secondary — never a second gold path  
- Full Figma spacing annotations may mirror DS tokens (48 / 40 / 32 / 20 / 8) without new invent  

---

## Bridge to Setup Engine

After Choose Experience Continue:

```text
Who you are → What guests experience → Where guests join → How guests pay → Go Live
```

Full two-column Setup chrome + Live Experience **required** from Identity onward.  
See §8 (Identity → Go Live) for page briefs; deeper Figma sections (4+) may extend this blueprint later **without redesigning** frozen behaviour.

---

## 8. Every Setup Page

> **Setup v1 FROZEN.** Spec below is the constitution of what exists — not a backlog to redesign.

---

### 8.1 Welcome

> **Full Figma-depth spec:** [SECTION 3.A](#3a-welcome). Brief retained for index only.


| | |
|--|--|
| **Human question** | Ready to create your experience? |
| **Emotional goal** | Safe to start · no fear |
| **User story** | As a new owner, I want a clear invitation so I can begin without forms or jargon. |

**Layout**

```text
Logo / LEKKI
Headline — Let’s get your experience ready.
One short paragraph
[ Get started ]  ← one gold
```

**Components:** Brand · headline · lead · primary CTA  
**Copy:** Hospitality invitation — no “Create organisation” · no account walls on this screen if already signed in  
**Live Experience:** May be absent or quiet brand — Welcome is pre-engine  
**Success criteria:** One tap to Choose Experience · no forms · no complexity  
**Motion:** Enter 280ms · button press 0.98  
**Never:** Feature grids · Marketplace tiles · “Coming soon”

---

### 8.2 Choose Experience

> **Full Figma-depth spec:** [SECTION 3.B](#3b-choose-experience). Brief retained for index only.


| | |
|--|--|
| **Human question** | What kind of experience are you creating? |
| **Emotional goal** | I know what I’m creating |
| **User story** | As an owner, I pick a familiar hospitality type and immediately understand the guest journey. |

**Layout:** Vertical or soft card list — Restaurant · Café · Hotel · Festival · Airport · Healthcare  

Each card:

- Label  
- One sentence (what guests do)  
- Typical join context  

**Example — Restaurant**

> Guests scan a table QR · Browse · Order · Pay · Enjoy

**Live Experience:** Phone updates to that experience’s shell defaults (venue placeholder · categories).  
**Success criteria:** Selection feels reversible until Continue; Live Experience matches type.  
**Motion:** Card hover elevation · select accent  
**Never:** “Choose Pack” · capability marketplace · engineering profile IDs in UI  
**Engineering:** Pack is implementation only — UI says **Experience**

---

### 8.3 Identity — Who you are

| | |
|--|--|
| **Human question** | Who are you? |
| **Why-sentence** | Guests will recognise your business. |
| **Emotional goal** | This place is named · guests will recognise us |
| **User story** | As an owner, I type my venue name and see it appear on the guest phone instantly. |

**Layout:** Name field (required) · type label (read-only context) · optional description/logo later  

**Copy**

| Prefer | Avoid |
|--------|--------|
| Restaurant name | Organisation entity |
| Saved automatically | Save |
| Guests will recognise your venue | Profile updated |

**Live Experience:** Typing “Blue Door” → phone fades → venue morphs → confidence ✓  
**Autosave:** Debounced ~220ms · flash “Saved automatically” ~1.6s  
**Success criteria:** Continue enabled with non-empty name; phone shows name  
**Motion:** Signature Identity sequence (Motion System)  
**Never:** Separate Save · Publish · Apply  

---

### 8.4 Experience — What guests experience

| | |
|--|--|
| **Human question** | What can guests do? |
| **Why-sentence** | Guests will choose what you’d like to offer. |
| **Emotional goal** | I understand exactly what guests will experience |
| **User story** | As an owner, I turn on guest-facing options and see the phone reflect them. |

**Layout:** Grouped toggles in human language  

Examples:

- Browse menu · Order food · Request service · Pay digitally · Tip · Split bill  

Groups titled like hospitality (“How guests pay” / offerings) — never capability IDs.

**Live Experience:** Instant shell update  
**Confidence:** “Guests can · {summary}” · ✓ Looks good when at least one path exists  
**Success criteria:** Owner can explain the guest journey in one sentence  
**Motion:** Toggle gold accent · phone morph  
**Never:** Capability resolver language · empty forced complexity  

---

### 8.5 Places — Where guests join

| | |
|--|--|
| **Human question** | Where will guests join? |
| **Why-sentence** | Guests will know exactly where they are. |
| **Emotional goal** | Places match how guests arrive |
| **User story** | As an owner, I define sections and places; selecting one updates arrival on the phone. |

**By type (examples)**

| Type | Sections |
|------|----------|
| Restaurant | Main Dining · Patio · Bar |
| Hotel | Rooms · Spa · Restaurant |
| Café | Counter · Tables |

**Bulk creation:** Table 1–20 — no repetitive work  

**Confidence:** ✓ 24 places ready — **not** “24 entities created”

**Live Experience (arrival mode)**

```text
Welcome
Blue Door
You’re joining
Terrace
Table 12
```

**Success criteria:** Focus place changes arrival immediately; bulk feels safe  
**Motion:** Place focus → phone pulse  
**Never:** GIS jargon · “nodes” · “contexts” in UI  

---

### 8.6 Payments — How guests pay

| | |
|--|--|
| **Human question** | How do guests pay? |
| **Why-sentence** | Guests can pay with confidence. |
| **Emotional goal** | Guests can pay without friction |
| **User story** | As an owner, I choose guest payment options and see them on the phone bill. |

**Options (calm list):** Card · Apple Pay · Google Pay · (tip / split as design allows)

**Live Experience (pay mode)**

```text
Your bill
R248.00
Card · Apple Pay · Google Pay
```

**Confidence:** ✓ Guests can pay confidently  
**Success criteria:** ≥1 method · phone matches · no 11-step connector wizard in Setup v1  
**Never:** “Setup connector” · developer webhook copy on this screen  

---

### 8.7 Go Live

| | |
|--|--|
| **Human question** | Are you ready? |
| **Why-sentence** | You’re ready to welcome your first guest. |
| **Emotional goal** | **I did it.** — not “Setup complete.” |
| **User story** | As an owner, I go live, receive a QR, and know guests can join now. |

**Layout**

- Promise line (nothing changes for guests — now public)  
- QR reveal  
- Venue · place  
- Download QR · Open guest link · Copy link  
- Confidence: Ready to welcome your first guest  
- Continue → Operate  

**Confidence check (guest language)**

- Guests can join · browse · pay · QR is ready  

**Primary:** Gold **Go Live** / Continue into Operate  

**Motion:** QR scale 0.96→1 (360ms) · secondary actions stagger +40ms  

**Never:** Confetti · “100% complete” · badge farming  

---

## 9. Studio Home

**Not a dashboard. A readiness front door.**

| | |
|--|--|
| **Feeling** | I’m ready to welcome guests. |
| **Emotional goal** | Confidence without charts |
| **User story** | As an owner returning, I see greeting · venue · readiness · next doors. |

**Layout**

```text
Good morning.
Blue Door
Everything is ready.
──────────────
Today’s Experience
Guests · Ready for the next guest
Kitchen · Ready
Payments · Healthy
──────────────
[ Open Experience ]
Operate · Grow
```

**States**

| State | Readiness line | Primary |
|-------|----------------|---------|
| Empty | Let’s create your first experience. | Create |
| Setup in progress | Almost ready to welcome guests. | Continue setup |
| Live | Everything is ready. | Open Experience |

**Success criteria:** No % · no step counters · no widgets  
**Motion:** Staggered appear 280ms  
**Never:** Chart strips · “4/5 complete” · Marketplace tiles  

---

## 10. Operate

**Feeling:** Everything is under control.  
**Phase craft:** Weeks of depth — not more Setup.

### 10.1 Mission control philosophy

Someone in a busy restaurant has no time to admire animations.  
Everything disappears into the background.

```text
One glance.
One tap.
One decision.

No searching.
No remembering.
No surprises.
```

### 10.2 Queue design (primary surface)

```text
──────────────
Table 12
Preparing
2 mins
──────────────
Table 8
Ready
Pickup
──────────────
Table 16
Needs attention
──────────────
```

Row = place · status · hint · **tap → act**

### 10.3 Staff interactions

- Tap row → station or floor action  
- Quiet empty when no tickets  
- Foot links: Open Kitchen · Floor — secondary  

### 10.4 Touch-first layout

- Large tap rows · full width  
- Warm Studio palette · denser — **never** dark ops theme  
- Motion ≤ fast/enter — invisible under pressure  

### 10.5 Success criteria

Can a host clear the next thing without reading a sentence twice?

### 10.6 Never

Widgets · reports · cards-in-cards · chart health panels · celebration bounce  

---

## 11. Grow

**Feeling:** A trusted manager told me the truth.  
**Almost invisible.** Against typical SaaS analytics.

### 11.1 Calm analytics (narrative)

```text
Good evening.

You welcomed 42 guests today.

Most guests ordered the Burger.

Average wait
6 minutes

Guests were delighted.

──────────────
One suggestion
Open another station on Friday evenings.
```

### 11.2 Readiness & business health

Health is spoken in hospitality — “Payments healthy” · “Guests were delighted” — not BI scorecards.

### 11.3 Suggestions

**One suggestion max.** No insight feed · no carousel.

### 11.4 Success criteria

Would a busy owner understand this in one breath?

### 11.5 Never

Revenue grids · visitor funnels · chart galleries · filter bars · export toolbars as the primary surface  

---

## 12. Motion System

Full freeze: [leos-motion-system.md](leos-motion-system.md)

### 12.1 Timings

| Token | Value | Use |
|-------|--------|-----|
| fast | 160ms | Hover · press · checkbox |
| default | 220ms | Transitions · phone lift |
| enter | 280ms | Card / page appear |
| settle | 360ms | Success · QR · confidence |

### 12.2 Easing

- `--studio-ease`: `cubic-bezier(0.22, 1, 0.36, 1)`  
- `--studio-ease-soft`: `cubic-bezier(0.33, 1, 0.68, 1)` morph  

### 12.3 Hover · click

- Hover: background shift · no grow  
- Press: scale 0.98  
- Card hover: soft → device shadow  

### 12.4 Transitions

Outgoing fade 160–220ms · incoming rise 280ms  

### 12.5 Success moments

Check + copy fade-rise · soft green · no confetti  

### 12.6 Go Live celebration

QR reveal · readiness language · quiet pride — not fireworks  

### 12.7 Never

Bounce · pop · shake · spin forever · motion >400ms for ordinary UI · motion that blocks the next tap · celebrating “100% complete”

---

## 13. Component Library (Studio)

Platform guest components live in [LEK-028](../LEK-028-component-catalogue.md).  
Studio-specific parts below — document Purpose · Anatomy · States · Behaviour · A11y · Motion · Usage.

### 13.1 Experience Screen (Setup page frame)

**Purpose:** Enforce page anatomy (question · why · config · confidence · footer).  
**Anatomy:** Purpose · lead · config slot · confidence slot · escape · primary  
**States:** default · primary disabled  
**A11y:** One `h1` question · footer landmark actions  
**Motion:** Content enter 280ms  
**Usage:** All Setup Engine steps  

### 13.2 Confidence Indicator

**Purpose:** Guest confidence, not checklist completion.  
**Anatomy:** ✓ ok · eyebrow · fact (Fraunces) · detail · waiting  
**States:** waiting · ready (settle animation)  
**Motion:** settle 360ms when ready  
**Usage:** End of every Setup page  

### 13.3 Live Experience Panel

**Purpose:** Phone-on-desk projection of Experience Shell.  
**Anatomy:** Label · phone · notch · screen · fullscreen control  
**States:** shell · arrival · pay · pulse · fullscreen  
**Behaviour:** Reacts to `liveRevision` · focus place · pay methods  
**A11y:** `aria-label="Live Experience"` · dialog when fullscreen  
**Motion:** pulse · morph · phone-in  

### 13.4 Primary Button (gold)

**Purpose:** The one decision that matters.  
**States:** default · hover · active · disabled  
**Motion:** 160ms · press 0.98  
**Usage:** Exactly one per page  

### 13.5 Secondary / Escape Button

**Purpose:** Back · alternate without competing.  
**Visual:** Text · secondary ink · no gold fill  

### 13.6 Autosave Toast

**Purpose:** Continuity without interrupting typing.  
**Copy:** Saved automatically  
**Motion:** fade-rise · hold ~1.6s  

### 13.7 Progress Story

**Purpose:** Orient in Setup without % complete.  
**Anatomy:** Step labels · current emphasis · quiet separators  

### 13.8 Operate Glance Row

**Purpose:** One tap under pressure.  
**Anatomy:** Place · status · hint  
**States:** new · preparing · ready · attention  
**A11y:** Link/button with clear name  

### 13.9 Grow Story Block

**Purpose:** Trusted-manager narrative.  
**Anatomy:** Greeting · story lines · wait · delight · one suggestion  

### 13.10 Toggle / Checkbox (Setup)

**Purpose:** Guest-facing options.  
**Motion:** Gold accent · slight scale when checked  
**A11y:** Label wraps control  

---

## 14. Writing Guidelines

### 14.1 Voice

Luxury hotel concierge — warm · clear · never clever for its own sake · never corporate.

### 14.2 Tone by surface

| Surface | Tone |
|---------|------|
| Setup | Guided · reassuring · unhurried |
| Home | Confident · brief |
| Operate | Sparse · imperative · glanceable |
| Grow | Human · reflective · one suggestion |
| Experience (guest) | Welcoming · orienting |

### 14.3 Good vs bad copy

| Good | Bad |
|------|-----|
| Continue | Save / Apply / Submit |
| Saved automatically | Changes saved successfully |
| You’re ready to welcome guests | Setup 100% complete |
| Guests will recognise your business | Update organisation profile |
| Kitchen is quiet — you’re ready when guests arrive. | No data found |
| Go live | Publish configuration |
| Live Experience | Preview |
| Choose Experience | Choose Pack |
| Everything is ready. | Dashboard overview |

### 14.4 Hospitality language

Guests · welcome · join · table · ready · delighted · pay confidently  

### 14.5 Studio language

Who you are · What guests experience · Where guests join · How guests pay · Go Live · Operate · Grow  

### 14.6 Experience language (guest)

You’re joining · Your bill · Continue · Ready for pickup — never Studio words  

### 14.7 Forbidden UI words

Configure capability · Resolve context · Setup connector · Publish profile · Pack · Entities · Admin · Insights (as product) · Preview mode  

---

## 15. Golden Rules

Every screen must pass before it is considered complete.

### 15.1 Checklist

- [ ] Increases ≥1 pillar: Confidence · Calm · Hospitality · Continuity  
- [ ] Answers: Where am I? · What am I deciding? · What happens next?  
- [ ] One primary question / one gold action (Setup & Home)  
- [ ] Live Experience visible on Setup — consequence shown, never imagined  
- [ ] **No drift:** Studio · Live Experience · Guest agree ([§3A](#section-3a--studio--live-experience--guest-interaction-contract))  
- [ ] Autosave where typing happens — no Save button as hero  
- [ ] Readiness language — never % complete theater  
- [ ] Motion within 160–360ms · no bounce / confetti  
- [ ] Empty / loading / error are calm and recoverable  
- [ ] Copy is hospitality — zero Pack / admin / connector jargon  
- [ ] Guests would never see this chrome (if Studio)  
- [ ] Operate: one glance · one tap · one decision  
- [ ] Grow: one breath · one suggestion · no chart gallery  
- [ ] Accessibility: focus order · labels · status roles · tap targets  
- [ ] Responsive: still usable without two columns  

### 15.2 Final principle

> LEOS is not software.  
> LEOS is confidence, designed into experiences.

### 15.3 The LEOS feeling

| Who | Should feel |
|-----|-------------|
| Businesses | I can do this. |
| Guests | I’m in the right place. |
| Staff | I know what to do. |
| Operators | Everything is under control. |

---

## 16. Engineering Notes

| Concern | Guidance |
|---------|----------|
| Tokens | `_studio.scss` CSS variables — do not hardcode one-off hex in features |
| Live sync | `StudioContextService.touchLive()` / signals — panel hydrates |
| Setup host | `setup-engine-host` + `leos-live-experience-panel` |
| Packs | Implementation only — never in UI copy |
| Dual renderer | Forbidden without ADR — one Experience Shell |
| Setup redesign | **Forbidden** without ADR — v1 frozen |
| Tests / evidence | Prefer running UI + HCI moments over new philosophy LEKs |

---

## 17. Never Do (quick reference)

- Dashboards · widgets · cards-in-cards on Operate  
- “100% complete” · step X of Y as celebration  
- Preview as a product noun or route  
- Dark mode ops skin  
- Gold everywhere  
- Bounce / shake / confetti  
- Asking humans to imagine guest outcomes  
- Reopening Setup for polish during Hospitality Phase  
- Elevating Grow into “Insights” product  

---

## 18. Future Considerations (out of scope for Setup v1)

| Area | Direction |
|------|-----------|
| Operate | Deeper station · floor · multi-station glance · offline resilience |
| Grow | True favourites from Org Memory · better suggestions — still one breath |
| Experience HCI | Arrival → Return green without Studio leakage |
| Dual Experience Shell fidelity | Only if single-shell proof fails — ADR |
| Marketplace / Neo | Hold — ambient later · never Setup chrome |

---

## 19. Document control

| Version | Notes |
|---------|-------|
| 1.0 | Consolidated constitution from LEK-040 · LVES · DS v1 · Motion · Live Experience · Hospitality Phase · Operate/Grow craft · owner blueprint draft |
| 1.1 | SECTION 2 Global Studio Experience · SECTION 3 Welcome & Choose Experience (Figma-depth) |
| 1.2 | **SECTION 3A** Studio → Live Experience → Guest Interaction Contract (authoritative no-drift bridge) |

**Maintainer rule:** When software and this blueprint disagree, **fix software** if it matches frozen principles; then update this document. Never invent a third conflicting “philosophy” LEK.

---

*End of LEOS Studio Design Blueprint v1.2*
