# Pilot integration — blocked until real docs

Engineering gate for Workstream E (launch readiness plan).

## Do not build yet

- Write-back: post payment + tip against a Pilot check and close it  
- Voids / discounts / comps / table moves from Pilot → Lekki  
- Reading `settlementOwner` to route real settlement to Pilot vs Lekki  
- Claiming Lekki “integrates with Pilot” in sales copy  

## Why

[`connectors/pilot-pos`](../../connectors/pilot-pos) is a **stand-in**: guessed webhook shape, add-line only, no write-back. Signed Pilot HMAC and per-venue secrets are production-hardened on our side; the **message contract is not**.

## Unblock when Pilot provides

1. API or webhook docs + test environment for open checks / line items by table  
2. A way to post payment + tip and close a check  
3. Certification steps, timeline, fees  
4. One named technical contact  

Until then: staff **Key bill** on the waiter floor (`staff_operate`) and close the Pilot check by hand after guests pay in Lekki (PayFast).

## Related

- Pitch honesty: [before-sending.md](before-sending.md)  
- Azure deploy: [infra/azure/README.md](../../infra/azure/README.md)  
