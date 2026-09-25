# ADR-005: One Loading Policy

## Status

Accepted — 16 September 2026. Supersedes nothing; codifies a rule that was already
half-written in code.

## Context

`apps/web` decides twice what the browser downloads, in two files, and until now the
two disagreed.

`signin-preload.strategy.ts` carries a measured decision:

> `/** Warm Studio sign-in only. Preloading every lazy page freezes Login. */`

`ngsw-config.json` carried the opposite:

```json
{ "name": "app", "installMode": "prefetch", "resources": { "files": ["/*.js"] } }
```

`installMode: "prefetch"` over `/*.js` means the service worker downloads **every
chunk in the app** on install — Studio, Guest, Operate, the setup engine — for a
visitor who landed on `/` and may never sign in. The router's restraint was real and
the service worker cancelled it. The service worker runs only in the production
configuration, so it never showed in development.

Nobody chose this. It is what happens when one policy lives in two places.

## Decision

> **The router decides what is warmed. The service worker decides what is offline.
> Neither may decide the other.**

Corollaries:

1. **Preload strategy = intent.** Exactly one route is warmed after boot: `signin`.
   Adding a second requires a reason in the strategy's own comment.
2. **Service worker = availability, not eagerness.** Only the shell is `prefetch`:
   `index.html`, CSS, `main*.js`, `polyfills*.js`. Route chunks are `lazy` with
   `updateMode: "prefetch"` — never fetched until used, kept fresh once cached.
3. **A glob is a policy.** `"/*.js"` is not a file list, it is a decision about every
   future chunk. Name what you mean: `/main*.js`, `/chunk-*.js`.
4. **Live data is never cached.** `dataGroups` stays empty. The guest path polls every
   3 s and the Operate boards read fulfilment state; a stale order is worse than a
   missing one. Offline behaviour for writes belongs to `offline-queue.ts`, not to
   the service worker.
5. **Both files change together, or neither.** A change to one without the other is
   the bug this ADR exists to prevent.

## Consequences

- A marketing visitor downloads the shell and the landing chunk. Nothing else.
- Studio's first navigation costs one chunk fetch. That is the trade, and it is the
  right one — `signin` is already warmed by the router.
- `brand/**` is now cached lazily; previously it was not cached at all.
- The production budget in `angular.json` (initial: warn 1 MB, error 2 MB) only means
  something once CI runs a build. It does not yet. That is open work, not a decision.

## Related

- `apps/web/src/app/signin-preload.strategy.ts` — the router half
- `apps/web/ngsw-config.json` — the service-worker half
- [web-performance-audit.md](../web-performance-audit.md) — the measurement that found it
- [ADR-002](002-platform-rule.md) — one owner per decision
