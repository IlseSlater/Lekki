# LEOS Visual Experience System — LVES 2.0

**Status:** Active  
**Owns:** How LEOS should **look** — makes LEK-040 feel inevitable  
**Feel:** [LEK-040](../LEK-040-human-experience-engineering.md)  
**Parts:** [LEK-028](../LEK-028-component-catalogue.md)  
**Code:** `apps/web/src/styles/_studio.scss` · Experience `_tokens.scss` / `_leos.scss`

Does not replace philosophy. Gives it a consistent visual expression.

---

## Design Principles

### 1. Remove Noise Before Adding Beauty

Never decorate. Never fill space because it exists.  
If something isn’t helping someone make the next decision — **remove it**.

### 2. Typography Creates Hierarchy

Spacing and typography replace borders.

Prefer:

```text
Configure

Set up your venue once.
```

Not boxed section headers.

### 3. Cards are Containers, not Boxes

Pieces of paper on a desk — not tiles.

- Almost invisible borders  
- Soft elevation  
- Generous padding  
- Rounded corners  
- Breathing room  

### 4. One Moment. One Action.

Every screen has exactly one thing the human should do.  
Everything else supports that decision. Never compete.

### 5. Calm by Default

Large whitespace. The page should feel slower than the user’s brain. Never rush the eye.

---

## Visual Language

### Layout

| Token | Value |
|-------|--------|
| Grid | 8pt |
| Max content width | 1200px |
| Readable content | 760px |
| Card padding | 24–32px |
| Card gap | 24px |
| Vertical rhythm | **8 / 16 / 24 / 32 / 48 / 64 only** |

### Typography

**Font:** Sora (UI) · Fraunces (display moments)  
**Weights:** Regular · Medium · Semibold · Bold — no Light, no Black.

| Role | Size | Color |
|------|------|--------|
| Headline | 28–48 | `#1B2230` |
| Body | 16 | `#525866` |
| Secondary | 14 | `#6B7280` |
| Caption | 12 | `#8A9099` |

### Color — LEKKI Visual Language v2

**Gold is the only brand color.** Everything else stays neutral.  
90% warm neutrals. Gold only for logo, primary actions, progress, confirmations.

Personality: warm · calm · human · premium · confident · effortless.  
Not luxury · not corporate · not fintech. Golden hour light.

| Role | Value |
|------|--------|
| Brand Gold | `#D7A14A` |
| Gold hover | `#C98F33` |
| Gold light | `#E8C178` |
| Gold dark | `#A96F20` |
| Warm white (app bg) | `#FAF7F2` |
| Surface / cards | `#FFFFFF` |
| Secondary surface | `#F4EFE8` |
| Primary text | `#1B2230` |
| Secondary text | `#6B7280` |
| Muted text | `#8F96A3` |
| Border | `#E7E2DB` |
| Card border | `#EEE7DE` |
| Success | `#4F8A6B` |
| Warning | `#D9A441` |
| Error | `#C65B52` |
| Info | `#4F7DAF` |
| Warm shadow | `0 10px 30px rgba(45,30,15,.08)` |

Hero gradient: `#FAF7F2` → `#F2E4CF`. Gold accent: `#E8C178` → `#D7A14A`.

Studio uses the **same palette** (never dark). Operate only increases density.

Code: `apps/web/src/styles/_tokens.scss`

### Buttons

Exactly **one** filled button.

| Kind | Example |
|------|---------|
| Filled | Continue |
| Outline or text | Cancel · Back · Learn more |

Never three competing actions: `Cancel · Continue · Save`.

### Icons

Google-style · simple · rounded · never decorative. Every icon answers a question.

### Motion

See **[LEOS Motion System](leos-motion-system.md)** (Frozen) for full spec.

Everything moves like light: fade · flow · rise · settle.  
Never bounce · pop · shake · spin.

| Pattern | Spec |
|---------|------|
| Appear | 280ms fade + rise |
| Micro | 160–220ms |
| Success / QR | 360ms settle |
| Waiting | Soft gold pulse |
| Dialog | Fade |

Nothing spins forever.

---

## Surface character

| Surface / mode | Feels like | Not |
|----------------|------------|-----|
| **Experience** | Apple Wallet · Uber Eats · Airbnb · Maps place — hospitality | Software / admin |
| **Studio · Setup** | Stripe · Google Admin · Linear — guided product | WordPress · Jira · Azure · feature grid |
| **Studio · Operate** | Same warm Studio — denser, purposeful | Dark dashboards · charts |
| **Studio · Grow** | Calm Workspace cards · large numbers | Enterprise BI · “Insights” product |

