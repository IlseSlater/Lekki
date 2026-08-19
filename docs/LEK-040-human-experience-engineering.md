# LEK-040 — Human Experience Engineering

**Status: Frozen**  
**Title:** Human Experience Engineering  
**How LEOS should feel.** Look → [LVES](ux/lves.md). Build with → [LEK-028](LEK-028-component-catalogue.md).  
**Complements:** [NORTH-STAR](NORTH-STAR.md) · [LEK-029](LEK-029-experience-composition.md) · [LEKKI-BUILD](LEKKI-BUILD.md)  
**Change policy:** Principles frozen. Examples may be added; structural redesign requires ADR.  
**Do not** open LEK-041+ philosophy docs.

```text
Human Experience Engineering (LEK-040)     ← feel
        │
        ▼
Experience Principles
        │
        ▼
Visual Language (LVES)                     ← look
        │
        ▼
Components (LEK-028)                       ← parts
        │
        ▼
Implementation Rules                      ← build
```

Psychology first. Visual second. Components third.

---

## One sentence

**LEOS is an operating system that gives people confidence throughout an experience.**

Everything else is a consequence.

**Sacred:** reduce **uncertainty**.  
**Identity rule:** *The interface should feel like it already knows what the user is trying to do.*  
**Hospitality sentence:** *LEOS feels like a luxury hotel concierge disguised as software.*

**Four pillars (feel):** Confidence · Calm · Hospitality · Continuity — [Hospitality Phase](ux/hospitality-phase.md).  
If a change increases none of them, it does not belong.

```text
Studio                          Experience
Confidence to create            Confidence they are in the right place
Confidence to configure         Confidence they know what to do
Confidence to go live           Confidence their request was received
Confidence to operate           Confidence it is progressing
Confidence to grow              Confidence it is complete
```

We design **moments of confidence** — not screens.

---

## 1. Experience Principles

| Principle | Meaning |
|-----------|---------|
| **Human Confidence** | Every moment increases confidence. Never leave someone wondering. |
| **Never Ask a Human to Remember** | LEOS remembers everything it reasonably can. No searching, remembering, or guessing. |
| **Never Ask a Human to Imagine** | Whenever someone configures something, LEOS shows the outcome immediately — in Live Experience. |
| **Calm by Default** | Nothing feels urgent unless it actually is. Prefer Continue · Saved · Looks good over Save · Publish · Apply. |
| **Minimum Decisions** | LEOS decides almost everything. Two taps beats fewer screens. |
| **Reduce Cognitive Load** | Never make people hold what the platform already knows. |
| **Reduce Anxiety** | Uncertainty hurts more than clicks — always answer “did it work?” |
| **Progressive Disclosure** | Complexity only when needed. |
| **One Primary Action** | Never leave “what do I do now?” unanswered. |
| **Recover, don’t punish** | Errors redirect the journey; they don’t end it. |
| **Visible Progress** | Humans see where they are. |
| **Preserve Flow** | Don’t break momentum without a very good reason. |

### Human Confidence (three questions)

Every screen must answer **before the user asks**:

1. Where am I?  
2. What can I do?  
3. What happens next?  

If it cannot — redesign it.

Also: How do I recover?

### Product language

| Experience | Studio |
|------------|--------|
| Discover | Create |
| Join | Configure |
| Experience | Activate |
| Complete | Operate |
| Return | Grow |

Machinery (runtimes, profiles, capabilities, Neo, connectors) stays invisible.

### Product voice

| Software | LEOS |
|----------|------|
| Entry resolved | You’re in the right place. |
| Session created | Welcome. / Welcome back. |
| Configuration completed | You’re live. |
| Payment completed | You’re all set. |
| Done | Thanks for joining us today. |

### Studio vs Experience (feel)

| Studio | Experience |
|--------|------------|
| One product · three **modes**: Setup · Operate · Grow | Hospitality · never software chrome |
| Opens on **status**, not a nav grid | Guests never see stations, Setup, Studio, profiles, templates |
| Setup: calm guide · Operate: air-traffic control · Grow: calm numbers · **Live Experience** always beside config | Only: where they are · what they can do · what happens next |

**IA freeze:** [ia-experience-studio-shells.md](ux/ia-experience-studio-shells.md) — two surfaces; modes are not products.

### Never Ask a Human to Remember

| Human | LEOS remembers |
|-------|----------------|
| Returning guest | Welcome back, Alex. |
| Familiar venue | Your usual table is available. |
| Second venue | Branding · payments · terminology · hours · roles |
| Engineer | Where things belong — no hunting |

### Never Ask a Human to Imagine

Distinct from remembering. Captures Live Experience:

| Human must not… | LEOS does… |
|-----------------|------------|
| Mentally simulate the guest view | Show Live Experience with the same Experience Shell |
| Wonder “what will this look like?” | Update the outcome on every material change |
| Hope after Publish | Trust before Go Live — they’ve already lived inside it |

**Design test:** If a business owner has to *imagine* the result instead of *seeing* it, the Studio design isn’t finished.

Frozen surface: [live-experience.md](ux/live-experience.md).

### Human Confidence Index (HCI)

Board: [LEKKI-BUILD](LEKKI-BUILD.md). Design **Payment Confidence**, not “the Payment screen.”

### Signature review (CX · DX · OX · PX)

| | Question |
|--|----------|
| **CX** | Can the guest act confidently? |
| **DX** | Can an engineer extend without sprawl? |
| **OX** | Can staff operate under pressure? |
| **PX** | Can another pack reuse without Platform change? |

### Moment gate

1. Which moment of confidence?  
2. Which human?  
3. Which reusable capability?  
4. How do we know confidence increased?  
5. Can another profile reuse it?  

---

## 2. Visual Language

**LEOS Visual Experience System (LVES)** — how LEOS should look.

→ Full system: **[ux/lves.md](ux/lves.md)** (LVES 2.0)  
→ Studio: `apps/web` `_studio.scss` under LVES 2.0.

When in doubt: clarity over decoration · whitespace over density · typography over borders · confidence over cleverness.

**Applied craft (examples):** [LVES · Applied craft tips (uxpeak-aligned)](ux/lves.md#applied-craft-tips-uxpeak-aligned) — interaction cost, journey-stage UI, empty states as invitations, show status don’t only tell it, thumb zone, input-by-moment. Sourced from [uxpeak+](https://www.uxpeak.com/) teaching; expressed as LEOS rules.

---

## 3. Components

**[LEK-028](LEK-028-component-catalogue.md)** — primitives used to build moments.

Every component is incomplete until it has: Purpose · Primary action · Loading · Empty · Success · Error · Offline · Accessibility.

---

## 4. Implementation Rules

**Optimise for:** clarity · confidence · flow · calm · time to value.  

**Do not optimise for:** feature density · information density · dashboard density · administrative power.

| Layer | Owns |
|-------|------|
| LEK-040 | How LEOS should **feel** |
| LVES | How LEOS should **look** |
| LEK-028 | What **parts** we use |
| Running software | Proof |

**Motto:** Every merged change should make someone’s day a little easier.

---

## Related

| Doc | Role |
|-----|------|
| [NORTH-STAR](NORTH-STAR.md) | Constitution |
| [LVES](ux/lves.md) | Visual Experience System · uxpeak-aligned craft tips |
| [LEK-028](LEK-028-component-catalogue.md) | Components |
| [LEK-029](LEK-029-experience-composition.md) | Moments / composition |
| [LEKKI-BUILD](LEKKI-BUILD.md) | Daily board · HCI |
| [LEK-026](LEK-026-leds-visual-language.md) | Earlier LEDS tokens (absorbed into LVES direction) |
