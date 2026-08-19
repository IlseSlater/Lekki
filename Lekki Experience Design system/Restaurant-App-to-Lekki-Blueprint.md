# LEK-001 — From Restaurant Application to Experience Operating System

**Status: Platform Constitution (Frozen)**  
**Version:** 1.0 (frozen)  
**Change policy:** Changes only by Architecture Decision Record (ADR). Do not edit this constitution casually.  
**Decision:** Lekki is the Experience Operating System (**LEOS**). The Restaurant App becomes Lekki's first **Restaurant Experience Pack**, not the platform's permanent product boundary.

> Implementation detail (file paths, Prisma models, provider SDKs, transport polling) belongs in sibling LEKs and the LEOS Implementation Roadmap — not in this constitution.

> **Freeze note:** Vision and Platform Rule are stable. Design work continues in LEK-026/028+; platform execution manuals in LEK-031+. New architectural boundaries require an ADR that amends or clarifies this constitution.

---

## The North Star

Lekki exists to make digital experiences in physical environments portable, intelligent, and composable.

Every person should be able to arrive at any participating organisation, identify themselves once, enter through a trusted interaction, and receive a seamless experience across venues, memberships, payments, services, and organisations without repeatedly creating accounts, installing different applications, or learning new systems.

Every organisation should be able to compose those experiences from reusable platform capabilities rather than building bespoke software.

Everything in Lekki exists to move the platform closer to that vision.

---

## The Lekki Platform Constitution

This constitution is the governing architectural lens for Lekki. Every architect, developer, product owner, AI agent, connector developer, and Experience Pack author must apply it before introducing a capability, schema, screen, event, integration, or data model.

### The seven immutable principles

1. **Experiences before applications** — Applications and industries are implementations; experiences are the enduring architecture. Restaurant, hotel, festival, and golf must never become core architectural boundaries.
2. **Business intent before technical implementation** — The platform models intent, capabilities, policies, rules, and relationships. Runtimes and connectors execute those descriptions.
3. **Schemas before interfaces** — Interfaces are compiled from governed schemas. LEOS owns rendering, accessibility, layout, interaction, and design tokens; integrations provide declarative configuration, not uncontrolled application pages.
4. **Capabilities before vendors** — Consumers request `CreatePayment`, `RefundPayment`, or `CreateFulfilment`, never Pilot, Stripe, Adyen, or a restaurant department. Providers implement approved capabilities.
5. **Events before state** — The platform remembers immutable business facts. Views, dashboards, and operational boards are authorised projections; every important completed action becomes a versioned event.
6. **Intelligence before automation** — Neo first understands identity, profile, session, context, policy, and confidence. It recommends or automates only within explicit authority; it never automates blindly.
7. **Platform before product** — Every core change must strengthen Lekki for more than one pack. A feature that only strengthens the Restaurant Pack belongs in the Restaurant Pack.

### Platform Rule

Every new feature must first answer:

> Does this belong in the **Entry Runtime**, **Context Runtime**, **Experience Runtime**, **Capability Runtime**, **Profile Engine**, **Experience Pack**, or **Connector**?

If the answer is unclear, the feature is not ready to build.

### What Lekki is not

Lekki is not a restaurant POS, hotel PMS, booking engine, payment gateway, CRM, loyalty platform, workflow tool, AI assistant, marketplace, SDK, or QR platform. Each can be a Lekki capability, connector, pack, or experience. Lekki orchestrates them through a common experience model, runtime, and ecosystem.

### Platform hierarchy

```text
Lekki Platform
  └─ LEOS (Experience Operating System)
      └─ Experience Runtime
          └─ Experience Profiles
              └─ Experience Packs
                  └─ Capabilities
                      └─ Connectors
                          └─ Experiences
                              └─ Sessions
                                  └─ Participants
                                      └─ Transactions
                                          └─ Events
                                              └─ Neo insight and action
```

The hierarchy defines ownership: core owns the platform, runtime, canonical language, contracts, and governance; packs own industry terminology and workflows; connectors implement integrations; experiences and sessions are live instances.

### Conceptual platform stack

```text
Experience layer: guest, staff, management, enterprise, marketplace, and AI experiences
        ↓
LEOS: translates business intent into consistent, accessible, adaptive experiences.
Owns grammar, compiler, experience tree, dynamic renderer, design tokens,
and interaction / context / accessibility / adaptive-layout engines
        ↓
Platform runtimes: Entry, Context, Experience, Capability, plus session, identity,
workflow, connector, payment, notification, offline, security, and event runtimes
        ↓
Profile Engine: load and resolve capabilities, stations, terminology, workflows, entry methods
        ↓
Platform capabilities: identity, payments, loyalty, membership, messaging, inventory,
booking, ordering, analytics, notifications, automation, documents, and AI
        ↓
LPDK ecosystem: SDK, CLI, testing, packaging, templates, certification, publishing, marketplace
        ↓
Infrastructure: event bus, secrets, storage, search, cache, AI, observability, monitoring, security
```

