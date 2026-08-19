# LEOS Experience Heartbeat — Reference Implementation Checklist

**Milestone:** Experience Heartbeat Reference Implementation  
**Governed by:** [BUILDING-LEOS.md](BUILDING-LEOS.md) (code follows IR interactions)  
**Pack used:** Restaurant Experience Pack (first implementation, not the platform centre)  
**UX contract:** [LEK-029 §3 Guest](LEK-029-experience-composition.md) (Frozen for this milestone)  
**Second-profile proof:** Cafe (`qr-demo-cafe`) — same runtimes, no core changes

This is **not** a LEK. It is the acceptance checklist for declaring the heartbeat complete.

Clone `C:\Lekki`, run `pnpm run dev`, and walk the path below.

---

## Heartbeat path

```text
Scan QR
  → Entry Runtime
  → Context Runtime resolves
  → Experience Profile loads
  → Experience Session starts
  → Guest joins
  → Browse Menu
  → Configure Item
  → Submit Transaction
  → Fulfilment created
  → Kitchen board updates
  → Manual Payment (or bound connector)
  → Session closes
```

---

## Acceptance checklist

### Runtime path

- [ ] QR / demo token enters experience (`/entry`)
- [ ] Context resolves (organisation, venue, physical context)
- [ ] Experience Profile loads (label + terminology)
- [ ] Session created
- [ ] Participant joins
- [ ] Menu loads from catalogue (profile/venue scoped)
- [ ] Item can be configured (quantity) before cart
- [ ] Transaction created (`CreateTransaction`)
- [ ] Fulfilment created and routed to station
- [ ] Kitchen board receives ticket (`/station/kitchen` or bar)
- [ ] Fulfilment status can advance (Preparing → Ready → Served)
- [ ] Payment completes (manual connector default)
- [ ] Session closes
- [ ] Physical context released for next guest

### Events & correlation

- [ ] Canonical events emitted (at least): `ExperienceStarted` / context resolve path, `ParticipantJoined`, `TransactionCreated`, `FulfilmentCreated`, `FulfilmentStatusChanged`, `PaymentRequested`, `PaymentCompleted`, `SessionCompleted`
- [ ] Correlation ID preserved across the session
- [ ] Guest live event list (or timeline) reflects platform events

### LEOS integrity

- [ ] No restaurant nouns in core packages (`packages/runtime`, `packages/contracts`, `packages/domain`)
- [ ] Restaurant terminology comes from Profile Engine / pack
- [ ] Same runtime works for **second Experience Profile** (Cafe) with **no runtime/component/capability code changes** — only profile/token selection

### UX contract (LEK-029)

Every Guest heartbeat screen has:

- [ ] Intent
- [ ] Components (LEK-028)
- [ ] Actions → Command → Events
- [ ] Navigation / Routes
- [ ] Runtime owner

Screens in scope: Entry · Join · Menu · Item Detail · Cart · Live Order · Payment · Receipt · Exit

---

## How to declare done

When every box above is checked against a fresh clone + `pnpm run dev`, mark:

**Heartbeat v1 — Complete**

Documentation after that only clarifies what the implementation proves — it does not speculate further architecture.

---

## Out of scope for this milestone

Setup Studio · Marketplace · Neo · Hotel · Festival · LPDK · full runtime manuals · Prisma redesign · PayFast (optional; manual payment is enough)
