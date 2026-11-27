# Studio storefront onboarding

**Status:** Current — replaces Setup v1 journey order  
**Owns:** How an owner gets a guest-facing place live  
**Does not own:** LVES tokens, motion timings, one gold CTA, Live Experience = real Guest shell  
**Replaces the freeze in:** [hospitality-phase.md](hospitality-phase.md) Setup v1 section · [NORTH-STAR.md](../NORTH-STAR.md) “do not redesign Setup”

Setup v1 (Who → What → Where → How pay → Go Live) taught the product. It also made the owner think in our categories. That sequence is **no longer binding**.

---

## What we keep

- The company should not have to think. The backend fills what we already know.
- Fewer taps. One gold action per view.
- Live Experience is the real Guest shell, updating as they edit — never a fake mock.
- Language stays hospitality. Never Pack, connector, admin, deploy.

## What we stop doing

- A five-step quiz that asks the owner to classify themselves.
- Blank forms when a default, a sign-in, or a previous venue already has the answer.
- One table code at a time when they said how many tables they have.
- Making them pick a payment vendor before guests can see a menu.

---

## Reference: Uber Eats storefront

Guest Uber Eats (Mobbin) is the picture we are matching, not their account-creation quiz:

- Store hero: cover photo, logo, name, hours — [Jack in the Box store](https://mobbin.com/flows/39831b05-31a7-4ea9-9cfb-9ad724a91a63)
- Menu as the customer sees it: categories down the side, photos, prices, one customise moment — [item customise](https://mobbin.com/screens/021362b6-e73d-4817-beed-4f09f7dd5a55)

Uber’s merchant tool (Manager) edits **that page**. The owner changes the cover, the logo, a category, a price, and the customer page updates. They are not asked “what kind of experience is this?”

Lekki already has the pieces: venue name, logo, cover, brand colour, catalogue, places, PayFast, Live phone. The onboarding should arrange them as **one storefront**, with the phone showing the guest menu.

---

## The flow (three moments)

Backend does the work between moments. The owner only confirms or corrects.

### 1. Your place

**Question:** Does this look like you?

Show name, suburb, cover, logo, colour. Prefill from Google sign-in, a previous venue, or a sensible restaurant default (cover, gold `#D7A14A`, Johannesburg, ZAR).

**Gold:** This looks right.

### 2. What guests order

**Question:** Is this the menu?

Left: categories and items the way a guest browses (photo, name, price). Right: Live Experience, the real menu.

Start from a small starter menu for the experience type (restaurant: a few food and drink items). Owner edits, hides, or adds. They do not build a catalogue from an empty list.

**Gold:** This is the menu.

### 3. Open the doors

**Question:** Ready for the first guest?

- Tables: one number (“12”). Backend creates places and QR codes.
- Pay: if PayFast is already known, say so. If not, guests can still see the bill; staff can key a total. Do not block go-live on a vendor form.
- One gold: **Go live.**

After that, Home is the storefront. The same three areas stay editable. There is no second wizard.

---

## Click rule

| We used to ask | Backend does instead |
|----------------|----------------------|
| Who are you? | Name and org from sign-in |
| What experience? | Restaurant unless they already chose another |
| Where do guests join? | N tables from one number |
| How do they pay? | Keep current connector; offer PayFast only if missing |
| Type every menu row | Starter menu they can correct |

If a field already has a true value, show it. Do not ask again.

---

## Still true

One gold action. Live phone is real. Whitespace over density. Packs stay invisible. Guest, staff, and owner still see different worlds ([IA](ia-experience-studio-shells.md)).