### Experience Computing Category

Lekki establishes and operates within a new category: **Experience Computing**.

> **Experience Computing** is the discipline of composing, operating and evolving digital experiences that occur within physical environments through reusable capabilities, governed policies, shared identities and intelligent runtime services. Lekki is an Experience Computing Platform.

### Canonical language

All Lekki documents, schemas, APIs, and code use these terms consistently. New synonyms require an explicit architecture decision.

| Canonical term | Meaning |
| --- | --- |
| **Experience** | A governed interaction between identities, participants, capabilities, policies and physical or digital context that produces business outcomes through workflows and immutable events. |
| **Experience Pack** | An industry/domain implementation of platform concepts, such as Restaurant, Hotel, or Festival. |
| **Organisation** | The business or enterprise that owns venues, policies, profiles, and memberships. |
| **Venue** | A physical or logical place operated by an organisation. |
| **Physical Context** | A scoped place within a venue: table, room, zone, seat, queue, or future context. |
| **Experience Profile** | Versioned configuration that activates capabilities, terminology, policies, workflows, and behaviour. |
| **Session** | The central live aggregate for an experience instance. |
| **Participant** | A guest, staff member, system actor, or other party taking part in a session. |
| **Identity** | A global, consent-governed relationship between an individual and Lekki. |
| **Capability** | A provider-independent business ability that can be requested and governed. |
| **Connector** | A packaged, sandboxed implementation of capabilities and integrations. |
| **Fulfilment** | Work created to satisfy a transaction, regardless of industry. |
| **Transaction** | A commercial or operational commitment with lines, allocations, status, and lifecycle. |
| **Event** | A versioned, immutable fact about completed business activity. |

### The experience heartbeat

```text
Experience → Venue → Physical Context → Session → Participants → Transactions
→ Payments → Fulfilment → Events → Neo
```

### Runtime hierarchy

```text
Entry Runtime          # QR is the first mechanism; NFC / BLE / pass / deeplink later
    ↓
Context Runtime        # Organisation, Venue, PhysicalContext, Profile, Permissions
    ↓
Experience Runtime     # Session lifecycle, participants, pack surfaces
    ↓
Capability Runtime     # Discovers and invokes Payment, Fulfilment, …
```

Profile Engine is consulted by all runtimes. Experience Profiles are supplied by packs.

### Platform decision test

Every design review ends with one question:

> Does this change strengthen the platform, or only the Restaurant Experience Pack?

If it only strengthens the Restaurant Pack, it belongs in that pack unless a documented second use case proves it should be promoted to core.

---

## Executive Conclusion

The Restaurant Experience Pack currently implements QR entry, shared sessions, collaborative ordering, fulfilment routing, workforce coordination, payment settlement, and session close — enough to prove the LEOS heartbeat.

Lekki's target is one identity, one entry point, one payment layer, configured experiences, capability-based integrations, and Neo as an intelligence layer. The core must not inherit restaurant nouns as its public platform model.

> **Lekki core provides the reusable experience runtime. The Restaurant Experience Pack supplies restaurant vocabulary, catalogue, service surfaces, and food fulfilment.**

> **Everything else is an Experience Pack.**

---

## Reference experience (not architecture)

`C:\Restaurant App` is a **reference implementation** that validates the guest journey. It is not a codebase to migrate. LEOS is greenfield under `C:\Lekki`. Detailed model inventories and provider wiring belong in a Restaurant Pack assessment document, not here.

Capability translation (platform concept ↔ pack mapping) remains valid: Physical Context, Session, Transaction, Fulfilment Station, Payment Allocation, Assistance Request, and so on — with restaurant nouns owned by the pack.

---

## Target Lekki Platform Layers

```
+-----------------------------------------------------------------------+
|  10. Neo Intelligence: Platform Intelligence Runtime                 |
+-----------------------------------------------------------------------+
|  9.  Setup Studio: Schema-Driven Configuration Engine                 |
+-----------------------------------------------------------------------+
|  8.  Connector Runtime & Marketplace: LPDK Execution and Ecosystem    |
+-----------------------------------------------------------------------+
|  7.  Event & Workflow Engine: Decoupled Logic & Outbox Delivery       |
+-----------------------------------------------------------------------+
|  6.  Fulfilment: Generic Work Allocation and Status Orchestration     |
+-----------------------------------------------------------------------+
|  5.  Payments: Unified Settle Lifecycle and Allocation Router         |
+-----------------------------------------------------------------------+
|  4.  Commerce & Catalogue: Transaction Registry and Entitlements      |
+-----------------------------------------------------------------------+
|  3.  Experience Sessions: Session Aggregates, Timelines, offline Sync|
+-----------------------------------------------------------------------+
|  2.  Venue & Context: Location Topology and Entry Resolution          |
+-----------------------------------------------------------------------+
|  1.  Identity & Organisations: Global Tenant and Account Boundaries  |
+-----------------------------------------------------------------------+
```