### Studio Setup tokens (Design System v1)

| Token | Value |
|-------|--------|
| Outer padding | 48px |
| Section spacing | 40px |
| Card padding | 32px |
| Between controls | 20px |
| Between labels | 8px |
| Studio column | 640px max |
| Live Experience | 420px |
| Soft shadow | `0 1px 3px rgba(45,30,15,.08)` |
| Device shadow | `0 4px 12px rgba(45,30,15,.1)` |
| Motion | 200–250ms ease-out |

Code: `--studio-pad-outer`, `--studio-studio-width`, `--studio-live-width`, etc. in `_studio.scss`.

---

### Studio (one product · three modes)

When someone opens Studio they should think: **“I know exactly what I need to do.”**

**Studio Design System v1 (Frozen):** [studio-design-system.md](studio-design-system.md) — six principles · page anatomy · phone-on-desk Live Experience · Calm by Default · never-list.

Opens on **status**, not navigation:

```text
Good morning.
Restaurant is live.

Today · Guests waiting · Kitchen healthy · Payments healthy

[ Continue operating ]
```

Setup · Operate · Grow change density and tools. They are **not** separate products.

Experience Preview = capability toggles → live guest projection. Never a builder.

### Experience

Studio creates confidence. Experience creates **hospitality**.

More warmth · slightly larger cards · more imagery · friendlier copy · less chrome.  
Never feels like software.

### Operate

**Feeling:** Everything is under control.  
One glance · one tap · one decision. Place · status · next action.  
No widgets · no reports · no cards-in-cards. Spec: [operate-craft.md](operate-craft.md).

### Grow

**Feeling:** A trusted manager told me the truth.  
Greeting · few human numbers · one suggestion. Not Excel. Spec: [grow-craft.md](grow-craft.md).

### Payments (Setup)

Stripe Checkout feel — Connect & Forget. Large amount · clear next action · nothing technical for guests.  
**Setup v1 frozen** — [hospitality-phase.md](hospitality-phase.md).

---

## Human Confidence Rules

Every screen answers:

1. Where am I?  
2. What is happening?  
3. What should I do?  
4. Can I trust this?  
5. What happens next?  

If one answer is missing — the screen is incomplete.

---

## Visual Smells (reject)

- Boxed dashboards · multiple nav bars · feature grids  
- Heavy shadows · gradients everywhere · “Coming Soon”  
- Walls of buttons · long forms · tables before tasks  
- Engineering / platform / capability / profile / runtime language  

---

## Reference quality

Don’t copy. Aim for emotional quality.

| Studio | Experience | Operate |
|--------|------------|---------|
| Google Workspace · Stripe · Linear · Notion | Apple Wallet · Uber Eats · Airbnb · Maps | Toast · Square · Shopify POS |

---

## Applied craft tips (uxpeak-aligned)

