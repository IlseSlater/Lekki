# Setup Studio — Payment Connector Screens (UX Inventory)

**Purpose:** Single screen/UX source of truth for Setup Studio payment connector onboarding.  
**Canonical home:** Folded into [LEK-027 Experience Interaction Catalogue](../LEK-027-experience-interaction-catalogue.md) §8 (Admin Configure Payments) with full ownership, states, and components. This inventory remains the detailed Setup Studio field reference.  
**Sources (screens/UX only):** LEK-022, LEK-022-VIS, Setup Studio narratives in *Dynamic UI render for Lekki setup studio*, LEK-026 Experience Grammar / LEDS tokens, `docs/LEOS.md`.  
**Out of scope here:** Runtime, Prisma, secrets vault, LPDK, guest/kitchen/service pack screens.

**Naming note:** Specs often say “Pilot Payments”. In LEOS Phase 2 the installable provider is **PayFast**; treat Pilot copy as the UX template and substitute PayFast (or the selected provider name) in the UI.

---

## 1. Design rules

### UX principles (LEK-022)

- Guided; minimal technical knowledge
- Validate continuously; explain every decision
- Never expose implementation details
- Save progress (UI may persist locally in mock phase)
- Reversible (Back / Cancel)
- Support single- and multi-venue businesses
- Feel like configuring **Payments**, not installing software

### Experience Grammar (LEK-026 / LEOS)

| Law | Rule |
|-----|------|
| One Purpose | One focused decision per screen |
| One Primary Action | One Deep Emerald CTA for the happy path |
| One Success State | Explicit confirmation after completed actions |
| One Escape Route | Back or Cancel on every critical path |
| One Help Mechanism | Inline help / doc links on interactive fields |

**Guided Setup pattern:** Discover → Understand → Configure → Validate → Complete

### Tokens (LEDS / LEOS)

| Token | Value / use |
|-------|-------------|
| Warm Sand | Page / ambient surfaces (`#F4EFE6` family) |
| Deep Emerald | Primary actions (`#0D3A2F`) |
| Electric Cyan | Selection glow, Neo Dock |
| Card radius | 24px |
| Button / input radius | 12px |
| Neo Dock | Passive bottom-right; no popups |

### Chrome shared across wizard steps

- Progress bar + “N% connected” (or “Step X of Y”)
- Optional “← Back to …” escape
- Visual **cards** for choices (not radio rows) — LEK Dynamic UI + LEK-022 routing

---

## 2. Master flow

```text
[0] Setup hub — Setup Your Business
        ↓  (Payments module)
[1] Choose payment provider
        ↓
[2] Connector overview
        ↓  Accept & Install
[3] Merchant details
        ↓  Test Connection
[4] Connecting (transient)
        ↓  success
[5] Merchant verified
        ↓
[6] Settlement account
        ↓
[7] Routing strategy
        ↓  if venue or location
[8] Routing configuration (mapping matrix)
        ↓
[9] Review
        ↓  Activate
[10] Activation progress
        ↓
[11] Success
```

Maps to Guided Setup: **Discover** (0–1) → **Understand** (2) → **Configure** (3, 6–8) → **Validate** (4–5) → **Complete** (9–11).

---

## 3. Screen inventory

### Screen 0 — Setup Studio hub

| | |
|--|--|
| **Purpose** | Pick a business capability module to configure |
| **Title** | Setup Your Business |
| **Lead** | Let's connect the services your business uses. |
| **Layout** | Module tiles: Payments, Accounting, Messaging, Banking, Analytics |
| **Primary** | Open module (Payments → provider gallery) |
| **Escape** | Leave Setup (nav elsewhere) |
| **States** | Payments available; other modules disabled / “Coming soon” |

### Screen 1 — Choose payment provider

| | |
|--|--|
| **Purpose** | Select a payment provider |
| **Title** | Choose your Payment Provider |
| **Lead** | Select the provider you currently use or would like to use for accepting payments. |
| **Layout** | Search; category chips (Payments, Popular, Recommended, Installed); provider card grid |
| **Card content** | Name, logo, publisher, verified badge, countries, version, installable / coming soon |
| **Providers (spec)** | Pilot/PayFast, Stripe, NB, Adyen, Yoco, Ozow, Peach |
| **Primary** | Learn more / Install on selected card (or select then continue) |
| **Escape** | Cancel / back to hub |
| **Disabled** | Non-installable cards not selectable |

