# Craft — First-impression doors

**Status:** Shipped — evidence [continuity-first-impression.md](../../evidence/continuity-first-impression.md)  
**LEK-029:** Interaction states · peak-end · motion settle · acceptance  
**Platform Value:** Every first door of LEOS answers one human question with recognition, then competence — same dusk sky, same gold mark as lamp, no second landscape or cyan SaaS glow.  
**Human questions (one per door):** see § Doors  
**Pillar:** Confidence · Calm · Hospitality · Continuity  
**Surfaces:** Boot hills · Guest splash · Marketing landing · Studio sign-in · (end) venue arrival / Studio hub Live phone  
**Builds on:** [G-01-entry](../../stories/G-01-entry.md) · [guest-first-impression evidence](../../evidence/guest-first-impression.md) · [first-impression research](../../../.cursor/skills/design/tailwind-expert/references/first-impression.md) · [lekki-surfaces](../../../.cursor/skills/design/tailwind-expert/references/lekki-surfaces.md) · [LVES](../../lves.md) · [lifecycle map § Guest first impression](../../lifecycle-and-screen-map.md)  
**Not:** Pay / Orders / Place Identity (open-tab trio shipped) · Setup redesign · GAP-02/07 · Marketplace · Neo · new LEKs · Live≠preview · Lekki name on Guest after splash · Tailwind Preflight · `dark:` · runtime class construction

---

## Intent

G-01 already owns the **QR walk** (splash → venue landing → Get started → menu).  
This craft slice owns the **feel of the first seconds** across both human doors:

| Walk | Peak | End |
|------|------|-----|
| **A — Guest (QR)** | Gold mark lands on dusk — “I know what this is” | Venue colour · Lekki gone · one gold path into the night |
| **B — Operator (marketing → Studio)** | Sign-in halo from the mark — “this is the owner door” | Ash paper + **Live phone already running** — competence, not empty nav |

Kahneman peak-end: memory is the most intense second + the last second. Design those two; starve everything else.

---

## Uncertainty removed

- Boot flashing brand before atmosphere  
- Cyan / teal `lk-glow` competing with the gold mark (SaaS nebula)  
- Halo as a second logo or looping breath  
- Guest still seeing **Lekki.** after splash on venue chrome  
- Two primary CTAs screaming on landing or sign-in  
- Sign-in that feels like an admin login wall instead of a calm register  
- Studio land that dumps settings before the guest view is visible  
- Motion that celebrates itself (particles, infinite logo breathe, GSAP theatre)  
- A second dusk / second mark file / mixed Inter+Sora on the same first beat  

---

## Goals

| | |
|--|--|
| **User (Guest)** | Feel hosted in three breaths: sky → mark → *this venue*. |
| **User (Owner)** | Know Lekki is for their venue, then enter Studio without hunting. |
| **System** | One dusk continuum; Join during splash (unchanged); Live = real shell. |
| **Emotional** | Recognition → competence. Concierge calm, never dashboard. |

---

## Doors — one human question each

| Door | Human question | Allowed on screen | Gold count |
|------|----------------|-------------------|------------|
| **Boot** | *(none — atmosphere)* | Dusk hills only | Zero |
| **Guest splash** | Whose night is this? | Mark + **Lekki.** + *The human experience app.* | Mark is the lamp (not a pill) |
| **Marketing landing** | Is this for my venue? | One hero claim + one solid **Get started** | One lit pill |
| **Studio sign-in** | Can I get into Studio? | Mark · Email · PIN · **Continue** | One solid Continue |
| **End A — Venue arrival** | Am I in the right place? | Venue identity + **Get started** (owner look) | One gold — **no Lekki** |
| **End B — First Studio** | Am I live / what’s next? | Status + one action + **Live phone** | One register gold |

If copy, chrome, or motion does not serve that door’s question → load. Remove it.

---

## Journey A — Guest (QR)

```text
Boot hills (#boot-splash)
        │  same dusk · no mark
Guest splash (/splash)
        │  peak: mark flows 3s · halo from metal
        │  Join during splash (resolveEntry) — unchanged
Venue arrival (phase arrival)     ← end competence
        │  venue brand · place · Get started
Menu (browse)                     ← Lekki name gone
```

### Composition — Guest splash

```text
┌─────────────────────────────────────┐
│  Dusk hills (horizon canvas)        │
│                                     │
│         [ gold mark · 8rem ]        │  ← lamp: specular + wide bloom
│              Lekki.                 │
│   The human experience app.         │
│                                     │
│         (tap anywhere = skip)       │
└─────────────────────────────────────┘
```

### States — Guest splash

