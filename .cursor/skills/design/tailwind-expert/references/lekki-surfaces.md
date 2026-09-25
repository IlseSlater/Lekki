# Lekki surfaces, logo, landing

## Logo (do not invent another)

| File | Use |
|------|-----|
| `/brand/lekki-mark.png` | Guest splash — metallic gold **L + orbiting dot**. Flow down 3s. |
| `/brand/lekki-mark.svg` | Favicon, Studio chrome, sign-in mark (small). |
| `/brand/lekki-logo-64.png` | Marketing nav / footer. |
| `/brand/lekki-logo.png` | OG / apple-touch. |

Wordmark is **`Lekki.`** (period). Welcome line: **The human experience app.**  
Guests **never** see our name on the venue experience (`lves.md`). After splash, the venue owns the shell (`--brand`).

The mark is a **light source**. Halo, drop-shadow, and dusk sky exist to make that metal readable — they are not a second logo.

## Dusk (one sky)

`website-horizon.component.ts` + boot `#boot-splash` in `index.html`:

- Ground `#00070d` (`--leos-ground`)
- Warm sky `#c2a184`
- Ridges `#5b6068` → `#2b3036` → `#14171b` → `#05070a`

Same hills: boot (hills only) → landing hero → guest splash canvas → cinematic register ground. Do not introduce a second landscape.

## Landing — `website-home.page.ts`

Fora-like: dark canvas, **Inter**, pill chrome, chip + title + lead + **Get started free**.  
Hero stage `lk-glow` is currently a **teal/cyan radial** (`rgba(180, 220, 230)`). That fights the gold mark. First-impression work should replace it with dusk + gold light, not a SaaS nebula.

Nav: Lekki. · About · Features · Pricing · FAQ · Contact · Login / Get started.  
Identity carry-over: **logo only** — no LEOS machinery on the public site.

## Product first rooms

| Moment | File | Halo |
|--------|------|------|
| Boot | `index.html` `#boot-splash` | Hills only. No mark. |
| Guest splash | `guest-splash.page.ts` | Transparent over canvas. Mark 8rem, cluster `padding-top: 18vh`. 4s, tap skip. |
| Studio sign-in | `studio-signin.page.ts` | `.leos-register--cinematic.leos-register-halo` |
| Studio hub | `studio-shell` | Ash halo when not Setup Engine. |
| Go live sheet | `golive-confirm-sheet` | Cinematic halo. Peak gold **Open for guests**. |

Halo implementation: `registers.css` `.leos-register-halo::before` + `--leos-ash-halo` / `--leos-obsidian-halo`. GPU: opacity + scale only. `prefers-contrast: more` kills the halo.

## Tailwind in this repo

`apps/web/src/styles.css`:

1. Preflight **not** imported.
2. Product CSS in `layer(components)`.
3. `@theme` aliases only — `bg-action`, `text-ink`, `rounded-card`, `max-w-studio`, `duration-halo`, `ease-leos`, `bg-brand`.

Action is **four colours**: Guest gold `--color-action`; Studio register `--color-register-action`; peak `--color-peak`; venue `--color-brand`. Never collapse them.

Open decisions (do not alias yet): Operate `--w-*` mint/blue/coral; `--exp-ink` hex stew; leftover `--scan-*`.
