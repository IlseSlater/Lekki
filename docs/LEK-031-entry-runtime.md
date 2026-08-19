# LEK-031 — Entry Runtime Manual

**Status:** Active (Platform stream) v0.1  
**Runtime:** Entry Runtime  
**Package:** [`packages/runtime/entry`](../packages/runtime/entry)  
**Contracts:** [`packages/contracts/src/entry.ts`](../packages/contracts/src/entry.ts)  
**Constitution:** [LEK-001](LEK-001.md) Platform Rule — Entry is the first runtime in the hierarchy  
**Interactions:** [LEK-027](LEK-027-experience-interaction-catalogue.md) Guest Flow G-01, System Journeys QR Entry / QR expired / Venue closed

This is an **implementation manual**, not a vision essay. Engineers implement and extend Entry from this document.

---

## 1. Responsibilities

| Owns | Does not own |
|------|----------------|
| Resolving an **entry token** to organisation, venue, physical context, and profile ref | Session lifecycle (Experience Runtime) |
| Validating entry **method** (QR first; NFC/BLE/pass/deeplink later) | Terminology / UX copy (Profile Engine) |
| Rejecting invalid, inactive, or unsupported tokens | Payment / fulfilment (Capability) |
| Emitting the facts needed for `ExperienceStarted` / context resolve handoff | Rendering UI (LEOS shell / LEK-028) |

**One-liner:** Entry answers *“Who/what does this scan mean in the physical world?”* before a session exists.

---

## 2. Position in the hierarchy

```text
Entry Runtime          ← this manual
    ↓
Context Runtime        (LEK-032 — validates/enriches resolved context)
    ↓
Experience Runtime     (LEK-033 — session + participants)
    ↓
Capability Runtime     (LEK-034)
```

Profile Engine is consulted for profile ref meaning after Entry returns `profileRef`.

---

## 3. Inputs

| Input | Type | Notes |
|-------|------|-------|
| `token` | string | Opaque entry token (QR payload / deeplink id) |
| `entryMethod` | `'qr'` (extensible) | Phase 1: QR only |

Contract: `EntryResolutionRequest`.

---

## 4. Outputs

| Output | Type | Notes |
|--------|------|-------|
| `organisationId` | id | Tenant |
| `venueId` | id | Venue |
| `physicalContextId` | id | Table / room / bay / etc. (platform noun) |
| `profileRef` | `{ profileId, version }` | Experience Profile to load |

Contract: `EntryResolutionResult`.  
Errors: `Result` err string (e.g. unsupported method, invalid/inactive token).

Repository port: `EntryTokenRepository.findByToken` → `EntryTokenRecord | null`  
Record fields: token, organisationId, venueId, physicalContextId, profileId, profileVersion, active.

---

## 5. Commands

| Command | API shape (host) | Runtime method | Success | Failure |
|---------|------------------|----------------|---------|---------|
| `ResolveEntry` | `POST /entry` (or session-start that includes resolve) | `EntryRuntime.resolve` | `EntryResolutionResult` | Invalid token · inactive · unsupported method |

**Not Entry commands:** `JoinSession`, `CreateTransaction`, `RequestPayment` — those belong to Experience / Capability.

---

## 6. Events

Entry itself may not persist events; the **host / Experience Runtime** emits after a successful resolve + start:

| Event | When | Privacy |
|-------|------|---------|
| `ExperienceStarted` | Experience begins after successful entry path | INTERNAL |
| `ExperienceContextResolved` | Context accepted post-entry | INTERNAL |

Entry must not invent restaurant events. QR expired / venue closed are **error outcomes** surfaced to LEK-027 System Journeys (may become typed errors in a later contract revision).

---

## 7. Permissions

| Actor | Permission | Notes |
|-------|------------|-------|
| Public guest | none | QR resolve is public |
| Staff deep-link entry | future | May require staff principal |

No `setup.studio` involvement.

---

## 8. Extension points

| Extension | How | Forbidden |
|-----------|-----|-----------|
| New entry methods | Extend `entryMethod` union + resolve branch; keep token repository port | Hardcoding “table QR” restaurant logic in Entry |
| Token sources | Swap `EntryTokenRepository` implementation (DB, edge cache) | Pack-specific SQL inside `EntryRuntime` class |
| Expiry / venue closed | Return typed errors; UI maps via LEK-027 | Embedding LEDS or Angular in the package |
| Profile binding | Return `profileRef` only; Profile Engine loads definition | Loading terminology inside Entry |

---

## 9. Public interfaces (current)

```typescript
class EntryRuntime {
  constructor(tokens: EntryTokenRepository)
  resolve(request: EntryResolutionRequest): Promise<Result<EntryResolutionResult>>
}
```

See package source for `EntryTokenRecord` / `EntryTokenRepository`.

---

## 10. Failure → Interaction map

| Runtime failure | LEK-027 surface |
|-----------------|-----------------|
| Unsupported method | Entry screen Error |
| Invalid / inactive token | QR Entry Error · System Journey QR expired / invalid |
| (future) Venue closed | Context Banner + System Journey Venue closed |
| Offline | Offline Recovery (client); retry ResolveEntry |

---

## 11. Test checklist

- [ ] Valid QR token → ok result with org/venue/context/profileRef  
- [ ] Unknown token → err  
- [ ] Inactive token → err  
- [ ] Non-QR method → err  
- [ ] Repository swap does not require changing `EntryRuntime` logic  
- [ ] No import from `packs/restaurant` inside Entry package  

---

## 12. Related manuals (platform stream)

| ID | Runtime |
|----|---------|
| LEK-032 | Context Runtime (next) |
| LEK-033 | Experience Runtime |
| LEK-034 | Capability Runtime |
| LEK-035 | Profile Engine |

*End of LEK-031 v0.1.*
