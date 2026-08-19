# Evidence — Guest bill from Restaurant App

**Date:** 2026-08-06  
**Source:** `c:\Restaurant App\dark-culinary-pwa\src\app\features\customer\pages\bill\bill.page.ts`

## Ported

| Restaurant bill | LEOS |
|-----------------|------|
| Table / Mine scope | This visit · Mine |
| Line items | Aggregated session transaction lines |
| Tip chips 0/10/15/18/20 + custom | Same |
| Subtotal · tip · total | Same |
| Pay {total} | Same CTA |
| Call for help | Assistance API |
| PayFast / checkout | Existing LEOS payment + optional `tipAmount` |

## Files

`guest-bill.component.ts` · `guest.page.ts` · `leos-api.service.ts` · `payment.controller.ts` · `leos.service.ts`
