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
10. **State restraint** — persistent state must create clear user value and must not duplicate transaction contents.
11. **Explain remembered choices** — automatically restored settings must identify their source and remain immediately editable.
12. **No silent compatibility guesses** — reusable profiles may apply automatically only when one exact-compatible match exists.
13. **No silent portable merges** — every imported profile definition must expose a reviewed Add, Replace, or Skip decision.
14. **Consequence-first destructive controls** — Replace, Delete, Restore, and transaction writes must be visually and textually distinct from ordinary edits.

## Current information architecture

The v116 review reconfirmed six primary destinations:

- **Dashboard** — selected-month household overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt planning.
- **Calendar** — date-based bills, paydays, transaction activity, and cash-flow pressure.
- **Reports** — report range, one-page-at-a-time family preview, annual tracker, workbook, and local exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import / Restore, Exports & Backup, Diagnostics, and Roadmap.

v118 does not add or remove a primary destination. Mapping profiles and profile portability belong inside Tools → Import transactions because they configure that existing task rather than representing a new household goal.

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

### Saved profile library and portability

The saved-profile library is configuration for Import, not another top-level task.

It should appear before a transaction export is selected because a user may need to:

- review existing profile names and destination labels;
- export sanitized definitions;
- inspect and import a profile bundle;
- resolve naming or identity conflicts.

The library should distinguish:

- user-facing profile name;
- destination account label;
- recognized source pattern or schema;
- non-reversible header identity.

Dense profile data belongs in a labeled, focusable table container that scrolls internally rather than widening the document.

### Portable profile conflict review

Selecting a bundle must create a preview rather than immediately writing storage.

Each imported definition must show:

- its proposed name;
- source format, pattern, and non-reversible identity;
- destination label;
- classification and explanation;
- mapping or option differences when a saved comparison exists;
- a native Add, Replace, or Skip select;
- an editable local name;
- a replacement-target select only when identity-matched candidates exist.

Exact and same-definition matches should default to Skip. Replace must remain unavailable when no identity-matched target exists. Acknowledgement and final confirmation must state that only profile metadata changes.

Bundle filenames may be displayed during review but must not be persisted.

### Mapping profiles

The mapping-profile UI appears after a supported export is inspected.

It must:

- keep the current mapping controls visible and editable;
- use native selects and inputs;
- state that profiles contain metadata only;
- show how many profiles are compatible and saved;
- identify when a profile is applied;
- warn when current settings differ from the applied profile;
- require an explicit choice when multiple profiles match;
- explain incompatibility rather than approximating a match;
- keep Save, Update, New, Apply, Delete, and Clear consequences distinct.

Profile deletion must explicitly state that transaction data is not changed.

### Field explanations

Field-level text should explain validation or downstream meaning without duplicating the normalized preview. It should remain adjacent to the mapped field and use text rather than color alone for good, warning, error, informational, and optional states.

## Responsive navigation and density

- Desktop uses a six-destination navigation row.
- Phone and tablet use a compact menu opened from the header.
- Secondary sections use rectangular controls, not decorative pills.
- A secondary row may scroll horizontally on a narrow phone when stacking would create oversized navigation.
- Dense tables remain scrollable inside their own containers instead of forcing the page to overflow.
- Calendar detail stacks below the month grid on smaller screens.
- Report-download cards use three, two, or one columns according to available width.
- Mapping-profile and portable-bundle fields use multiple columns when space permits and one column on phones.
- Profile action buttons may wrap on larger screens and must become full-width stacked controls on narrow phones.
- Portable comparison details should collapse in a native `details` element rather than permanently expanding long difference lists.
- Destructive confirmation controls should remain easy to distinguish without becoming oversized page-dominating banners.

## Architecture review result

The v116 review concluded:

- six primary destinations remain the correct number;
- the persistent shell should remain unchanged;
- Reports needed progressive presentation, not another tab;
- Import / Restore needed explicit task separation, not another primary destination;
- Activity phone subnavigation needed compact overflow behavior;
- the v115 import engine and v111 runtime should remain authoritative;
- a small idempotent presentation layer is preferable to another whole-page runtime.

v118 follows that decision by replacing the v117 release layer, retaining the v117 mapping controller as a lazy subfeature, lazy-loading portability only on the Import route, and keeping the v115 parser and writer authoritative.

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

- Local-first transaction and profile processing.
- No transaction or profile uploads.
- Mapping profiles and portable bundles contain bounded metadata only.
- No source rows, filenames, source fingerprints, credentials, tokens, balances, or full account identifiers in saved profiles or portable bundles.
- No service-worker registration or offline cache.
- One live ES-module runtime chain.
- Never auto-save an empty vault.
- Preserve best-populated readable vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve the stable v105 rescue page.
