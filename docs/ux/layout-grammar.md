# LEOS Layout Grammar

**Status:** Active  
**Depends on:** [LEOS Experience Design Principles](LEOS-experience-design-principles.md)  
**Purpose:** Shared screen anatomy — a grammar, not pages.

Every surface family reuses the same regions. Packs fill content; they do not invent new chrome.

---

## Guest (mobile-first) — wireframe rhythm

Low fidelity only: boxes and hierarchy. No colour, type polish, or motion until Guest Frozen.

Most Guest screens follow this rhythm (~80% of LEOS surfaces):

```text
┌────────────────────────────┐
│ Context                    │  Session / purpose / alerts
├────────────────────────────┤
│ Primary Content            │
│                            │
├────────────────────────────┤
│ Status / Guidance          │  Progress · trust · help
├────────────────────────────┤
│ Primary Action             │  One clear next step
└────────────────────────────┘
         [Neo Dock]
```

Mapped regions (same grammar):

```text
┌───────────────────────────┐
│ Header                    │  Session / purpose
├───────────────────────────┤
│ Context Banner            │  Venue · Physical Context · alerts
├───────────────────────────┤
│ Main Content              │
│                           │
├───────────────────────────┤
│ Status / Guidance         │  Optional — timeline, chips, hints
├───────────────────────────┤
│ Primary Action            │  Bottom Action Bar
└───────────────────────────┘
```

**Postpone:** animations, micro-interactions, decorative transitions ([BUILDING-LEOS](../BUILDING-LEOS.md)).

---

## Kitchen / Station (operator)

```text
┌───────────────────────────┐
│ Header                    │  Station identity
├───────────────────────────┤
│ Filters                   │
├───────────────────────────┤
│ Board                     │  Tickets / columns
├───────────────────────────┤
│ Actions                   │  Large touch targets
└───────────────────────────┘
```

---

## Manager

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ KPIs                      │
├───────────────────────────┤
│ Content                   │
├───────────────────────────┤
│ Actions                   │
└───────────────────────────┘
```

*(Manager remains intentional gap until Guest heartbeat is complete.)*

---

## Setup Studio

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Stepper                   │
├───────────────────────────┤
│ Configuration             │
├───────────────────────────┤
│ Validation                │
├───────────────────────────┤
│ Save / Continue           │
└───────────────────────────┘
```

---

## Rules

1. **Header** always answers Context first (where am I?).  
2. **Primary Action** is always in the bottom region on Guest; never buried mid-scroll without a sticky bar.  
3. **Main Content** holds one job only (progressive disclosure).  
4. Do not invent a fifth family without amending this grammar.