### Screen 2 — Connector overview

| | |
|--|--|
| **Purpose** | Understand capabilities and permissions before install |
| **Title** | {Provider name} (e.g. PayFast / Pilot Payments) |
| **Lead** | Verified partner; short description; “about 2 minutes” |
| **Layout** | Description; Capabilities list; Permissions requested; Requirements (Merchant ID, credentials, settlement); docs/support hints |
| **Primary** | Accept & Install |
| **Escape** | Cancel → Screen 1 |

### Screen 3 — Merchant details

| | |
|--|--|
| **Purpose** | Enter merchant credentials |
| **Title** | Connect your {Provider} Account |
| **Lead** | Enter the details supplied by the provider dashboard. |
| **Fields** | Environment (Sandbox / Production — visual cards); Merchant ID; API Key / Merchant Key; Webhook Secret or Passphrase (optional per provider) |
| **Help** | “Where do I find my Merchant ID?” / “… API Key?” |
| **Actions** | **Test Connection** (secondary/escape slot); **Continue** (primary, **locked** until test succeeds) |
| **Success (inline)** | ✓ Connected + merchant name / status / currency preview |
| **Error** | Inline error banner if fields incomplete or test fails |

### Screen 4 — Connecting (transient)

| | |
|--|--|
| **Purpose** | Show validation in progress |
| **Copy** | “Connecting to {Provider}…” |
| **Layout** | Progress / spinner; then transitions to verified |
| **Primary** | None (auto-advance) |
| **Escape** | Cancel test (optional) |

### Screen 5 — Merchant verified

| | |
|--|--|
| **Purpose** | Confirm successful merchant lookup |
| **Title** | Merchant verified |
| **Success card** | ✓ {Provider} Account Connected / Active |
| **Fields shown** | Business name; Merchant number / MID; Country; Settlement currency; Status = Verified |
| **Lead** | Connection validated; credentials stored for this environment (UI copy only in mock phase) |
| **Primary** | Continue |
| **Escape** | Back → Screen 3 |

### Screen 6 — Settlement account

| | |
|--|--|
| **Purpose** | Where funds are deposited |
| **Title** | Where should your funds be deposited? / Where should your money go? |
| **Lead** | Choose the bank account where the provider settles completed transactions. |
| **Fields** | Bank name; Account holder; Branch code; Account number; Account type; Settlement currency; optional Settlement reference; checkbox “Validate account with bank registry on submit” |
| **Primary** | Continue |
| **Escape** | Back → Screen 5 |

### Screen 7 — Routing strategy

| | |
|--|--|
| **Purpose** | Choose how payments are routed |
| **Title** | How should payments be routed? / How does your business operate? |
| **Lead** | Choose how your business wants payment transactions to be processed. |
| **Options (visual cards)** | **Global settlement** — one merchant, all venues; **Venue routing** — each venue own MID/settlement; **Location routing** — locations inside a venue |
| **Primary** | Continue (requires selection) |
| **Escape** | Back → Screen 6 |
| **Note** | Prefer pictures/cards over radio buttons |

### Screen 8 — Routing configuration

| | |
|--|--|
| **Purpose** | Configure mapping after strategy choice |
| **Global** | Show Organisation → Merchant → Settlement summary (read-only confirm) |
| **Venue** | Table rows: Venue \| Merchant ID \| Settlement account \| Status (e.g. Cape Town, Johannesburg, Durban) |
| **Location** | Nested: Venue → Locations → Merchant → Settlement (e.g. Dining Floor, VIP Lounge, Pool Bar) |
| **Primary** | Continue |
| **Escape** | Back → Screen 7 |
| **Empty** | Editable mock rows for demo venues |

### Screen 9 — Review

| | |
|--|--|
| **Purpose** | Confirm before activation |
| **Title** | Review your setup |
| **Summary blocks** | Provider; Merchant verified; Settlement bank; Routing strategy + counts; Capabilities enabled (payments, refunds, settlement, reconciliation, webhooks, health) |
| **Primary** | Activate system / Activate |
| **Escape** | Edit configuration → jump to Screen 7 or earlier |