| State | Show | Primary / exit |
|-------|------|----------------|
| **S1 Boot handoff** | Hills already painted; splash mounts transparent over same sky | None |
| **S2 Peak flow** | Mark descends ~3s; copy fades as it lands; halo tied to mark | Tap → skip (immediate opacity out) |
| **S3 Hold** | Settled mark + copy; total ~4s (`GUEST_SPLASH_MAX_MS`) | Auto advance |
| **S4 Reduced motion** | Static mark + copy; no flow theatre | Same exits |
| **S5 Exit → arrival** | Session joined; navigate to venue landing | — |
| **S6 Return / still-in** | Short or skip landing per `splashWelcomeQuery` | No second Join wall |

### Micro-interactions (Guest entry only)

| Beat | Rule |
|------|------|
| Skip | Immediate opacity out — no bounce |
| Keyboard | `focus-visible` gold ring on splash surface |
| First menu card (after Get started) | Rise once ~280ms — not every row |
| Add press (later, out of craft scope detail) | `scale(0.98)` ~160ms when FE touches menu |

Kitchen ticket / pay peaks are **later** — not this slice.

---

## Journey B — Operator (Lekki → Studio)

```text
Boot hills
        │
Marketing landing (/)
        │  same dusk · Get started free (one solid)
Studio sign-in (/signin)
        │  peak: Obsidian + halo from mark · Continue
Studio hub                        ← end competence
        Live phone already running (real Guest shell)
```

### Composition — Landing hero

```text
┌─────────────────────────────────────┐
│  Nav: Lekki. · … · Login / Get started │  ← one visual primary = Get started
│  Dusk hills (website-horizon)         │
│                                       │
│  Chip · title · lead (one claim)      │
│  [ Get started free ]  ← gold pill    │
│                                       │
│  Hero stage: live-phone feel          │
│  Light = dusk + gold from join card   │
│  NOT teal lk-glow nebula              │
└─────────────────────────────────────┘
```

### Composition — Sign-in

```text
┌─────────────────────────────────────┐
│  Obsidian cinematic register          │
│  Halo blooms behind card (once)       │  ← origin = mark
│                                       │
│         [ mark ]                      │
│         Email                         │
│         PIN                           │
│         [ Continue ]  ← only solid    │
└─────────────────────────────────────┘
```

### States — Landing + Sign-in

| State | Show | Primary |
|-------|------|---------|
| **L1 Hero ready** | Dusk + claim + one solid CTA; Login quiet | Get started free |
| **L2 Prefetch warm** | `warmSignin()` on intent — no spinner logo | Same |
| **L3 Hero press** | Pill settle (`scale` / opacity) ~160ms | Navigate `/signin` |
| **S1 Sign-in idle** | Fields hairline; Continue solid | Continue |
| **S2 Field focus** | Focus ring; placeholders only (no extra labels) | — |
| **S3 Auth pending** | Continue disabled / quiet wait — not a Lekki spinner logo | — |
| **S4 Error** | Recover copy under field — **no shake** | Retry Continue |
| **S5 Success end** | ~220ms cross-fade into hub with Live phone visible | Hub peak action |

PIN: length is enough — no digit theatre. Halo: enter once; **never loop**. `prefers-contrast: more` → halo off.

---

## Halo — specification (interaction contract)

Reuse `.leos-register-halo` — do **not** invent a second system.

| Layer | Job | Technique |
|-------|-----|-----------|
| 0 Dusk | Place | Horizon / `#00070d` (`--leos-ground`) |
| 1 Wide bloom | Warmth | Radial gold · opacity ≤ 0.22 Ash / 0.16 Obsidian |
| 2 Specular | Metal | `drop-shadow` on the **mark only** (gold, 16–32px, low alpha) |
| 3 Card / stage | Resting surface | Existing emboss / glass — not a cyan plane |

**Halo = light from the gold mark**, not a cyan blob.  
GPU: opacity + transform only. No `box-shadow` animation. No `hue-rotate`.  
Landing `lk-glow` teal (`rgba(180, 220, 230)…`) is **off-spec** — first marketing bug to kill.

---

## Motion settle rules

| Rule | Value |
|------|-------|
| Ease | `cubic-bezier(0.22, 1, 0.36, 1)` (`ease-leos` / existing) |
| Splash flow | ~3s mark descend; total hold ~4s |
| Skip | Immediate fade — no overshoot |
| Halo enter | Once · ≤600ms opacity/scale — never loop |
| Auth → Studio | ~220ms cross-fade |
| Press | ~160ms settle on solid pills |
| Reduced motion | Static frames; keep meaning |
| Contrast more | Halo off |

**Do not:** GSAP on Guest/Studio entry · particle fields · infinite breathing logos · dark-mode toggle · extra onboarding steps so motion has a stage.

---

## Cognitive fluency

- Same mark files (`lekki-mark.png` splash · `lekki-mark.svg` sign-in · logo-64 marketing nav)  
- Wordmark **Lekki.** (period) · welcome line **The human experience app.**  
- Same dusk continuum: boot → landing hero → guest splash canvas → cinematic register ground  
- Type: Inter on marketing; Sora the moment product chrome starts — **one switch**, not a mix per first beat  
- Gold: **one** lit object per first screen (mark **or** primary pill, not both screaming)  
- Guests **never** see Lekki after splash — venue owns `--brand`  

