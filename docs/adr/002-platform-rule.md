# ADR-002: Platform Rule

## Status

Accepted — binds the **Frozen** [LEK-001 Platform Constitution](../LEK-001.md). Clarifications or exceptions require a new ADR.

## Decision

Every new feature must first answer:

> Does this belong in the **Entry Runtime**, **Context Runtime**, **Experience Runtime**, **Capability Runtime**, **Profile Engine**, **Experience Pack**, or **Connector**?

If the answer is unclear, the feature is not ready to build.

## Runtime hierarchy

```text
Entry Runtime
    ↓
Context Runtime
    ↓
Experience Runtime
    ↓
Capability Runtime
```

Profile Engine is consulted by all runtimes. Experience Profiles are supplied by packs; Setup Studio will edit the same profiles in a later phase.
