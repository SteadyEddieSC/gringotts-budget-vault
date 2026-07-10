# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not simply add another permanent top-level tab, repeated explanation, or desktop-only layout.

## Release-level UI quality gate

Every release must review:

1. **Navigation fit** — place new functionality inside an existing destination when that relationship is clear. Add a primary destination only when it represents a durable user goal.
2. **Content value** — keep text that explains a decision, risk, next action, or data limitation. Remove repeated descriptions, decorative status labels, and text that restates the visible heading.
3. **Action placement** — put actions where the user needs them. Backup belongs with Exports and guarded write workflows, not in the header or Dashboard hero.
4. **Responsive behavior** — check phone portrait, phone landscape, tablet, laptop, and wide desktop layouts. Avoid horizontal document overflow, cramped cards, and oversized or undersized controls.
5. **Feature consolidation** — group related functions under clear primary destinations and use secondary or task navigation where needed.
6. **Accessibility** — preserve keyboard navigation, visible focus, meaningful labels, adequate contrast, native controls, and screen-reader state.
7. **No informational pills** — use inline text, headings, lists, or status panels unless a compact badge communicates an actionable state.
8. **Working-control review** — test every new or moved button, picker, tab, download, and local-storage write.
9. **Print completeness** — screen simplification must not silently remove content from print or local exports.
10. **State restraint** — presentation preferences should stay in memory unless persistence creates clear user value; never create redundant transaction storage.

## Current information architecture

The v116 review reconfirmed six primary destinations:

- **Dashboard** — selected-month household overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt planning.
- **Calendar** — date-based bills, paydays, transaction activity, and cash-flow pressure.
- **Reports** — report range, one-page-at-a-time family preview, annual tracker, workbook, and local exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import / Restore, Exports & Backup, Diagnostics, and Roadmap.

No primary destination was added or removed in v116.

## Task navigation decisions

### Reports

Reports should separate:

1. choosing the data range;
2. previewing the family report;
3. downloading an export.

The eight report pages remain one report, not eight navigation destinations. A native select and Previous / Next controls are appropriate on screen. Print and PDF output must include every page.

### Import and restore

Incremental transaction import and full vault restore share a Tools subsection but are different tasks:

- import adds reviewed missing rows;
- restore replaces the destination vault.

They should not appear as one uninterrupted workflow. Task controls must state the consequence clearly and preserve the existing guarded engines.

## Responsive navigation

- Desktop uses a six-destination navigation row.
- Phone and tablet use a compact menu opened from the header.
- Secondary sections use rectangular controls, not decorative pills.
- A secondary row may scroll horizontally on a narrow phone when stacking would create oversized navigation.
- Dense tables remain scrollable inside their own containers instead of forcing the page to overflow.
- Calendar detail stacks below the month grid on smaller screens.
- Report-download cards use three, two, or one columns according to available width.

## v116 architecture review result

The review concluded:

- six primary destinations remain the correct number;
- the persistent shell should remain unchanged;
- Reports needed progressive presentation, not another tab;
- Import / Restore needed explicit task separation, not another primary destination;
- Activity phone subnavigation needed compact overflow behavior;
- the v115 import engine and v111 runtime should remain authoritative;
- a small idempotent presentation layer is preferable to another whole-page runtime.

## Larger overhaul cadence

A deeper UI architecture review should occur approximately every **10 releases**, with an acceptable range of **10–20 releases** depending on feature growth.

The review should happen earlier when any threshold is reached:

- more than 7 primary destinations;
- repeated horizontal overflow or mobile usability defects;
- two or more pages serving the same user goal;
- major actions appearing in three or more unrelated locations;
- page copy requiring repeated explanation;
- new features being placed under Tools because no appropriate destination exists;
- navigation or layout regressions becoming recurring release issues.

The next scheduled deeper review is approximately v126, with an acceptable v126–v136 range. It should occur earlier if these thresholds are met.

## Architecture boundaries

- Local-first transaction processing.
- No transaction uploads.
- No service-worker registration or offline cache.
- One live ES-module runtime chain.
- Never auto-save an empty vault.
- Preserve best-populated readable vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve the stable v105 rescue page.
