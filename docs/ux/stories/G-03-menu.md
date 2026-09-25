# Story: G-03 — Menu (Browse)

| | |
|--|--|
| **Maturity** | **L6 Frozen** — Browse HCI depth shipped |
| **Journey** | Experience — Browse |
| **Spec** | [menu.md](../wireframes/guest/menu.md) (archaeology) · running: `guest.page.ts` `phase === 'browse'` |
| **Evidence** | [browse-hci.md](../evidence/browse-hci.md) |

Dock tab **Menu**. Also serves as the landing phase after Get started (first visit) or after splash (returning / still-in) — first Get started always lands on Menu, not Specials.

### Five questions

| # | Answer |
|---|--------|
| 1 | Guest visit — deciding what to order |
| 2 | Any diner, first-time or returning |
| 3 | Catalogue API (existing) · `leos-menu-card` · category + search chips |
| 4 | Section headings, scrollable category chips, search with clear / "show everything" recovery |
| 5 | Any Pack — category/search chips are catalogue-driven, not Restaurant-specific |

### Acceptance

```text
Given a guest is on the menu with more than one category
When they tap a category chip
Then the list filters to that category, with "All" always available
Given a guest searches with no matches
When the empty state shows
Then they can clear the search or "show everything" — never a dead end
Given the catalogue is still loading
When browse renders
Then a loading line shows, not a blank screen
```

Specials is a separate dock tab (`phase === 'specials'`), not a Menu sub-state — `preferSpecialsLanding` is cleared, per §9 of the map.

**Next slice:** Continuity polish if named — Browse HCI shipped.
