# First impression — research and plan (not a build ticket)

Psychology first (LEK-040). Visual second. Tailwind is how we express it, not the product.

## What “Apple-beautiful” actually is

Apple’s halo is **directional light on a material**, not a glow GIF.

- One object in focus. Everything else recedes.
- Motion explains physics (weight, settle), never celebrates itself.
- The peak is recognition (“I know what this is”); the end is competence (“I already did the next thing”).
- Cognitive fluency: same materials, same type rhythm, zero modes to learn on entry.

Kahneman **peak-end**: memory of the visit is the most intense second + the last second. We design those two, then starve everything else.

Norman **gulf of execution**: the control that looks primary must be the only way forward.

## War on cognitive load — entry contracts

Every first screen answers **one** question:

| Door | Human question | Allowed on screen |
|------|----------------|-------------------|
| Boot | (none — atmosphere) | Dusk hills |
| Guest splash | Whose night is this? | Mark + Lekki. + The human experience app. |
| Guest menu | What’s for the table? | Venue identity + one gold add |
| Landing | Is this for my venue? | One hero claim + Get started |
| Sign-in | Can I get into Studio? | Email · PIN · Continue |
| First Studio | Am I live / what’s next? | Status + one action + Live phone |

If copy, chrome, or motion does not serve that question, it is load. Remove it.

## Two journeys (peak / end)

### A — Guest (QR)

1. **Boot** — hills. No brand flash. Continuity with splash sky.
2. **Peak** — gold mark flows 3s from the top of the dusk; copy fades as it lands. The mark is the lamp: a **tight gold drop-shadow** + a **wide, faint bloom** that scales with the mark, not a page-wide cyan wash.
3. **Hold** — 4s total. Tap skips. Reduced motion: static mark + copy.
4. **End** — first live menu in the **venue’s** colour. Lekki name gone. If the guest has to hunt for “add”, the end failed.

Micro-interactions to hunt (Guest):

- Skip: immediate opacity out (already); no extra bounce.
- Keyboard: `focus-visible` gold ring on the splash surface.
- First menu card: rise 280ms once — not every row.
- Add press `scale(0.98)` 160ms.
- Kitchen ticket / pay later: those are **later peaks**, not entry.

### B — Operator (Lekki → Studio)

1. **Landing hero** — same dusk. Hero product card should feel like the **live phone**, not a teal dashboard mock. Replace `lk-glow` cyan with dusk + gold halo from the join card.
2. **Get started** — pill, one primary. `warmSignin()` already; keep prefetch, add press settle.
3. **Peak (sign-in)** — Obsidian ground, halo **blooms behind the card** (exists, 600ms). Strengthen: halo origin aligned to the **mark**, slightly stronger near metal, never a second competing gradient. Fields: hairline → focus ring, no extra labels (placeholders already). Continue is the only solid control.
4. **End** — first Studio frame is **Ash paper + Live phone already running**. Not an empty nav grid. The remembered end is “the guest view is already here.”

Micro-interactions to hunt (Studio entry):

- Nav Login vs Get started: same destination, different weight — keep one visual primary.
- Field focus-visible ring; error is recover copy, not a shake.
- PIN: no digit theatre; length is enough.
- Halo: enter once; **never loop**. Contrast mode: off.
- After auth: 220ms cross-fade into hub, not a spinner logo.

## Halo — specification (when we build)

Reuse `.leos-register-halo`, do not invent a second system.

| Layer | Job | Technique |
|-------|-----|-----------|
| 0 Dusk | Place | Horizon / `#00070d` |
| 1 Wide bloom | Warmth | Existing radial gold, opacity ≤ 0.22 Ash / 0.16 Obsidian |
| 2 Specular | Metal | `drop-shadow` on the mark only (gold, 16–32px, low alpha) |
| 3 Card | Resting surface | Emboss / glass already in registers |

GPU: opacity + transform. No `box-shadow` animation. No `hue-rotate`.

Landing `lk-glow` is **off-spec** (teal). Treat as the first halo bug on marketing.

## Cognitive fluency checklist

- Same mark file, same period in **Lekki.**
- Same ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- Inter on marketing, Sora the moment Studio/Guest product chrome starts — one switch, not a mix per screen.
- Gold count: **one** lit object per first screen (mark **or** primary pill, not both screaming).
- No “Welcome to our ecosystem” paragraphs on entry.

## What we will not do

GSAP on Guest/Studio. Particle fields. Infinite breathing logos. Dark-mode toggle. A Tailwind marketing kit palette. Extra onboarding steps so the motion has a stage.

## Build order (when asked to implement)

1. Fix landing `lk-glow` → dusk + gold (marketing, biggest lie).
2. Guest splash: drop-shadow on mark + optional bloom tied to `.gs__logo` (product, peak).
3. Sign-in: align halo to mark; focus-visible rings; press on Continue.
4. Studio land: verify Live phone is the end, not a settings dump.
5. `design-review` on screenshots — this skill does not self-pass Craft.