Capability resolution occurs through the **Capability Runtime** and connector bindings — never through hardcoded provider switches in core.

Event delivery uses an **outbox** committed with aggregates, then published to an event bus; projections (including realtime transports) subscribe. Handlers must be idempotent; delivery is at-least-once.

---

## Initial Platform Contracts

### Capability contracts

Capabilities are declared as interfaces. The Capability Runtime selects the active connector.

- **PaymentCapability** — create, authorise, refund, settlement
- **FulfilmentCapability** — create, update status, assign

### Event contracts

Every platform event follows a standard meta-envelope (`eventId`, `eventName`, `version`, `occurredAt`, `producer`, `correlationId`, `organisationId`, `venueId`, `payload`, `privacy`).

Initial canonical events: `ExperienceStarted`, `ExperienceContextResolved`, `ParticipantJoined`, `TransactionCreated`, `FulfilmentCreated`, `FulfilmentStatusChanged`, `PaymentRequested`, `PaymentAuthorised`, `PaymentCompleted`, `PaymentFailed`, `SessionCompleted`, plus Neo recommendation events when that layer exists.

### Connector manifests

Connectors declare themselves declaratively (identity, permissions, capabilities, actions, webhooks, configuration steps). Setup Studio renders configuration from those manifests; secrets never leave the secrets enclave in plaintext.

---

## Architectural evolution

```text
Restaurant App → Restaurant Platform → Experience Platform
→ Experience Operating System (LEOS) → Distributed Experience Ecosystem
```

### Implementation order (see LEOS Implementation Roadmap)

1. Phase 1 Architectural Proof — heartbeat + thin Restaurant Pack  
2. Capability depth — real payment connectors, binding-only swap  
3. Setup Studio  
4. LPDK  
5. Marketplace  
6. Neo  

---

## Dependencies and Guardrails

- **Identity Consent & Privacy**: Global identity uses tokenized identifiers and explicit consent before sharing profile metadata with a venue.
- **Contract Stability**: Published capability contracts are locked; updates require semver.
- **Setup Studio Sandboxing**: Manifest-driven forms execute in a sandboxed environment.
- **Outbox Architecture**: At-least-once delivery; idempotent subscribers.
- **Greenfield discipline**: No code copy from the Restaurant App into LEOS core.

---

## Platform Quality Attributes

These are **design goals** for the architecture — not contractual SLOs unless published separately in a Platform SLO document.

| Attribute | Design goal |
| --- | --- |
| **Scalability** | Designed for large-scale concurrent experience execution with sub-second event propagation. |
| **Availability** | High availability for core session and payment runtimes. |
| **Security** | Zero plaintext storage of credentials; secrets in an encrypted enclave. |
| **Privacy** | GDPR and POPIA compliant; PII tokenized with explicit opt-in consent. |
| **Offline-first** | PWA queues and synchronizes actions during network disconnects. |
| **Accessibility** | Setup Studio and guest/staff surfaces target WCAG 2.1 AA. |
| **Extensibility** | Partners deploy connectors and capabilities via LPDK without modifying core. |
| **Observability** | End-to-end correlation IDs across events and logs. |
| **Multi-tenancy** | Strict logical partition; zero cross-tenant leakage. |
| **Vendor Independence** | Swap gateways and backends by changing connector bindings. |
| **AI Readiness** | Experience Knowledge Graph exposes contextual data to Neo without locking transactional stores. |
| **Schema Evolution** | Backwards-compatible changes with documented deprecation windows. |

---

## Acceptance Criteria

- **Noun Separation**: Lekki core contains no restaurant-specific domain identifiers (`table`, `menu_item`, `waiter`, `kitchen` as core nouns).
- **Pack Reusability**: The Restaurant Experience Pack reproduces the customer-to-station lifecycle using platform primitives.
- **Hot-swappable Payments**: Changing payment providers requires only connector binding updates; no platform or pack code changes.
- **Vertical Portability**: A second Experience Profile (and later a new pack) uses the same session, transaction, and payment runtimes without core modifications.
- **Event-Driven Telemetry**: Every critical business state change is published as a versioned, correlation-enabled event.

---

## The Lekki Promise

The platform guarantees:

- One global guest identity  
- One experience model  
- One capability model  
- One connector model  
- One event model  
- One runtime execution engine  
- One design system (LEOS / LEDS)  
- One marketplace ecosystem  
- One platform intelligence layer (Neo)  

**Everything else is an Experience Pack.**

---

## Source Basis

This blueprint is grounded in Lekki vision and architecture documents (`LEK-000`–`LEK-016`, Connector SDK/Runtime, Payment Connector Installation UX, Setup Studio / LEOS design). Target behaviours are architecture — not a description of any one legacy codebase. Concrete build steps live in the **LEOS Implementation Roadmap**.
