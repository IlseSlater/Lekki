# Evidence — Studio craft fidelity

**Date:** 2026-08-06  
**Phase:** Hospitality — docs + Mobbin → software (Setup v1 not redesigned)

## Mobbin (feel, not chrome)

| Intent | Reference |
|--------|-----------|
| Quiet top chrome | [Shopify admin](https://mobbin.com/screens/e14aa727-00aa-4097-ac95-497affc8fbef) — horizontal modes |
| Operate list density | [Deliveroo Orders](https://mobbin.com/screens/0f2c8c42-ceca-4dee-9d60-31144ace5eaa) — place/title · status · next action |
| Grow narrative | [Airbnb Host](https://mobbin.com/screens/30e16220-429d-4d37-9e22-516dcb25d162) — greeting · calm story · one CTA |
| Reject | Analytics / chart dashboards as Grow or Home |

## Shipped

| WP | Proof |
|----|--------|
| WP1 | Topbar modes horizontal · `prefers-reduced-motion` · autosave fade cycle · motion appear |
| WP2 | Create hosts Live Experience; select → `startExperience` + phone defaults |
| WP3 | No pay group on Experience · Places bulk 1–20 · Identity recognise copy · no fake R248 |
| WP4 | Operate place · status · hint › · large tap rows · tone colours |
| WP5 | Grow venue + favourite when memory · one suggestion · no charts |
| Polish | Welcome motion · Payments 44px toggles |

## Smoke checklist

- [x] Build `ng build web` succeeds  
- [ ] `/studio/create` — Live phone · type select updates venue defaults  
- [ ] `/studio/setup/experience` — no pay toggle group  
- [ ] `/studio/setup/places` — single calm bulk 1–20  
- [ ] `/studio/setup/identity` — recognise confidence  
- [ ] `/studio/setup/payments` — methods · tip · split  
- [ ] `/studio/operate` — place-first glance  
- [ ] `/studio/grow` — one breath · ≤1 suggestion  
- [ ] OS reduced-motion — Studio animations off  

## Files

`_studio.scss` · `studio-shell` · `studio-create` · `studio-welcome` · `guest-experience-design` · `setup-identity` · `setup-places` · `setup-payments` · `live-experience-panel` · `setup-operate` · `studio-grow` · Home motion
