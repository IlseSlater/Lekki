# Craft — Mid-visit “You’re still in” (atmosphere)

**Status:** Implemented — Guest atmosphere Continuity (FE)  
**Platform Value:** Guest mid-visit feels hosted, not operated — place + order confidence without a second Join.  
**Human question:** Am I still in — and is everything okay?  
**Pillar:** Continuity · Confidence · Calm · Hospitality  
**Surfaces:** Existing Guest shell (`guest.page` · `leos-experience-screen` · context banner · Live phase)  
**Builds on:** [continuity-mid-visit-resume.md](continuity-mid-visit-resume.md) (copy/branch shipped)  
**Not:** New screen · Marketplace · Neo · Setup · dashboard timeline · card walls · purple AI chrome

---

## Intent

Continuity already answers **“You’re still in.”**  
This sketch answers **how that moment looks and breathes** so first viewport reads as a concierge welcome, not a status panel.

## Mobbin — sweetgreen (steal / leave)

Reference set: [sweetgreen iOS screens](https://mobbin.com/apps/sweetgreen-ios-70fc696e-52bb-4f08-ac5f-4d34c7efb6bd/9cab9dce-bcf5-42a8-b4fc-13e4111e91df/screens)

| Steal for LEOS Guest | Leave (not Guest) |
|----------------------|-------------------|
| Cream/Warm Sand field — not pure white card walls | Rewards / points / gift tabs |
| Place as spoken header (“Pickup from…” → **Table 12**) | Delivery maps + courier tracking |
| Food as hero — large photo, soft lift, airy rows | Dense tip grids + promo codes |
| Category as calm chips (one selected) | 5-tab consumer app chrome |
| Serif/display for human moment · sans for price/meta | Loyalty banners competing with status |
| One solid primary at bottom when action exists | Underlined editable “Delivery / home” as our pattern — we use place confidence, not commerce toggles |
| Ingredient / item calm: title → short line → quiet price | Hex brand crop as a new LEOS shape (optional later; not required) |

LVES map: their forest green → our Emerald whisper / Ready only; their primary green CTA → our **Gold** `#D7A14A` when Guest must act.

## Composition story (one breath)

```text
Atmosphere (Warm Sand · quiet depth)
        │
   Place confidence (where I am — spoken, not stamped)
        │
   Human greeting (You’re still in · Fraunces)
        │
   One calm status line (order / visit — prose, not badges)
        │
   One gold primary (only if action needed)
```

## First viewport (mid-visit → Live or current phase)

```text
┌─────────────────────────────────────┐
│  Warm Sand field (sweetgreen cream) │
│  soft radial / venue-tint — no chips │
│                                     │
│  Table 12                           │  ← place spoken (sg location line)
│                                     │
│  You’re still in, Alex.             │  ← Fraunces (sg checkout serif beat)
│  Your visit is right where you      │  ← Sora muted ≤2 lines
│  left it.                           │
│                                     │
│  Preparing — we’ll let you know     │  ← one prose status
│  when it’s ready.                   │     (sg timeline: quiet nodes OK;
│                                     │      no courier map on Guest)
│                                     │
│  [featured dish photo · soft lift]  │  ← browse: food as hero (sg bowls)
│   Dish name                         │
│   Short line · quiet price          │
│                                     │
│         [ Pay when ready ]          │  ← gold = their solid primary
│                                     │
│  ····· tab dock ·····               │
└─────────────────────────────────────┘
```

## Hierarchy rules (craft, not features)

| Layer | Role | Token / motion |
|-------|------|----------------|
| Place | First confidence | Fraunces ~1.5–1.75rem · charcoal · no pill chrome |
| Purpose | Human breath | Fraunces · “You’re still in…” / phase purpose |
| Lead | Quiet reassurance | Sora · ink-muted · max ~2 lines |
| Status | One sentence | Emerald soft only if Ready · else charcoal prose |
| Primary | One gold | `#D7A14A` · 12px radius · appear 220ms rise |
| Shell | Calm field | Warm Sand `#FAF7F2` · avoid stacking white cards on sand |

## States

| ID | When | What changes |
|----|------|--------------|
| **S1 Still-in land** | Mid-visit resume banner | Short splash → place + “You’re still in” → fade lead ~4.5s |
| **S2 Live calm** | Fulfilment in progress | Prose status · timeline not a board |
| **S3 Ready** | Ready for guest | Emerald whisper + gold if Pay · purpose “Ready for you” |
| **S4 Action needed** | Balance due / assist | One gold CTA · never two competing primaries |

## Motion (LVES)

| Beat | Duration | Feel |
|------|----------|------|
| Splash settle → shell | 160ms fade | Continuity, not a cut |
| Purpose / place rise | 220ms ease-out | Hosted arrival |
| Status line update | 280ms crossfade | Calm progress |
| Gold CTA appear | 220ms rise | Only when action exists |

Respect `prefers-reduced-motion`: opacity only, no scale.

## Uncertainty removed

- “Am I in a tool / CRM?” → place spoken as hospitality  
- “Did I lose my visit?” → still-in purpose + quiet lead  
- “Do I need to do something?” → gold only when yes  

## Accessibility

- Place + purpose: one `h1` / clear landmark; place may be eyebrow or paired strong line — not duplicate live regions  
- Status: polite `aria-live` on change only  
- Contrast: charcoal on Warm Sand; gold CTA with white label  

## Done when (craft)

1. Mid-visit first viewport reads place → greeting → one status → optional gold — without search/filter chrome competing  
2. No new cards, tabs, or BI strips  
3. FE maps to existing phases / `composeStillInBanner` — atmosphere only  

---

## Browse density Continuity (post-ship craft)

**Verdict:** ~2.5 catalogue rows at scroll-top on phone is an **HCI failure for browse**, not a Continuity lie about place. Place confidence still works; the failure is CX — Guest cannot scan a real catalogue, so “hosted” reads as empty / slow / unfinished. sweetgreen browse keeps place as a quiet line and shows ~4–5 food rows ([category list](https://mobbin.com/screens/709f47fb-ac1f-45de-a910-a0aaab7f72ec)); LEOS stole food-as-hero but overspent vertical budget on greeting stack + 5.5rem thumbs.

**Human question on browse:** What can I get? (Still-in land may keep the fuller breath; browse must yield to catalogue.)

### Vertical budget (compress vs keep)

| Keep (premium) | Compress / demote on browse |
|----------------|-----------------------------|
| Warm Sand open field | Lead prose — clamp 1 line or hide after still-in settle |
| Place confidence (spoken) | Place as **eyebrow** (~0.875–1rem Sora) **or** single-line `Table 12 · You’re still in` |
| Soft lift on thumbs (lighter) | Thumbs **4–4.5rem** (not 5.5) |
| Calm category chips | Search collapsed / icon / secondary — not always-open field |
| One gold when action needed | Section titles compact (Sora medium, tight above/below) |
| Dock padding (safe, not lavish) | Open-field padding above first row |

### Ranked FE craft fixes

1. Place quieter: eyebrow **or** one line place+purpose — never Fraunces 1.5rem + purpose + lead stacked on browse  
2. Lead: clamp/hide on browse after still-in fade  
3. Search: collapsed/secondary until tapped  
4. Thumbs: ~4–4.5rem soft lift (food still hero, catalogue can breathe)  
5. Chips: keep; sticky optional when scrolling long sections  
6. Section titles: compact rhythm markers, not second heroes  

### 50+ item scroll model (feel only — no new architecture)

```text
Scroll top: place whisper + chips → ≥4 full rows visible (phone)
        │
   Scan rhythm: title → short line → quiet price · even row height
        │
   Sticky: category chips (optional) · place stays a quiet whisper if sticky
        │
   Never: dashboard filters · second greeting · competing primaries
```

Guest should feel: I know where I am → I can sweep the list → section names mark chapters → tap when ready. Long catalogue = confident scan, not a luxury lobby that hides the menu.

### Done when (density)

1. Phone browse scroll-top shows **≥4 full menu rows** (5th peek OK) with place still spoken — **shipped** (browse density Continuity)  
2. Still-in land may use fuller Fraunces breath; browse does not keep that stack forever  
3. 50+ items: steady scan rhythm · sticky chips · collapsed search · no new surfaces  
4. No cards / BI / Marketplace / Neo / Setup chrome  

## HOLD

Help-ack pack polish · tip product · Marketplace · Neo · Setup · Operate heat maps · admin badges on Guest
