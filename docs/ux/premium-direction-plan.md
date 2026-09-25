# Leo Studio — the premium pass

Research and plan, 15 September 2026. Ground is `#00070d`; the card is
`rgba(255,255,255,.9)` + `blur(8px)`, compositing to ~`#e6e6e7`.

---

## The thesis, in one line

> **Soft where nothing is decided. Hard where something is.**

That single rule resolves all three tensions in the brief, and it is not a
compromise — it is what the evidence says the good version of this looks like.

---

## Why neumorphism is right here, and exactly how far it goes

Neumorphism died in 2021 for one reason: people applied it to the things you
click. Webflow's retrospective is blunt — "buttons blend into the background and
fonts become illegible", there is "no clear organization or direction showing
what should be interacted with first". Its recommended survival form is precise:
**sparingly, on cards and framing elements, never on functional elements.**

Axess Lab gives the numbers: text 4.5:1, and — this is the one that kills naive
neumorphism — **icons, borders and interface elements 3.0:1** under WCAG 1.4.11.
A soft shadow on a same-colour surface is typically 1.2–1.8:1. It cannot be a
control boundary. Ever.

So:

| Layer | Treatment | Why |
|---|---|---|
| Ground | `#00070d` + a warm halo | Nothing is decided here |
| Card | Glass, soft-embossed edge, halo bloom | Nothing is decided here |
| Panel / strip / callout | Neumorphic inset or raise | Nothing is decided here |
| Row (idle) | Soft raise, hairline ≥3:1 | Carries a decision — boundary must be visible |
| **Field** | Hard border `#d8d2c9`, inset | Carries a decision |
| **Button** | **Solid black, 15:1** | Carries a decision |
| Status, rings, text | Ink ramp, AA-compliant | Carries meaning |

**Your black buttons are not a separate request — they are the thing that makes
the neumorphism legal.** Black on `#e6e6e7` is ~15.4:1. Soft surfaces, hard
actions. One system.

---

## The collision worth deciding: what happens to gold

LVES 2.0's core rule is that `#d7a14a` is action-only and rationed. Black
buttons take that job. Two ways out:

**(a) Gold retires to brand/accent.** It appears in the logo, the swatch, maybe a
focus ring. The ration rule loses its teeth because gold no longer means
anything specific.

**(b) Gold becomes the peak.** Black is every action in the product. Gold appears
**exactly once in the entire setup journey** — on `Open for guests`, the
irreversible one. Nowhere else. Not on Save, not on Add, not on Connect.

**Recommend (b), strongly.** It turns the ration from a style rule into a
narrative one: the owner sees gold once, at the moment the doors open, and never
again until they open a second venue. That is the peak-end rule expressed in
colour rather than animation — and it makes the confirm sheet's button the most
loaded pixel in the product precisely because nothing else looks like it.

It also means the gold is *earned*. Today it is on nine buttons and means
"button". Then it is on one and means "this is the moment".

---

## What premium actually looks like, from the references

Six dark premium interfaces, and they agree with each other more than they
agree with any trend deck:

- **Grok** — near-black card, a barely-there nebula gradient at the top edge,
  three inner panels at a half-step lighter, hairlines at very low alpha, and
  **one white pill button**, bottom-right. Enormous negative space.
- **Krea AI** — dark ground, **one white pill** (`Generate`), one blue secondary,
  everything else chrome-free.
- **Fey** — pure black, a single glowing object, nothing else on the screen.
- **Weavy**, **Sora**, **Gamma** — same register: dark, hairline, one solid
  action.

Two things none of them do: **use neumorphism**, and **use more than one strong
button per screen.** The first is our differentiator — used correctly, on the
passive layer, it is a texture nobody else in this category has. The second is a
rule we already have from the bar and should not lose.

---

## Cognitive load: where the decoration is allowed to live

"Declare war on cognitive load" and "neumorphism + halo + micro-interactions"
pull against each other unless you separate the layers, which is the same
separation as above. Concretely:

