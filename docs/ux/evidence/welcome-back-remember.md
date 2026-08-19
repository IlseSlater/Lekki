# Evidence — Never Ask a Human to Remember (Welcome Back)

**Proof:** Returning owners are not treated like first-time creators. Studio remembers venue · progress · payments · brand.  
**Date:** 2026-08-12  
**Surfaces:** Welcome · Home · Create · `studio-context.service`  
**Pillar:** Continuity · Confidence · Calm  
**Constitution:** Blueprint §2.3 Never Ask a Human to Remember · Home §9

## Shipped

| Moment | Proof |
|--------|--------|
| Welcome Back | With experiences: venue hero · greeting · readiness · remembered facts · Open Experience / Continue setup |
| First-time Welcome | Unchanged — Let’s get your experience ready |
| Home live greeting | `Good morning.` + Fraunces venue (Blueprint layout) |
| Second experience | Create lead: “We’ll keep {venue}” · `startExperience` inherits venue · logo · colour · location · payments |
| lastSeen | `touchLastSeen()` on Home / Welcome |

## Explicitly not

- Multi-org CRM  
- Cloud account sync  
- Loyalty / wallets  
- Claim-from-table · Marketplace · Neo  

## Verify

1. Sign in with existing live workspace → `/studio` Home shows venue ready  
2. Open `/studio/welcome` → Welcome Back (not create checklist)  
3. Create another → identity/brand/payments carried forward  
4. Empty workspace → first-time Welcome unchanged  

## HCI

Owner feels: LEOS already knows.
