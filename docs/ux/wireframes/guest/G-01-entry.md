# G-01 Entry — State wireframes (Stage 1)

**Screen:** Entry  
**Runtime:** Entry Runtime  
**Pack:** Restaurant (branding/content only)  
**Grammar:** Guest  
**Fidelity:** Stage 1 (boxes only)

---

## G-01.available

**Intent:** Admit the guest via a trusted entry interaction.  
**State:** Available (token / profile choosable)

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Context Banner            │
├───────────────────────────┤
│ Main Content              │
│  [ Profile card ]         │
│  [ Profile card ]         │
│  [ Name field ]           │
├───────────────────────────┤
│ Primary Action            │
│  Continue                 │
└───────────────────────────┘
```

**Components:** Session Header · Selection Card · Form Section · Bottom Action Bar · Neo Dock  
**Actions:** Continue → `ResolveEntry` → `ExperienceStarted`, `ExperienceContextResolved`  
**Navigation:** → G-02 Join  

---

## G-01.loading

**Intent:** Same. **State:** Resolving token / context.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Main Content              │
│  [ Loading ]              │
├───────────────────────────┤
│ Primary Action            │
│  (disabled)               │
└───────────────────────────┘
```

**Actions:** none  
**Navigation:** auto → G-02 on success · G-01.error on failure  

---

## G-01.error

**Intent:** Honest failure; allow retry. **State:** Invalid / expired token.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Context Banner (error)    │
├───────────────────────────┤
│ Main Content              │
│  [ Error message ]        │
├───────────────────────────┤
│ Primary Action            │
│  Start fresh              │
└───────────────────────────┘
```

**Actions:** Start fresh (clear + retry)  
**Navigation:** stay G-01  

---

## G-01.offline

**Intent:** Never lose context. **State:** Offline.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Context Banner (offline)  │
├───────────────────────────┤
│ Main Content              │
│  [ Queued / retry hint ]  │
├───────────────────────────┤
│ Primary Action            │
│  Retry when online        │
└───────────────────────────┘
```

---

## G-01.denied

**Intent:** Permission / venue closed. **State:** Permission denied or venue closed.

```text
┌───────────────────────────┐
│ Header                    │
├───────────────────────────┤
│ Context Banner            │
├───────────────────────────┤
│ Main Content              │
│  [ Cannot enter ]         │
├───────────────────────────┤
│ Primary Action            │
│  Leave                    │
└───────────────────────────┘
```

**Next inventory item:** G-02 Join (states), then G-03 Menu states — do not skip ahead to Waiter/Kitchen.
