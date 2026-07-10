# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not simply add another permanent top-level tab, repeated explanation, decorative status label, or desktop-only layout.

## Release-level UI quality gate

Every release must review:

1. **Navigation fit** — place new functionality inside an existing destination when that relationship is clear. Add a primary destination only for a durable user goal.
2. **Content value** — keep text that explains a decision, risk, next action, or data limitation. Remove repeated descriptions and text that restates a visible heading.
3. **Action placement** — put actions where the user needs them. Backup belongs with Exports and guarded workflows, not in the header or Dashboard hero.
4. **Responsive behavior** — check phone portrait, phone landscape, tablet, laptop, and wide desktop. Avoid document overflow, cramped cards, and oversized controls.
5. **Feature consolidation** — group related functions under clear destinations and use secondary/task navigation where needed.
6. **Accessibility** — preserve keyboard navigation, visible focus, meaningful labels, contrast, native controls, and screen-reader state.
7. **No informational pills** — use headings, lists, inline text, or status panels unless a compact badge communicates an actionable state.
8. **Working-control review** — test every button, picker, tab, download, and local-storage write.
9. **Print completeness** — screen simplification must not remove content from print or local exports.
10. **State restraint** — persistent state must create clear value and must not duplicate transaction contents.
11. **Explain remembered choices** — restored settings must identify their source and remain editable.
12. **No silent compatibility guesses** — profiles may apply automatically only when one exact-compatible match exists.
13. **No silent portable merges** — every imported definition must expose Add, Replace, or Skip.
14. **Review profile revisions** — an existing Update or portable Replace must show changed mappings/options before storage.
15. **Explicit diagnostics** — preparing and downloading a dry-run diagnostic are separate user actions.
16. **Consequence-first destructive controls** — Replace, Delete, Restore, and transaction writes must be visually and textually distinct from ordinary edits.

## Current information architecture

The six primary destinations remain:

- **Dashboard** — selected-month household overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt planning.
- **Calendar** — date-based bills, paydays, transaction activity, and cash-flow pressure.
- **Reports** — report range, one-page-at-a-time family preview, annual tracker, workbook, and local exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import / Restore, Exports & Backup, Diagnostics, and Roadmap.

v119 adds no primary destination. Profile revision review and dry-run diagnostics belong inside Tools → Import transactions because they configure and validate that existing task.

## Reports

Reports separates choosing the range, previewing the family report, and downloading exports. The eight pages remain one report. A native select and Previous/Next controls are appropriate on screen; print and PDF include every page.

The v118/v119 report layer loads only when Reports is opened so Dashboard performance remains stable.

## Import and restore

Incremental import and full restore share a Tools subsection but are different tasks:

- import adds reviewed missing rows;
- restore replaces the destination vault.

They must not appear as one uninterrupted workflow. Task controls state the consequence and preserve the guarded engines.

## Saved profile library and portability

The saved-profile library is configuration for Import, not another top-level task. It appears before a transaction export is selected so users can review names/labels, export sanitized definitions, inspect a bundle, and resolve conflicts.

The library distinguishes profile name, destination label, source pattern/schema, and non-reversible header identity. Dense profile data belongs in a labeled, focusable table that scrolls internally.

A portable-bundle preview must show proposed name, source identity, destination label, classification, differences, native Add/Replace/Skip selection, editable local name, and identity-matched replacement target when applicable.

Exact and same-definition matches default to Skip. Replace remains unavailable without an identity match. Bundle filenames may appear during review but are not persisted.

## Profile revision review

Existing-profile Update and portable-bundle Replace must pause before metadata storage.

The review card must:

- identify the profile and revision source;
- show every changed mapping and normalization option in a labeled table;
- redact destination-account-label values in retained history;
- state that transactions and the vault are unchanged;
- require acknowledgement;
- use an explicit confirmation button;
- provide a clear Cancel action;
- keep the comparison table internally scrollable on phones.

Revision history belongs below the profile library as collapsible metadata summaries. It must not become another primary or secondary navigation destination.

## Local import dry run

The dry-run card belongs in Tools → Import transactions near the profile and mapping controls.

Before source selection it explains what the diagnostic excludes. After inspection it can prepare an in-memory summary showing schema, mapping readiness, validation counts, coverage, duplicate counts, and write readiness.

Prepare/Refresh and Download are separate controls. Download is unavailable until a current dry run exists. Mapping or reconciliation changes invalidate the prepared result.

The UI must state that preparation performs no transaction write and that downloaded diagnostics exclude rows, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents.

## Mapping profiles and field explanations

The mapping-profile UI appears after a supported export is inspected. It keeps mapping controls visible/editable, uses native selects/inputs, identifies applied/compatible profiles, explains incompatibility, warns when current settings differ, and distinguishes Save New, Update, New, Apply, Delete, and Clear consequences.

Field-level text explains validation or downstream meaning without duplicating the normalized preview. Text, not color alone, communicates good, warning, error, informational, and optional states.

## Responsive navigation and density

- Desktop uses six primary destinations.
- Phone/tablet use a compact header menu.
- Secondary sections use rectangular controls, not decorative pills.
- Narrow-phone secondary navigation may scroll horizontally.
- Dense tables scroll within their own containers.
- Calendar detail stacks below the month grid on smaller screens.
- Report-download cards use three, two, or one columns.
- Mapping, bundle, revision, and dry-run fields use multiple columns when space permits and one column on phones.
- Profile/revision action buttons wrap on larger screens and become full-width on narrow phones.
- Long comparisons use native `details` or scrollable tables.
- Destructive confirmations remain distinct without becoming page-dominating banners.

## Architecture result

The v116 architecture review remains authoritative:

- six primary destinations are correct;
- the persistent shell remains;
- Reports uses progressive presentation, not another tab;
- Import/Restore uses task separation, not another destination;
- Activity phone subnavigation uses compact overflow;
- the v115 import engine and v111 runtime remain authoritative;
- small idempotent presentation layers are preferable to another whole-page runtime.

v119 follows this decision by identifying the app at boot while lazy-loading v118 portability and v119 revision/diagnostic route layers only when Tools or Reports opens. The v117 mapping controller remains a lazy subfeature, and the v115 parser/writer remains authoritative.

## Larger overhaul cadence

A deeper UI architecture review should occur every 10–20 releases, or earlier if any threshold is reached:

- more than 7 primary destinations;
- repeated mobile overflow/usability defects;
- two or more pages serving the same goal;
- major actions appearing in three or more unrelated locations;
- repeated explanatory copy;
- new features placed under Tools because no appropriate destination exists;
- recurring navigation or layout regressions.

The next scheduled deeper review is approximately v126, with an acceptable v126–v136 range.

## Architecture boundaries

- Local-first transaction, profile, revision, and diagnostic processing.
- No transaction or profile uploads.
- Profiles, portable bundles, revision history, and dry-run diagnostics contain bounded metadata only.
- No source rows, filenames, fingerprints, credentials, tokens, balances, full account identifiers, or destination-label values in revision history or diagnostics.
- No service-worker registration or offline cache.
- One live ES-module runtime chain.
- Never auto-save an empty vault.
- Preserve best-populated readable-vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve the stable v105 rescue page.
