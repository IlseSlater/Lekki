# Live Experience — Studio first-class surface



**Status: Frozen**  

**Governs:** LEOS Studio Setup (and later Operate glance)  

**Aligned with:** [LEK-040](../LEK-040-human-experience-engineering.md) · [Studio Design System v1](studio-design-system.md) · [IA shells](ia-experience-studio-shells.md) · [studio-setup-emotion-research.md](studio-setup-emotion-research.md) · [Blueprint SECTION 3A — no-drift contract](LEOS-Studio-Design-Blueprint.md#section-3a--studio--live-experience--guest-interaction-contract) · [Experience Interaction Craft](experience-interaction-craft.md)



---



## Principles (frozen)



1. **Every configuration change in LEOS Studio must immediately update the Live Experience using the same Experience Shell that guests will use after Go Live.**



2. **Never Ask a Human to Imagine** ([LEK-040](../LEK-040-human-experience-engineering.md)) — if an owner must mentally simulate the guest outcome, the design isn’t finished.



Not a mock. Not a second UI. Not “preview mode.” Not a navigation destination.

**Studio Live projection** uses the same Guest shell grammar as production — pack catalogue · Orders · payment nouns (Menu · Board · Services · … / Bill · Tab · Folio · …) — same moments, same tabs.



```text

Studio edits  →  Live Experience (Experience Shell)  →  Go Live (same shell, public)

```

**Contract:** If Studio, Live Experience, and Guest disagree, the feature is not complete — [Blueprint SECTION 3A](LEOS-Studio-Design-Blueprint.md#section-3a--studio--live-experience--guest-interaction-contract).



One renderer · one shell · one source of truth.



**Studio doesn’t generate previews. Studio edits the experience.**



---



## Naming



| Do not say | Say |

|------------|-----|

| Preview | **Live Experience** |

| Preview mode | *(deleted concept)* |

| Preview button / Live Experience page | *(forbidden — it simply exists)* |

| Guest mockup / phone toy | Live Experience |

| Theme builder / canvas | *(forbidden)* |



Optional synonyms in copy only when needed: **Guest Experience** · **Customer View**. Chrome label on the permanent panel: **Live Experience**.



---



## Product role



Live Experience is **not** a Setup step and **not** in left navigation.



It is permanent Studio chrome — always beside configuration (Shopify-style: you don’t “go to Preview”).



```text

┌ Studio ──────────────────────────────── Live ● ─┐

│ Who you are          │                          │

│ What guests experience│   Live Experience       │

│ Where they join      │   (Experience Shell)     │

│ How they pay         │                          │

│ Go Live              │                          │

└──────────────────────┴──────────────────────────┘

```



Setup nav tells a **human story** — each step answers one question.



Owners **change something → see it instantly → feel confident → publish**.



Go Live is inevitable: nothing about the experience changes — only reach (QR / public session).



---



## Confidence (not completion)



Measure Setup against **guest confidence**, not checklist ticks:



| Step | Confidence language |

|------|---------------------|

| Who you are | Guests will see · {name} · ✓ Looks great |

| What guests experience | Guests can · {options} · ✓ Looks great |

| Where they join | {n} places ready · ✓ Guests know where to join |

| How they pay | Card · Apple Pay… · ✓ Guests can pay confidently |



---



## Emotional model



| Legacy software | LEOS Studio |

|-----------------|-------------|

| Configure → Save → Publish → Hope | Change → See → Trust → Go Live |



---



## Interaction rules



1. Instant update on every material Studio change.  

2. Same Experience Shell grammar guests use — Pack supplies content.  

3. Optional fullscreen from the panel itself — never a nav item.  

4. Reject freeform builders.  

5. Auto-save; never “Refresh preview.”



---



## Implementation notes



- Host: Setup Engine hosts Live Experience beside step content.  

- Confidence indicators on each Setup step.  

- Go Live opens the **same** shell via Entry/session.



---



*Change policy: principles frozen. Visual density may refine; dual-renderer / fake preview / Live Experience as a route requires ADR.*


