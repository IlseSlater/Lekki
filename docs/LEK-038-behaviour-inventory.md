# LEK-038 — Behaviour Inventory

**Status:** Active  
**Title:** Proven Behaviours (Reference Experience → LEOS)  
**Rule:** [ADR-003 Reference Experience Rule](adr/003-reference-experience-rule.md)  
**Note:** LEK-032 remains **Context Runtime** (platform stream). This inventory is **038** so runtime numbering stays intact.

Not screens. Not APIs. Not components.  
**Behaviours** — the enduring IP extracted from the Reference Experience.

Describe each behaviour so it survives Restaurant → Hotel → Festival → Golf.

---

## Summary matrix

| Behaviour (platform language) | Restaurant proof | LEOS today | Owner | Phase |
|------------------------------|------------------|------------|-------|-------|
| Trusted entry into a physical context | QR / table scan | Partial (demo tokens) | Entry Runtime | 1 |
| Context resolves to venue + place + profile | Table → company/session | Partial | Context Runtime | 1 |
| Experience session is the live aggregate | CustomerSession | Partial | Experience Runtime | 1 |
| Participant joins a live experience | Register / join sheet | Partial (single guest) | Experience Runtime | 1 |
| Multiple participants share one live experience | Multi-guest table | **Gap** | Experience Runtime | **1.5** |
| Catalogue is browsed before commitment | Menu | Partial | Experience + Pack | 1 |
| Lines can be configured before becoming transactions | One-sheet choices (modifier groups internally) | **Gap** (qty only) — [UX Constitution](ux/restaurant-pack-ux-constitution.md) Frozen | Restaurant Pack | 2 |
| Deferred commitment → Transaction | Place order / cart | Partial | Experience Runtime | 1 |
| Fulfilment work is routed to specialised stations | Kitchen / bar boards | Partial | Capability (fulfilment) | 1 |
| Fulfilment status is live by default | Socket item status | Partial | Capability + Experience | 1 |
| Participant requests assistance | Waiter / manager call | Partial | Restaurant Pack | 2 |
| Settlement via capability, not vendor UI in core | PayFast + Manual | Partial (manual + PayFast connector) | Capability (payment) | 1–2 |
| Payment may be split across participants | Split / mine vs table | **Gap** | Capability (payment) | 2 |
| Offline does not lose user Intent | Order queue / PWA | Planned / stub | Experience Runtime | 3 |
| Session completes; physical context released | Clear / leave / bill paid | Partial | Experience Runtime | 1 |
| Second profile, same runtimes | — (Cafe in LEOS) | Partial (token proof) | Profile Engine | 1 |

**Phase legend:** 1 = Heartbeat · 1.5 = immediately after heartbeat · 2 = deepen Guest · 3 = resilience.

---

## Behaviour records

### Shared Experience

**Description:** Multiple participants interact with one live ExperienceSession bound to one Physical Context.  
**Implemented by:** Experience Runtime  
**Restaurant proof:** Multi-guest table session, join sheet, shared Socket room  
**LEOS today:** Gap (single participant path)  
**Future packs:** Hotel room party · Festival group · Golf foursome  
**Phase:** 1.5

---

### Trusted Entry

**Description:** A person enters an organisation’s experience through a trusted interaction that resolves context without installing a new app per venue.  
**Implemented by:** Entry Runtime  
**Restaurant proof:** QR / manual table entry  
**LEOS today:** Partial (demo QR tokens)  
**Future packs:** NFC, wallet pass, calendar invite  
**Phase:** 1

---

### Deferred Commitment

**Description:** Items may be configured before becoming Transactions.  
**Implemented by:** Experience Runtime (draft lines) + Pack catalogue rules  
**Restaurant proof:** Menu modifiers, bundles, live price  
**LEOS today:** Gap (quantity only)  
**Future packs:** Hotel services · Golf bookings · Festival merchandise  
**Phase:** 2

---

### Station Fulfilment

**Description:** Fulfilment work is routed to specialised stations and progresses through live statuses.  
**Implemented by:** Capability Runtime (`fulfilment.*`)  
**Restaurant proof:** Kitchen / bar KDS boards  
**LEOS today:** Partial (station board + status updates)  
**Future packs:** Housekeeping · Prep tents · Pro shop  
**Phase:** 1

---

### Assistance Request

**Description:** A participant requests human assistance without leaving the session.  
**Implemented by:** Experience surface + Pack workflow (escalation optional)  
**Restaurant proof:** Call waiter / speak to manager  
**LEOS today:** Partial (simple assist)  
**Future packs:** Concierge · Steward · Volunteer desk  
**Phase:** 2

---

### Capability Settlement

**Description:** Settlement is requested as a capability; connectors bind providers without changing packs.  
**Implemented by:** Capability Runtime + Connector  
**Restaurant proof:** PayFast + Manual  
**LEOS today:** Partial (manual default, PayFast connector)  
**Future packs:** Any industry paying for a session  
**Phase:** 1–2

---

### Allocated Settlement

**Description:** Payment Intent may cover part of a session (self, others, or full context).  
**Implemented by:** Capability Runtime (payment allocation)  
**Restaurant proof:** Mine vs table, split bill  
**LEOS today:** Gap  
**Future packs:** Shared hotel folio · group festival tickets  
**Phase:** 2

---

### Continuity Under Interruption

**Description:** Offline or reconnect never loses user Intent; session can be resumed.  
**Implemented by:** Experience Runtime (client queue + resume)  
**Restaurant proof:** Offline order queue, session restore  
**LEOS today:** Planned / stub  
**Future packs:** All mobile-first packs  
**Phase:** 3

---

### Profile-Driven Experience

**Description:** Same runtimes and components adapt via Experience Profile (terminology, stations, capabilities) without core forks.  
**Implemented by:** Profile Engine + Packs  
**Restaurant proof:** (LEOS-native Cafe profile is the proof; Restaurant App was single-industry)  
**LEOS today:** Partial (Restaurant + Cafe tokens)  
**Future packs:** Hotel · Festival · Golf  
**Phase:** 1

---

## What is not a LEOS behaviour

These stay in the Restaurant Pack (or never migrate):

- Table occupancy FSM, menu CRUD, inventory, specials engine  
- Kitchen/bar as platform boundaries  
- Staff PIN as core identity  
- Dual POS order models  

---

## Related

| Doc | Role |
|-----|------|
| ADR-003 | Reference Experience Rule |
| LEK-027 | Interactions |
| LEK-029 | Composition / wireframes (+ Proven badges) |
| LEK-031–035 | Runtime manuals |
| Reference Implementation Checklist | Heartbeat acceptance |

*End of LEK-038.*
