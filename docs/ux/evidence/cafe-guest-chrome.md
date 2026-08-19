# Evidence — Café guest chrome (Board · Tab · Counter)

**Proof:** Café guest path speaks café — not restaurant leftovers — from entry through help and leave.

**Date:** 2026-08-11  
**Pillar:** Hospitality · Confidence · Calm · Pack polish (no Platform change)

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Tab bar | Pack terms — **Board** / **Tab** (restaurant stays Menu / Bill) |
| Entry CTA | **See the board** from `catalogue` terminology |
| Help sheet | **Ask the counter** · counter notified / on the way |
| Orders chips | Café status labels (Order taken · Making · Ready for pickup · Collected) |
| Receipt leave | **complete your visit** from pack `close` (not “clear your table”) |
| Restaurant pack | Explicit `catalogue: Menu` for parity |

## HCI

1. Am I in a café? — Board · Tab · Counter language on live guest chrome  
2. Who helps me? — Ask the counter (not Request Waiter)  
3. Is my order ready? — Ready for pickup / Collected (not On the way / Enjoy)  
4. Am I finished? — Complete visit language  

## Out of scope (HOLD)

Equal-split · claim-from-table · Operate floor “Tables” redesign · Studio Live shell projection · Setup redesign

## Verify

1. Open `/e/qr-demo-cafe` → welcome CTA **See the board**  
2. Guest dock shows **Board** · **Tab**  
3. Help → **Ask the counter**  
4. Place order → Orders chip **Making** / **Ready for pickup** (not On the way)  
5. Receipt copy mentions completing the visit (not clearing a table)  
6. `/e/qr-demo-restaurant` still Menu · Bill · Request Waiter  

## Architecture note

Pack surface polish on existing `TerminologyService` + profile helpers — no new runtimes, packs, or Continuity payment model. Café board seed already venue-scoped in `scripts/seed-demo.ts`.