---

## What NOT (this slice)

| Hold / out |
|------------|
| Pay confidence · Order-state calm · Place Identity (trio shipped — do not reopen) |
| Setup step order / sixth Setup step |
| GAP-02 · GAP-07 |
| Marketplace · Neo chatbot |
| New LEKs / new runtimes |
| Fake Studio “preview” (Live = real Guest shell) |
| Lekki chrome on joined Guest experience |
| Tailwind Preflight · `dark:` utilities · runtime-constructed class strings |
| Replacing LVES tokens with a marketing-kit palette |

---

## Accessibility

| Requirement | |
|-------------|--|
| Focus | Visible gold `focus-visible` rings on splash surface, fields, Continue, Get started |
| Motion | Honour `prefers-reduced-motion` — static mark + copy; no flow |
| Contrast | `prefers-contrast: more` kills decorative halo |
| Tap target | Splash skip = full surface; pills ≥ comfortable hit |
| Copy | Error is recover language, not blame or animation |

---

## Acceptance (Done when)

1. **Boot** shows hills only — no mark, no wordmark, no CTA.  
2. **Guest splash** peaks with gold mark as lamp (specular + bloom tied to mark); 4s / tap skip; reduced motion static.  
3. After splash, **no Lekki** name/mark on venue arrival or joined Guest chrome.  
4. **Landing** hero light is dusk + gold — **not** teal `lk-glow`. One solid primary (Get started); Login quieter.  
5. **Sign-in** halo originates from mark; enters once; Continue is the only solid control; errors do not shake.  
6. **Studio land** end shows **Live phone** (real shell) — not an empty settings grid as the remembered end.  
7. Same dusk geometry across boot · horizon · splash · cinematic register.  
8. Evidence walk: QR peak-end + marketing → sign-in → Live phone; `design-review` on screenshots (UX does not self-pass Craft).  
9. No Preflight · no `dark:` · no runtime class construction in the FE pass that implements this.

---

## Code seams (FE — do not invent new doors)

| Seam | Role |
|------|------|
| `apps/web/src/index.html` `#boot-splash` | Hills-only first paint |
| `apps/web/src/app/pages/website-horizon.component.ts` | Shared dusk ridges / sky |
| `apps/web/src/app/pages/guest-splash.page.ts` | Mark flow · skip · 4s · copy |
| `apps/web/src/app/studio/guest-entry-gate.ts` | `GUEST_SPLASH_MAX_MS` · `splashWelcomeQuery` |
| `apps/web/src/app/pages/website-home.page.ts` | Landing hero · kill `lk-glow` teal · Get started primary · `warmSignin()` |
| `apps/web/src/app/pages/studio-signin.page.ts` | Obsidian register · Continue · focus rings |
| `apps/web/src/styles/registers.css` `.leos-register-halo` | Halo layers (reuse) |
| `apps/web/src/styles.css` `@theme` | Aliases only · Preflight off |

Join / arrival decision stays in existing gate + venue arrival — **do not reopen E1 Continue → Join**.

---

## Handoffs

### UX Architect (tokens / geometry)

- Confirm dusk continuum numbers (ground `#00070d`, ridge steps, cluster `padding-top: 18vh`, mark ~8rem).  
- Halo opacity caps (Ash ≤0.22 · Obsidian ≤0.16) and specular drop-shadow on mark only.  
- Type switch boundary: Inter marketing → Sora product chrome.  
- Vertical rhythm 8pt; one gold primary per door; Warm Sand / Ash / Obsidian surfaces per LVES — **Tailwind expresses; LVES owns meaning**.

### Tailwind expert (utilities express)

- Express with complete utilities / existing `leos-*` / `@theme` aliases (`bg-action`, `ease-leos`, `duration-halo`, …).  
- **Preflight off** — do not import.  
- **No `dark:`** · **no runtime-constructed class strings**.  
- Prefer opacity + transform for halo/motion; do not animate `box-shadow`.  
- Do not collapse Guest gold / register action / peak / `--brand` into one colour.  
- Craft pass order when implementing: (1) landing `lk-glow` → dusk+gold (2) splash mark lamp (3) sign-in halo align + focus/press (4) verify Studio Live-phone end.

### Component Designer

- No new LEK-028 parts required if seams above suffice. If a named halo atom is missing from catalogue, ask via Question — **do not invent LEKs in this file**.

### Product Reviewer

- Freeze gate after FE + evidence + screenshot craft review. UX Lead does **not** self-approve.

---

## HOLD

Pay · Orders · Place Identity · Setup · GAP-02/07 · Marketplace · Neo · staff shift depth · catalogue · dead pages (already owned elsewhere).
