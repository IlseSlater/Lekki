# LEK-026 — LEDS Visual Language

**Status:** Active (token reference) · **Look system:** [LVES](ux/lves.md) supersedes LEDS as the product visual language  
**Title:** Lekki Experience Design System (LEDS) — Visual Language (legacy / tokens)  
**Consumed by:** [LEK-028](LEK-028-component-catalogue.md) · absorbed directionally into [LVES](ux/lves.md)  
**Feel:** [LEK-040](LEK-040-human-experience-engineering.md)

LEDS remains useful for **CSS token names** in Experience. New visual decisions follow **LVES**. Do not invent per-pack colours or radii.

---

## 1. Design principles

1. **Warm-minimalist** — Calm surfaces; one clear primary action  
2. **Radical whitespace** — Prefer space over chrome  
3. **Grammar before decoration** — One purpose, one primary, one success, one escape, one help  
4. **Tokens before hex in components** — Components reference CSS variables, never raw brand hex in TS templates  
5. **Passive Neo** — Neo Dock never interrupts with popups  

---

## 2. Colour

| Token | CSS variable | Role |
|-------|--------------|------|
| Warm Sand | `--leos-warm-sand` | Page / ambient surface |
| Warm Sand Dark | `--leos-warm-sand-dark` | Nested surface |
| Surface Ambient | `--leos-surface-ambient` | Soft backdrop |
| Deep Emerald | `--leos-emerald` | Primary action |
| Emerald Soft | `--leos-emerald-soft` | Soft fill |
| Electric Cyan | `--leos-electric-cyan` | Selection glow, Neo |
| Neutral Dark | `--leos-neutral-dark` | Primary text |
| Neutral Muted | `--leos-neutral-muted` | Secondary text |
| Success / Warning / Danger | `--leos-success*` / `--leos-warning*` / `--leos-danger*` | Semantic |

---

## 3. Typography

| Role | Guidance |
|------|----------|
| UI sans | `--leos-font-sans` (Segoe UI / system) |
| Display | `--leos-font-display` (same stack until a branded face is chosen) |
| Hierarchy | Purpose (screen title) > lead > body > muted meta |
| Density | Guest micro: tighter; Operator: larger type + touch |

---

## 4. Spacing & geometry

| Token | Value / use |
|-------|-------------|
| `--leos-space-xs` … `--leos-space-2xl` | 0.5rem → 3rem scale |
| `--leos-radius-card` | 24px |
| `--leos-radius-button` / `--leos-radius-input` | 12px |
| `--leos-radius-pill` | Full pill (use sparingly; prefer Grammar cards) |
| `--leos-touch-min` | 44px minimum target |

---

## 5. Elevation & motion

| Token | Use |
|-------|-----|
| `--leos-shadow-card` | Entity / selection cards |
| `--leos-shadow-emerald` | Primary CTA lift |
| Motion | Soft selection; cart badge pulse; no gratuitous parallax |
| Neo | Passive cyan pulse only |

---

## 6. Density & breakpoints

| Mode | When | Behaviour |
|------|------|-----------|
| Guest micro | Guest phones | Compact lists, sticky bottom actions |
| Operator | Kitchen / bar | Large touch rows, high contrast chips |
| Setup | Admin wizard | Progress chrome, card grids, comfortable density |

Breakpoints: prefer fluid layouts; operator mode is a host class (`leos-layout-operator`), not a pack fork.

---

## 7. Interaction states (visual)

Every interactive component must style: **default · hover/focus · selected · disabled · loading · error · success**.  
Map to LEK-027 screen States where the component is the surface for that state (Empty State, Offline Banner, Error Surface).

---

## 8. Iconography

- Prefer simple line icons; no emoji as UI affordances  
- Status via **Status Chip** colour + label, not icon-only meaning  
- Neo Dock is the sole “intelligence” chrome  

---

## 9. Experience Grammar (binding)

| Law | Visual implication |
|-----|-------------------|
| One Purpose | One H1 / purpose string per screen |
| One Primary Action | Single Deep Emerald CTA |
| One Success State | Success banner / panel |
| One Escape Route | Secondary / text Back·Cancel |
| One Help Mechanism | Inline field help or screen help string |

---

## 10. Change policy

Token renames or palette shifts are LEDS changes: update `_tokens.scss` and this document together. Components in LEK-028 must not hardcode superseded values.
