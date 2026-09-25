# Story: S-12 — Catalogue (what guests order)

| | |
|--|--|
| **Maturity** | **L4 Running** — walk owned |
| **Journey** | Provider — edit browse after Go Live (not a sixth Setup step) |
| **Spec** | [lifecycle-and-screen-map.md](../lifecycle-and-screen-map.md) §12 |
| **Evidence** | [catalogue-menu.md](../evidence/catalogue-menu.md) |

S-03 stays “what guests can do” (toggles). This story is the priced list they browse.

### Five questions

| # | Answer |
|---|--------|
| 1 | Owner → Live phone → Guest browse |
| 2 | Owner changing tonight’s list; diner choosing |
| 3 | Existing catalogue APIs · CatalogueLiveService bump |
| 4 | 86’d items leave Guest; phone on `/studio/menu` shows the list, not arrival |
| 5 | Item / catalogue nouns from Experience registry |

### Acceptance

```text
Given I open /studio/menu with a live venue
When the desk phone hydrates
Then it shows the browse shell with venue catalogue — not Identity arrival
When I mark an item off tonight
Then Guest browse omits it
When I save
Then the phone reloads (catalogue revision)
```

**Next:** Continuity polish if named. Do not add a Setup step.
