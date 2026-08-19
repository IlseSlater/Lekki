# LEOS Motion System

**Status: Frozen**  
**Owns:** How Studio (and Experience) motion should feel — duration · easing · patterns · celebrations  
**Complements:** [studio-design-system.md](studio-design-system.md) · [LVES](lves.md) · [LEK-040](../LEK-040-human-experience-engineering.md)  
**Code:** `apps/web/src/styles/_studio.scss` (`--studio-duration*`, `.studio-motion-*`) · Live Experience panel  
**Change policy:** Spec frozen. New patterns require ADR. Never invent bounce / shake / spin celebrations.

---

## Intent

Motion is product language — quieter and warmer than Material, never louder than the task.

```text
Alive without drawing attention to itself.
```

**Mobbin guidance (borrow feel, not chrome):**
- Airbnb Host “Today” — greeting · readiness · next steps ([example](https://mobbin.com/screens/95952c4f-c1fc-4963-b287-3bab0fde1ba9))
- Shopify Home calm cards — not Analytics widgets ([avoid](https://mobbin.com/screens/6e20298f-7484-49f3-b7a6-369cafd161db))

---

## Tokens

| Token | Value | Use |
|-------|--------|-----|
| `--studio-duration-fast` | 160ms | Hover · press · checkbox |
| `--studio-duration` | 220ms | Default transitions |
| `--studio-duration-enter` | 280ms | Card / page appear |
| `--studio-duration-settle` | 360ms | Success · QR reveal · confidence |
| `--studio-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | Ease-out (warm settle) |
| `--studio-ease-soft` | `cubic-bezier(0.33, 1, 0.68, 1)` | Morph · phone update |

Never spring bounce. Never infinite spin (except soft gold pulse for waiting).

---

## Patterns

### Appear (cards · screens · home)

- Opacity 0 → 1  
- TranslateY 8–12px → 0  
- Duration: enter (280ms) · ease-out  

### Continue / navigation

- Soft fade of outgoing content (160–220ms)  
- Incoming rise (280ms)  
- One primary gold button: press scale `0.98` (160ms)

### Live Experience phone update

- Phone: brief lift + soft shadow deepen (220ms)  
- Screen content: opacity dip → morph (soft ease)  
- Never hard-cut venue name / menu / arrival  

### Confidence / success

- Check + copy fade-rise (settle 360ms)  
- Soft green only — no confetti  

### Autosave

- “Saved automatically” fade in · hold ~1.6s · fade out  
- Never interrupt typing  

### Toast

- Bottom or inline status  
- Fade-rise in · calm hold · fade out  
- Gold accent optional · never red unless true error  

### QR reveal (Go Live)

- QR fades + slight scale 0.96 → 1 (settle)  
- Secondary actions appear after QR (stagger +40ms)  

### Loading / waiting

- Soft gold pulse on brand mark or primary CTA  
- Copy: calm (“Opening experience…”) — never “Processing…”  

---

## Micro-interactions (160–250ms)

| Element | Behaviour |
|---------|-----------|
| Button hover | Background shift · no grow |
| Button press | Scale 0.98 |
| Checkbox / toggle | Accent gold · ease |
| Card hover | Shadow soft → device shadow |
| Progress story | Colour ease to current / done |
| Phone refresh | Pulse class (existing) |
| Continue | One gold · press feedback |

---

## Never

- Bounce · pop · shake · spin forever  
- Motion longer than 400ms for ordinary UI  
- Motion that blocks the next tap  
- Celebrating “100% complete” — celebrate **readiness**  

---

## Signature sequence (Identity)

```text
Type “Blue Door”
  → phone fades / pulse
  → venue name morphs in shell
  → confidence ✓ Guests will recognise your venue
```

Everything feels alive. Nothing asks for applause.
