# Lekki × Pilot — one-page pitch

25 Nov 2026 · @ilse

Lekki lets a guest at a Pilot restaurant open the bill on their phone, split it, tip and pay, while Pilot stays the system of record. We are asking Pilot for integration access to run a [6]-week pilot at [3] Pilot restaurants in [city].

**Honest status:** Lekki’s guest pay, split and tip flows work today on PayFast. A Pilot check sync (read open checks, post payments, close checks) is **requested, not live**. During the pilot, staff may close the Pilot check by hand after guests pay in Lekki until write-back is certified.

## The moment we fix

At the end of a meal, guests wait for the bill, then wait for the card machine. When a card fails, nobody is sure what happens next. Staff spend that time walking the machine around instead of serving.

## What the guest gets (working today)

| Moment | What the guest sees |
|--------|---------------------|
| Arrive | Scans the QR on the table. No app to download. |
| Order (optional) | Browses the menu, orders, sees it received and being made. |
| Pay | Sees the total, adds a tip, splits by what they had, the whole visit, or equal shares. |
| Card fails | Gets a clear next step. The table stays open and staff can see it. |
| Finish | Gets a receipt. Is welcomed back on the next scan. |

Staff can also key a bill total into Lekki so a restaurant can start before the Pilot link exists.

## How it sits next to Pilot (target once certified)

Lekki is the guest layer. Pilot keeps the bill, the menu and the books.

1. Pilot sends the open check for a table to Lekki as items are punched.
2. The guest pays on their phone.
3. Lekki posts the payment and tip back against that check.
4. Pilot closes the check. Reconciliation stays in Pilot.

**Payments today:** settle through **PayFast**. Once write-back exists, Pilot records them as a tender against the check. We are open to PilotPay later if Pilot prefers that path — we are not claiming PilotPay settlement today.

## The pilot

- **Where:** [3] owner-run restaurants on Pilot in [city], named in the request.
- **How long:** 2 weeks of baseline, then [6] weeks live.
- **What we measure:** minutes from asking for the bill to the table being free, failed payments recovered, tip value per table, new Google reviews.
- **Who sees it:** results go to the restaurants and Pilot before anyone else.

## What we ask of Pilot

1. Documentation and a test environment for reading open checks and line items by table.
2. A way to post a payment and tip against a check and close it.
3. The certification steps, timeline and any fees.
4. One named technical contact for the pilot.

## What Pilot gets

- A modern guest experience for its restaurants, without Pilot building or supporting it.
- Pilot stays the system of record. No second set of books.
- Pilot-specific data from a live pilot, shared first.
