# Evidence — G-04 choices sheet

**Proof:** Items that need choices open **one sheet over Browse** — required first · optional extras · special requests · live total · Add gated. No wizard. No separate item page.

**Date:** 2026-08-12 (browse confidence deepen)  
**Pillar:** Continuity · Confidence · Calm · Hospitality  
**Constitution:** Restaurant Pack UX §2–3 · [current-product-state §3.40](../current-product-state.md)

## Slice (shipped)

| Layer | Change |
|-------|--------|
| Pack content | `choiceGroups` on catalogue items (Classic Burger · Café Flat white milk) |
| Persistence | Optional `RestaurantCatalogItem.choiceGroups` Json |
| Guest Browse | Items with groups always open sheet on + |
| Browse confidence | Configured cards show **Choose options** cue + soft gold ring on + |
| Sheet | One panel · **Required · Choose 1** (gold weight) · Extras · Special requests · qty · Add disabled until required complete |
| Cart | Choice summary multi-line under name · priced deltas |
| Live Experience | Burger / Flat white show calm choice hints (Studio→Live confidence) |

## HCI

1. Why did a sheet appear? — only when the item has choice groups · Browse cue answers before the tap  
2. Can I add without choosing? — No (required gated)  
3. Do I remember what I picked? — Cart restates the summary  
4. What is required? — Required hint is visually stronger than Optional  

## Still HOLD / out of scope

Allocation wizard · multi-step builder · People also add upsell on this sheet

## Verify

1. Restaurant · Classic Burger — Browse shows **Choose options** · + → sheet · **Required · Choose 1** on side/drink · Add = **Choose required options**  
2. Fries · Coke · Cheese → price confidence shows base + deltas · **Add · R…**  
3. Cart restates multi-line: `Side: Fries` / `Drink: Coke` / `Extras: Cheese`  
4. Garden Salad + → one-tap (no sheet · no Choose options cue)  
5. Café · Flat white + → Choose your milk · Required · Choose 1  
6. Catalogue API returns `choiceGroups`  

## Architecture note

Pack content supplies groups. No Combo engine. No new guest surface — sheet over Browse only.

## Craft

Canonical pattern: [g04-choices-sheet.md](../g04-choices-sheet.md)  
`Choice Groups → Choices Sheet → Live Total → Add → Cart Restatement`
