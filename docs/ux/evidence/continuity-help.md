# Evidence — Call Staff Continuity (Studio Call Staff → Guest Help)

**Proof:** Guest answers “Can I ask for help here?” from the same Setup `callStaff` truth Live already uses — no hardcoded Help-on.

**Date:** 2026-08-21  
**Surfaces:** Setup Experience (Call Staff) · Studio Live · Guest dock Help · Bill help actions  
**Pillar:** Continuity · Confidence · Calm  
**Contract:** Blueprint Studio→Live→Guest · No Drift Rule

## Slice (shipped)

| Human fact | Meaning |
|------------|---------|
| Call Staff off | Guest dock hides Help · help sheet unreachable · Bill has no staff/manager actions |
| Call Staff on | Help dock + sheet + Bill help as today |
| Live ↔ Guest | Both honour `guestDesign.callStaff` (Live quiet Help · `resolveAllowHelp` for Guest) |

## HCI

Owner toggles Call Staff in Setup Experience. Guest Help matches Live. No new assistance product.

## Verify

```bash
node --import tsx --test apps/web/src/app/studio/help-continuity.test.ts
```

1. Restaurant workspace · Call Staff off → Guest has no Help tab · Bill has no Request waiter / manager.  
2. Call Staff on → Help returns; Live phone shows Help quiet chrome.  
3. First paint defaults Help off until resolve.

## Still HOLD

Split Continuity · Leave purpose chrome · Marketplace · Neo · Setup redesign · new help kinds.
