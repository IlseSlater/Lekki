# Guest Experience — Evidence

**Governed by:** [LEK Build Loop](../../BUILDING-LEOS.md)  
**Rule:** Produce evidence — not more planning documents. This folder is the history of LEOS.

```text
docs/ux/evidence/guest/{screen}/
  README.md            # Uncertainty removed · event trace · index
  review-notes.md      # Design Critique · Experience Review
  wireframe.png        # Optional state boxes
  running-ui.png       # One per major state (or named variants)
  playwright.gif       # Or link to test run
  event-trace.json     # Optional machine-readable chain
```

Future contributors should see: here’s the spec · here’s what we built · here’s why.

| Screen | Folder | Uncertainty removed | Status |
|--------|--------|---------------------|--------|
| G-01 Entry | [entry/](entry/) | Am I in the right place? | Pending |
| G-02 Join | [join/](join/) | Am I part of this experience? | Pending |
| G-03 Menu | [menu/](menu/) | What can I do? | Pending |
| G-04 Item | [item/](item/) · [g04-choices-sheet](../g04-choices-sheet.md) | What am I choosing? | Proven |
| G-05 Cart | [cart/](cart/) | What am I about to commit to? | Pending |
| G-06 Live Order | [live-order/](live-order/) | Is everything progressing? | Stub (IR) |
| G-07 Payment | [payment/](payment/) | Did payment work? | Pending |
| G-08 Receipt | [receipt/](receipt/) | Is the experience complete? | Pending |
| G-09 Leave | [leave/](leave/) | Am I done? | Pending |

Create the folder when Build starts for that screen. Do not invent screenshots before IR + Critique.
