# ADR-004: Three Human Experiences

## Status

**Accepted** — 2026-08-07  
Supersedes the “two customer surfaces only” clause in [IA — Experience × Studio](../ux/ia-experience-studio-shells.md) for *who* uses LEOS. Does not invent new runtimes or packs.

## Context

We nested Kitchen · Bar · Waiter boards inside **Studio Operate**, which forced floor staff through owner chrome (Setup · Grow · Team-adjacent nav). That conflates three humans with different goals:

| Human | Goal |
|-------|------|
| **Owner** | Run the business |
| **Staff** | Do their job |
| **Guest** | Enjoy the visit |

Trying to satisfy all three in one shell creates complexity and violates [LEK-040](../LEK-040-human-experience-engineering.md): every person sees only the world that matters to them.

Restaurant App *behaviour* (admin vs staff vs customer apps) validates the split ([ADR-003](003-reference-experience-rule.md)) — it does not dictate LEOS implementation.

## Decision

**LEOS has three human experiences on one platform.**

```text
                    LEOS
            ┌──────────────┐
            │ Core Platform │
            └──────┬───────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
   Owner         Staff          Guest
 LEOS Studio  Staff Experience  Experience
```

### 1. LEOS Studio — Owner / manager / administrator

Mission control for the business.

- Setup (Identity · Experience · Places · Payments · Go Live) — **v1 frozen**
- **Operate** = **Operations Overview** (calm oversight — not the kitchen tablet)
- **Grow** = trusted manager truth
- **Team** = first-class: staff · roles · permissions · devices · PINs · login history · active sessions
- Owner sees everything they need to run the business

Studio never is the place where a chef marks “ready” under pressure.

### 2. LEOS Staff Experience — Employees

The Guest Experience’s sibling for people who work.

- Own shell · own entry (e.g. PIN / staff login)
- **Never** shows: Setup · Identity · Payments · Grow · Reports · Team · Permissions
- Lands immediately in the **Experience assigned** to that person (Kitchen · Bar · Waiter / Floor · …)
- Role = primary Experience; permissions refine actions within it
- Shared devices: PIN → person → Experience (device stays; experience changes)

### 3. LEOS Experience — Guests

Unchanged.

- QR → join → experience → leave
- Guests never learn Studio or Staff exist

### Permissions as Experience Assignment

Owner assigns **Experiences** first, then refines with permissions (not a blank ACL matrix).

Example: Sarah → Waiter Experience · view own tables · take payment · … · not refund · not staff management.

### Operate (Studio) renamed in meaning

**Operate = Operations Overview** for owners.  
**Staff Experience = where work happens.**

```text
Studio → Manage the business.
Staff Experience → Do the work.
Guest Experience → Enjoy the visit.
```

This scales beyond restaurants (hotel · airport · healthcare · festival) without changing the human model.

## Consequences

### Must do

1. Separate **Staff Experience shell** from Studio shell (routes, chrome, auth gate).
2. Promote **Team** in Studio (create staff · assign Experience · permissions · devices).
3. Reposition Studio **Operate** as oversight / monitoring (open Staff Experience in *monitor* mode if needed — not staff UI).
4. Enforce Experience assignment on routes and APIs (harder isolation than Restaurant App UI redirects).
5. Update IA language: three humans · three experiences · one platform.

### Must not

- Invent a fourth product or Marketplace for this.
- Put Setup / Grow / Team into Staff chrome.
- Treat Staff PIN as a new *platform identity* model ([LEK-038](../LEK-038-behaviour-inventory.md)) — keep pack/org-scoped staff auth; Studio owner auth stays separate.
- Copy Restaurant Admin code ([ADR-001](001-no-copy-from-restaurant-app.md)).

### Interim (until Staff shell ships)

~~Current `/studio/kitchen|bar|waiter` boards remain proof~~ — **shipped:** Staff shell at `/staff/*`; Studio Operate is Operations Overview; Team is Experience Assignment.

## Related

- [LEK-040](../LEK-040-human-experience-engineering.md) — Human Experience Engineering  
- [ADR-003](003-reference-experience-rule.md) — Restaurant validates behaviour, not architecture  
- [IA](../ux/ia-experience-studio-shells.md) — updated for three experiences  
- Mobbin refs (UX): Shopify Users & permissions · role-specific worker apps (Dasher-like) · employee PIN login flows  

## Decision owner

Product — accepted in conversation 2026-08-07 as a foundational architecture choice.