### Screen 10 — Activation

| | |
|--|--|
| **Purpose** | Show provisioning pipeline |
| **Title** | System provisioning pipeline / Activation |
| **Checklist (sequential)** | Installing connector → Encrypting credentials → Registering capabilities → Creating secrets → Creating event subscriptions → Configuring workflows → Verifying health → Connector active |
| **Status line** | “Finalizing…” while running |
| **Primary** | None (auto-advance to Success) |
| **Escape** | None while running |

### Screen 11 — Success

| | |
|--|--|
| **Purpose** | Confirm connector ready |
| **Title** | ✓ {Provider} Ready / Payments connected |
| **Body** | Capabilities: Accept payments, Refunds, Settlement, Reporting, Reconciliation |
| **Primary** | Open Dashboard (or Go to Guest) |
| **Secondary** | Configure Workflows (optional / disabled if N/A); Install Another Connector |

---

## 4. Transitions

| From | Trigger | To | Unlock rule |
|------|---------|-----|-------------|
| 0 | Open Payments | 1 | — |
| 1 | Select installable + Learn more / Install | 2 | Provider selected & installable |
| 2 | Accept & Install | 3 | — |
| 2 | Cancel | 1 | — |
| 3 | Test Connection success | 4 then 5 | Credentials non-empty; mock lookup OK |
| 3 | Continue | 5 | Only if connection tested OK |
| 5 | Continue | 6 | — |
| 6 | Continue | 7 | — |
| 7 | Continue | 8 | Strategy selected |
| 7 | Continue (global only) | 9 | May skip 8 for global with confirm-only 8, or show brief 8 |
| 8 | Continue | 9 | — |
| 9 | Activate | 10 | — |
| 9 | Edit | 7 | — |
| 10 | Checklist complete | 11 | All steps ticked |
| 11 | Install another | 1 | Reset wizard state |
| 11 | Open Dashboard / Guest | exit | — |

**Prefer LEK-022** when Dynamic UI step counts differ (e.g. “Step 3 of 5”); use LEK-022 Screens 1–10 plus hub (0) and connecting (4).

---

## 5. Wireframe notes (LEK-022-VIS)

Keep ASCII layouts from LEK-022-VIS as visual reference (provider grid, overview permissions, merchant form, verified card, settlement form, routing cards, review, activation checklist). Do not treat them as code. Key cues:

- Progress strip at top of wizard screens
- Category filters + search on Screen 1
- Continue locked until Test Connection succeeds on Screen 3
- Cyan selection glow on selected visual cards
- Neo Dock silent bottom-right

---

## 6. Acceptance checklist (UI complete)

Walk `/setup` → `/setup/payments` with **mock data only** (no API/Prisma required).

- [x] **0 Hub** — modules visible; Payments opens wizard; others coming soon
- [x] **1 Providers** — search, categories, cards, verified/coming-soon, selection
- [x] **2 Overview** — capabilities, permissions, Accept & Install, Cancel
- [x] **3 Merchant** — env cards, fields, help links, Test Connection, Continue locked then unlocked
- [x] **4 Connecting** — transient “Connecting…” then advance
- [x] **5 Verified** — success card with business / MID / country / currency / status
- [x] **6 Settlement** — all bank fields + validate checkbox
- [x] **7 Routing strategy** — three visual cards, one selection
- [x] **8 Routing config** — matrix for venue/location; summary for global
- [x] **9 Review** — summary + Activate + Edit
- [x] **10 Activation** — checklist animates through all steps
- [x] **11 Success** — capabilities + Install another + primary exit CTA
- [x] Grammar — one primary CTA per step; escape/back present; progress shown
- [x] Tokens — Warm Sand / Emerald / Cyan; card radius; Neo Dock unchanged

**UI complete when** every box above can be ticked without calling the runtime payment setup API.

---

## 7. Implementation status (UI mock)

| Route | Screen |
|-------|--------|
| `/setup` | Hub (0) |
| `/setup/payments` | Wizard screens 1–11 (local fixtures only) |

Inventory file: this document. Wizard help text states “UI mock (no API)”.
