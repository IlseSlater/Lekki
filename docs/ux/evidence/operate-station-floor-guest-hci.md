# Evidence — Operate station/floor + Guest HCI

**Date:** 2026-08-06  
**Phase:** Hospitality — deepen Operate one-tap, then Guest confidence

## Intent

| Surface | Feeling |
|---------|---------|
| Station | Place · status · next action — tap advances |
| Floor | Needs-attention · Resolve › — tap clears |
| Entry / Experience | You’re in the right place — no Studio chrome |

## Mobbin (feel)

| Intent | Reference |
|--------|-----------|
| Pending → act | [Deliveroo Orders](https://mobbin.com/screens/0f2c8c42-ceca-4dee-9d60-31144ace5eaa) |
| Ready calm | Starbucks / Too Good To Go pickup confidence (not dark ops) |

## Shipped

| Area | Proof |
|------|--------|
| Station | Same `studio-operate` glance board as hub · row tap advances · gold primary CTA · quiet empty |
| Floor | Assistance as place · kind · Resolve › · clear visit when open · links to Operate / station |
| Entry | Welcome / join confidence · “I’m here” / “Join” · loading reassure |
| Guest | Browse place lead · live “We’re on it” · “What you ordered” |

## Success tests

- [ ] From Operate hub → station: clear next ticket without reading twice  
- [ ] Floor: resolve Assist in one tap  
- [ ] Guest entry: place shown · “You’re in the right place”  
- [ ] Build succeeds  

## Files

`station.page.ts` · `service.page.ts` · `entry.page.ts` · `guest.page.ts`