- The **halo** sits behind the card, not on it. It is atmosphere, never an edge.
- The **emboss** sits on surfaces, never on a control boundary.
- Every screen keeps **one** primary action. Neumorphism does not buy a second.
- Icons keep labels. Axess Lab is explicit and so is the current design.
- Nothing decorative may be the only carrier of state. Ring + word + group, as
  the component sheet already has it.

The measure of success is not that it looks rich. It is that an owner can name
the one thing to do next in under two seconds, on a screen that happens to look
expensive.

---

## Micro-interactions: a hunt list, and a ration

Apple's discipline is not that everything moves — it is that **the moment
moves and the rest is still.** Peak-end says spend the budget at the peak
(confirm → open) and the end (the QR). So most of this list is deliberately
small, and two items are allowed to be beautiful.

**The two that get the budget**

1. **Gate ring fills.** When a condition is met, the ring draws its check —
   stroke-dashoffset over 420ms on the settle ease, ring colour crossfading to
   success. This is the smallest possible "you did it" and it happens three
   times per setup.
2. **The confirm sheet arrives.** Backdrop dims over 200ms; the card rises 12px
   and settles; the three clauses stagger in 60ms apart. The gold button is the
   last thing to arrive. This is the peak; it is allowed to be theatre.

**The quiet ones**

3. **Row press.** The neumorphic raise inverts to an inset over 120ms. This is
   the emboss earning its keep — press becomes physically legible rather than a
   colour change.
4. **Field focus.** Existing gold ring at `.18` alpha, plus the label shifting
   to ink over 120ms. Nothing else.
5. **Summary strip assembly.** On the first load after go-live, the three gate
   rows collapse into the one-line strip. Once, ever. Then it is static.
6. **QR reveal.** Already specified: `--studio-duration-settle`, 360ms.
7. **Halo bloom.** The glow behind the card rises from 0 to full over 600ms on
   first paint, then never moves again.
8. **The waiting line.** "Waiting for PayFast to reach us" gets a slow pulse —
   the one place in the product where the wait is genuinely uncertain and the
   user needs to know we are still listening.

**Forbidden**

Hover-lift on everything. Any loop that outlives its cause. Parallax. Confetti,
badges and bounce — the bar already bans all three. Motion that carries state no
static rendering carries. And every item above collapses to opacity-only, or to
nothing, under `prefers-reduced-motion`.

---

## The first impression, as a design target

Right now an owner's first 400ms in Leo Studio is a wizard step on an off-white
slab. Under this direction it is: a near-black field, a warm halo blooming
behind a glass card, the venue name in Fraunces, and one black button. Nothing
else arrives until that has landed.

That is worth naming as a target because it is the *halo effect* in the
cognitive sense — the first impression colours the judgement of everything
after, which is the actual argument for doing this work at all.

---

## Three directions to choose between

Prose cannot settle "premium". Three artboards, same content, same rule,
different reading of it — on the canvas, page **Direction**:

**A · Ash** — today's light glass card, neumorphic rows and panels, black pill
buttons, warm halo. Closest to what exists; lowest risk; least distinctive.

**B · Obsidian** — inverts the card to near-black on the near-black ground,
hairlines at `rgba(255,255,255,.08)`, near-white text, one white pill. This is
the Grok/Krea/Fey register — the most obviously premium, and the furthest from
"Surgical White". It would mean LVES 2.0 gets a dark mode after saying it never
would.

**C · Vellum** — a warm off-white slab with real emboss depth, black buttons,
gold only at the peak. The most tactile and the most differentiated; the highest
accessibility maintenance cost, because every emboss has to be checked against
the 3:1 rule rather than inheriting it.

My lean is **A for the product, B for the sign-in and the go-live moment** —
soft and calm where work happens, dark and cinematic at the two edges. That is
peak-end applied to the visual register itself rather than just to motion. But
this is a taste call and it is yours.

---

## What I need from you

1. Which direction — A, B, C, or the A/B split.
2. Gold: option (b), the peak, or something else.
3. Whether LVES 2.0 is allowed to gain a dark register. B and the A/B split both
   require it, and the tokens currently say "never dark mode" out loud.
