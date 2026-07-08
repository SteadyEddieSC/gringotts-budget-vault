# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not simply add another permanent top-level tab, another repeated explanation, or another desktop-only layout.

## Release-level UI quality gate

Every release must review:

1. **Navigation fit** — place new functionality inside an existing destination when that relationship is clear. Add a primary destination only when it represents a durable user goal.
2. **Content value** — keep text that explains a decision, risk, next action, or data limitation. Remove repeated descriptions, decorative status labels, and text that restates the visible heading.
3. **Action placement** — put actions where the user needs them. Backup belongs with Exports and the guarded Restore workflow, not in the header or Dashboard hero.
4. **Responsive behavior** — check phone portrait, phone landscape, tablet, laptop, and wide desktop layouts. Avoid horizontal page overflow, cramped two-column cards, and undersized touch targets.
5. **Feature consolidation** — group related functions under clear primary destinations and use secondary navigation where needed.
6. **Accessibility** — preserve keyboard navigation, visible focus, meaningful labels, adequate contrast, and screen-reader descriptions for interactive controls.
7. **No informational pills** — use normal inline text, headings, lists, or status panels unless a compact status badge is necessary for an actionable state.
8. **Working-control review** — test every new or moved button, picker, tab, download, and local-storage write.

## Current information architecture

v106 establishes six primary destinations:

- **Dashboard** — selected-month household overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, and paydays.
- **Calendar** — date-based bills, paydays, transaction activity, and cash-flow pressure.
- **Reports** — spouse-facing annual tracker, deeper Vault Workbook, and family summaries.
- **Activity** — transaction ledger and rules review.
- **Tools** — Import/Restore, Exports & Backup, Diagnostics, and Roadmap.

## Responsive navigation

- Desktop uses a six-destination navigation row.
- Phone and tablet use a compact menu opened from the header.
- Secondary sections use rectangular subnavigation, not pill-shaped controls.
- Dense tables remain scrollable inside their own containers instead of forcing the entire page to overflow.
- Calendar detail stacks below the month grid on smaller screens.

## Larger overhaul cadence

A deeper UI architecture review should occur approximately every **10 releases**, with an acceptable range of **10–20 releases** depending on feature growth.

The review should happen earlier when any of these thresholds are reached:

- more than 7 primary destinations;
- repeated horizontal overflow or mobile usability defects;
- two or more pages serving the same user goal;
- major actions appearing in three or more unrelated locations;
- page copy that requires repeated explanation to understand;
- new features being placed under Tools because no appropriate destination exists;
- navigation or layout regressions becoming a recurring release issue.

The next scheduled architecture review after v106 is v116, unless an earlier threshold is reached.

## Architecture boundaries

- Local-first transaction processing.
- No transaction uploads.
- No service-worker registration or offline cache.
- One live ES-module entry runtime.
- Never auto-save an empty vault.
- Preserve best-populated readable vault selection.
- Keep backup-first restore safeguards.