**Source inspiration:** [uxpeak+](https://www.uxpeak.com/) · [@uxpeak on YouTube](https://www.youtube.com/@uxpeak) · [UI/UX Playbook](https://www.uxpeak.com/the-ui-ux-playbook) · [platform.uxpeak.com](https://platform.uxpeak.com)  
**Role here:** Practical craft rules that make LEK-040 confidence feel inevitable in UI. Not a third design system — apply inside LVES tokens and LEK-028 parts.  
**Policy:** Steal the *reasoning*, express it in LEOS language. Do not paste stock patterns or device mockups into Guest/Studio.

uxpeak+ teaches senior product craft through real app teardowns, before/after redesigns, and outcome lenses: **clear UI**, **loved UX**, **retention**, **conversion**, and **taste over AI quantity**. Map those lenses to LEOS moments of confidence.

### Outcome lenses → LEOS

| uxpeak+ focus | LEOS moment | Build for |
|---------------|-------------|-----------|
| Clear UI (spacing · hierarchy · contrast · copy · micro-interaction) | Every screen | Scan in one glance; one accent; typography over chrome |
| Loved UX (remove friction · natural flows) | Entry · Join · Menu · Cart | Expose value; fewer taps to intent |
| Retention (onboarding · empty · reactivation) | Empty · Returning guest · Leave | Empty states teach and invite; never dead-end |
| Conversion (product · forms · checkout) | Payment · Go Live · Configure | Confidence to commit; show status, don’t only tell it |
| Taste over AI volume | Experience Review gate | Prefer the version humans trust — not the busiest |

### Interaction cost

Hide nothing valuable behind a banner or extra hop when the user already arrived with intent.

| Reject | Prefer |
|--------|--------|
| “Discover 100+ recipes” splash before content | Menu / catalogue visible immediately after Join |
| Tap-to-reveal primary list | Curated items + clear primary CTA in thumb zone |
| Blank search with zero guidance | Recent · popular · pack-aware suggestions under search |

**LEOS:** Entry and Browse must deliver value in the first viewport. Interaction cost is anxiety.

### Meet people where they are

One generic home for every guest/operator is a miss. Adapt density and copy to journey stage — same shell, different confidence.

| Stage | Experience | Studio |
|-------|------------|--------|
| First time | Welcome · reassure place · one join action | Setup guide · few decisions · preview of live |
| Returning | Welcome back · resume cart / live order | Status first · Continue operating |
| Deeply engaged | Live progress · payment confidence · receipt | Operate density · Grow calm numbers |

Never show Setup chrome to guests. Never show first-run onboarding to someone already live.

### Empty states are opportunities

A bare “No projects / No items” is a roadblock. Every empty state must: explain · invite · offer **one** primary action (LEK-028 Empty is incomplete without this).

| Reject | Prefer |
|--------|--------|
| “You have no orders.” | “Nothing brewing yet — browse the menu when you’re ready.” + **Browse menu** |
| Empty cart with no CTA | Soft invite + **Add something** |
| Blank Operate board | “Kitchen is quiet — you’re ready when guests arrive.” |

### Show status — don’t only tell it

Post-commit uncertainty (order live · payment pending · go-live) is where confidence breaks. Prefer visual timelines, human courier/staff cues when relevant, and prioritised stages over dumped timestamps.

| Reject | Prefer |
|--------|--------|
| Flat date list for order stages | Status timeline with current step emphasised |
| “Payment processing…” only | Amount · method · pending/success surface + recover path |
| Data dump of fulfilment rows | Progress guidance + what happens next |

Aligns with **Visible Progress** and **Reduce Anxiety** (LEK-040).

### Mobile thumb zone

Experience is phone-first. Primary actions live where the thumb rests (lower half / sticky footer). Stretch-to-reach CTAs fail under pressure.

| Prefer | Avoid |
|--------|--------|
| Sticky primary CTA in footer (`leos-btn--primary`) | Primary only in top-right header on mobile |
| Bottom sheet / sheet actions for Operate | Critical controls only in unreachable corners |

### Cards, lists, and category rhythm

Selectable cards beat bland text lists when options need comparison (venue seeds, menu categories, Studio choose-experience). Keep brand cohesion: unified imagery style, soft solid backgrounds, scannable rhythm — not mismatched stock photo tiles or busy overlays that kill contrast.

Labels **above** inputs (not left) on Guest forms. Password / sensitive fields: reveal control. Selector grammar: radio = one · checkbox = many · toggle = on/off only.

### Visual cues & hierarchy

Icons, weight, size, and imagery make critical content pop — they are not decoration. Headings darker/bolder than body; WCAG AA minimum. Text on imagery needs overlay or blur that survives light *and* dark photos. Shadows tint toward the surface colour (warm sand / emerald soft) — not pure grey on coloured grounds.

Button order (LTR): cancel/secondary **left**, destructive or progressive primary **right** so the eye ends on the commit action.

### Input method matches the moment

| Moment | Control |
|--------|---------|
| One-time setup, known range (e.g. party size) | Stepper · soft bounded control |
| Frequent precise entry (qty, amount, tips) | Number field · quantity stepper — not fiddly sliders |
| Single vs multi choice | Radio vs checkbox — never invent a third grammar |

### Craft smells (add to Visual Smells)

- Dead-end empty states  
- Value hidden behind an extra tap  
- Same first-run UI for returning humans  
- Primary CTA outside thumb zone on Guest  
- Status told only in prose with no visual stage  
- Mixed icon styles · grey shadows on warm surfaces · text on photos without overlay  

### Freeze check (with Experience Review)

Understandable · Obvious · Calm · Trustworthy · Reusable — **and**:

1. Did we reduce interaction cost?  
2. Does the empty/error/offline state teach the next step?  
3. Can a one-handed guest hit the primary action?  
4. Is progress *shown*, not only labelled?

---

## Separation

| Artifact | Question |
|----------|----------|
| LEK-040 | How should LEOS **feel**? |
| **LVES 2.0** | How should that feeling look **inevitable**? |
| LEK-028 | What **parts** build it? |
