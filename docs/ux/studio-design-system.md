# LEOS Studio Design System v1

**Status: Frozen**  
**Owns:** How LEOS Studio should **feel** — layout · spacing · hierarchy · motion · typography · visual language · interaction philosophy  
**Full constitution (screens · copy · a11y · components):** [LEOS-Studio-Design-Blueprint.md](LEOS-Studio-Design-Blueprint.md)  
**Complements:** [LVES](lves.md) (look tokens) · [LEK-040](../LEK-040-human-experience-engineering.md) (feel) · [live-experience.md](live-experience.md) · [LEK-028](../LEK-028-component-catalogue.md) (parts)  
**Code:** `apps/web/src/styles/_studio.scss` · Setup Engine host · Live Experience panel  
**Change policy:** Principles and anatomy frozen. Density may refine; dual-renderer / dashboard / builder patterns require ADR.

---

## Inspiration (not imitation)

| Weight | Reference | Borrow |
|--------|-----------|--------|
| 70% | Shopify Admin | Calm onboarding · step progression · breathing room · editable feel |
| 20% | Airbnb Host | Live guest mindset · configure → see outcome · human language · hospitality |
| 10% | Material 3 philosophy | Whitespace · typography · simplicity — not Material components |
| Tertiary | Stripe | Hierarchy · spacing · premium feel — not developer language or dark gradients |

**Mobbin meta-rule:** The best products make one decision at a time, show the consequence immediately, and never make the interface feel heavier than the task.

---

## Seven design principles

1. **One question per page** — every Setup screen answers a single human question.  
2. **One primary action** — never compete for attention (one gold Continue).  
3. **Live Experience is always visible** — Never Ask a Human to Imagine.  
4. **Typography creates hierarchy** — whitespace over borders; labels over panels.  
5. **Hospitality before software** — preparing to welcome guests, not configuring enterprise.  
6. **Calm by Default** — nothing feels urgent unless it actually is.  
7. **Readiness over completion** — Studio never rewards “100% complete.” It rewards readiness: *You’re ready to welcome guests.* · *Everything is ready.*

**Product sentence:** *LEOS feels like a luxury hotel concierge disguised as software.* — [Hospitality Phase](hospitality-phase.md)

**Four pillars (judge every decision):** Confidence · Calm · Hospitality · Continuity.

### Calm by Default

| Prefer | Avoid |
|--------|--------|
| Continue · Saved automatically · Looks good | Save · Publish · Apply · Configure |
| Your order is being prepared | Processing… · Waiting… · Loading… |

### Readiness over completion

| Prefer | Avoid |
|--------|--------|
| You’re ready to welcome guests | 100% Complete · Setup progress 4/5 |
| Everything is ready | Checklist density · badge farming |
| Good morning. Blue Door is live. | Dashboard widgets · chart grids |

Motion: [leos-motion-system.md](leos-motion-system.md) (Frozen).

---

## Never (boundary)

**LEOS Studio is never:** a dashboard · a form builder · a website builder · a CMS · an enterprise admin panel · a canvas editor · a drag-and-drop designer.

**LEOS Studio is:** a guide that helps businesses create confident experiences · a place where every change is immediately visible · a calm workspace for hospitality.

---

## Page anatomy (every Setup page)

```text
Question                          (human title)
Why-sentence                      (one line — why you're here)
────────────────
Configuration card                (soft · white · 32px pad)
────────────────
Confidence block                  (frozen component)
────────────────
Back                    Continue  (one gold primary)
```

### Why-sentence (frozen)

| Step (UI) | Why-sentence |
|-----------|--------------|
| Who you are | Guests will recognise your business. |
| What guests experience | Guests will choose what you’d like to offer. |
| Where guests join | Guests will know exactly where they are. |
| How guests pay | Guests can pay with confidence. |
| Go Live | You’re ready to welcome your first guest. |

### Confidence block

Same component every page — guest confidence, not checklist completion.

```text
✓ Looks good
Guests will join
Blue Door Restaurant
Terrace · Table 12
```

### UI language (routes stay engineering)

| Route slug | UI label |
|------------|----------|
| `identity` | Who you are |
| `experience` | What guests experience |
| `places` | Where guests join |
| `payments` | How guests pay |
| `golive` | Go Live |

Never expose Identity / Experience / Places / Payments as product nouns in nav or titles.

---

## Layout chrome (never changes)

```text
┌─ LEKKI ──────────────────────── Live Experience ● ─┐
│ Studio (640)                 │   phone on desk     │
│ progress story               │   (not a card)      │
│ Question + why-sentence      │                     │
│ Configuration card           │                     │
│ Confidence block             │                     │
├──────────────────────────────┴─────────────────────┤
│ Back                                 Continue      │
└────────────────────────────────────────────────────┘
```

- Left content changes only; right is always the Experience.  
- No traditional Setup sidebar — progress story with typography + quiet separators.  
- Mode switcher quiet in top chrome — not a heavy left rail during Setup.

### Live Experience — phone on the desk

- Feels like someone placed a phone on the desk — **not** another Studio card.  
- Breathing room · very soft shadow · rounded hardware.  
- No browser chrome · no fake toolbar · no second interface.  
- Same Experience Shell guests use after Go Live.  
- Updates: fade / slide / morph (200–250ms ease-out) — never hard replace.

### Tokens

| Token | Value |
|-------|--------|
| Outer padding | 48px |
| Section spacing | 40px |
| Card padding | 32px |
| Between controls | 20px |
| Between labels | 8px |
| Studio column | 640px max |
| Live Experience | 420px |
| Shadows | `0 1px 3px` / `0 4px 12px` |
| Motion | 200–250ms, ease-out |

Colour: LEKKI v2 (cream · white · charcoal · gold · soft green). Never harsh black. One gold filled button.

---

## Signature moments

| Moment | Signature |
|--------|-----------|
| Welcome | “Let’s get your experience ready.” |
| Who you are | Venue name appears live in the phone |
| What guests experience | Menu / options come alive in the phone |
| Where guests join | Selecting a place immediately changes arrival |
| How guests pay | Payment options appear in the phone instantly |
| Go Live | QR with subtle celebration — same experience, now public |

---

## Language

Never: Configure capability · Resolve context · Setup connector · Publish profile.  
Always: Restaurant Name · Guests will choose… · Guests will join… · Guests will pay… · You’re live.

---

*Software is the documentation.*  
**Studio Setup v1 is COMPLETE and FROZEN** — do not redesign.  
Operate · Grow craft: [operate-craft.md](operate-craft.md) · [grow-craft.md](grow-craft.md) · [hospitality-phase.md](hospitality-phase.md).  
Operate/Grow may increase density without violating Calm by Default, Never-list, or the four pillars.
