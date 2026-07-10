# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not simply add another permanent top-level tab, repeated explanation, decorative status label, or desktop-only layout.

## Release-level UI quality gate

Every release must review:

1. **Navigation fit** — place new functionality inside an existing destination when that relationship is clear. Add a primary destination only for a durable user goal.
2. **Content value** — keep text that explains a decision, risk, next action, or data limitation. Remove repeated descriptions and text that restates a visible heading.
3. **Action placement** — put actions where the user needs them. Backup belongs with guarded workflows and Exports, not in the Dashboard hero.
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
17. **Manual rollback boundaries** — receipt audit may explain and navigate to restore, but it must never present itself as an automatic undo button.
18. **Roadmap depth without clutter** — planned releases must include useful scope, dependencies, safeguards, and outcomes; they must also be clearly labeled as directional.

## Current information architecture

The six primary destinations remain:

- **Dashboard** — selected-month household overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt planning.
- **Calendar** — date-based bills, paydays, transaction activity, and cash-flow pressure.
- **Reports** — report range, one-page-at-a-time family preview, annual tracker, workbook, and local exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import / Restore, Exports & Backup, Diagnostics, and Roadmap.

v120 adds no primary destination. Receipt audit belongs inside Tools → Import & Restore because it explains prior outcomes of that task. The detailed release horizon remains under Tools → Roadmap because it is operational planning, not a household-finance destination.

## Reports

Reports separates choosing the range, previewing the family report, and downloading exports. The eight pages remain one report. A native select and Previous/Next controls are appropriate on screen; print and PDF include every page.

The v118–v120 route layers load only when Reports or Tools is opened so Dashboard performance remains stable.

## Import and restore

Incremental import and full restore share a Tools subsection but are different tasks:

- import adds reviewed missing rows;
- restore replaces the destination vault.

They must not appear as one uninterrupted workflow. Task controls state the consequence and preserve the guarded engines.

## Receipt audit and rollback guidance

The receipt-audit card replaces the old passive receipt table but remains part of the Import task.

It must:

- summarize verified, verified-with-notes, needs-review, and backup-expected counts;
- show local receipt identity, source metadata, count arithmetic, verification state, and current-destination notes;
- keep dense receipt and check tables in labeled focusable scroll regions;
- explain that later activity can cause a legitimate current-count difference;
- show the expected backup filename pattern and pre-import count when available;
- state explicitly that no automatic rollback is available;
- offer a sanitized audit download and a copyable manual checklist;
- open the existing Full vault restore task rather than creating another restore control;
- avoid persisting selection or new transaction data.

Source filenames and fingerprints may appear only in the local on-screen receipt review. They must not appear in downloaded receipt audits.

## Detailed roadmap horizon

The Roadmap page must show more than one next-release title.

Every visible planned release requires:

- a clear purpose;
- meaningful planned capabilities;
- dependencies or prerequisites;
- safety boundaries;
- an expected household outcome;
- current/planned status.

The page must disclose that the next release is the strongest commitment and that later entries may move. Roadmap cards should use readable sections and lists, not a wall of pills. Desktop may use a three-column notes grid; tablet and phone must stack to one column without document overflow.

The same horizon must remain in `ROADMAP.md`. Structured roadmap data must validate a minimum multi-release horizon before rendering.

## Saved profile library and portability

The saved-profile library is configuration for Import, not another top-level task. It appears before a transaction export is selected so users can review names/labels, export sanitized definitions, inspect a bundle, and resolve conflicts.

The library distinguishes profile name, destination label, source pattern/schema, and non-reversible header identity. Dense profile data belongs in a labeled, focusable table that scrolls internally.

A portable-bundle preview must show proposed name, source identity, destination label, classification, differences, native Add/Replace/Skip selection, editable local name, and identity-matched replacement target when applicable.

Exact and same-definition matches default to Skip. Replace remains unavailable without an identity match. Bundle filenames may appear during review but are not persisted.

## Profile revision review

Existing-profile Update and portable-bundle Replace must pause before metadata storage.

The review card must identify the profile and source, show every changed mapping/option, redact destination-label values in retained history, state that the vault is unchanged, require acknowledgement, use an explicit confirmation control, provide Cancel, and keep comparisons scrollable on phones.

Revision history belongs below the profile library as collapsible metadata summaries. It must not become another primary or secondary destination.

## Local import dry run

The dry-run card belongs in Tools → Import near profile and mapping controls.

Prepare/Refresh and Download are separate controls. Download is unavailable until a current dry run exists. Mapping or reconciliation changes invalidate the prepared result.

The UI must state that preparation performs no transaction write and that downloads exclude rows, filenames, fingerprints, identifiers, destination labels, balances, credentials, and vault contents.

## Responsive navigation and density

- Desktop uses six primary destinations.
- Phone/tablet use a compact header menu.
- Secondary sections use rectangular controls, not decorative pills.
- Narrow-phone secondary navigation may scroll horizontally.
- Dense tables scroll within their own containers.
- Calendar detail stacks below the month grid on smaller screens.
- Report-download cards use three, two, or one columns.
- Mapping, bundle, revision, dry-run, and receipt-audit fields use multiple columns when space permits and one column on phones.
- Receipt and roadmap action rows stack to full-width controls on narrow phones.
- Roadmap note grids collapse from three columns to one.
- Long comparisons use native `details`, lists, or scrollable tables.
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

v120 identifies the app at boot while lazy-loading v118 portability, v119 revision/dry-run, and v120 receipt/roadmap layers only when Tools or Reports opens. The v115 parser/writer and receipt store remain authoritative.

## Larger overhaul cadence

A deeper UI architecture review should occur every 10–20 releases, or earlier if any threshold is reached:

- more than 7 primary destinations;
- repeated mobile overflow/usability defects;
- two or more pages serving the same goal;
- major actions appearing in three or more unrelated locations;
- repeated explanatory copy;
- new features placed under Tools because no appropriate destination exists;
- recurring navigation or layout regressions.

The next scheduled deeper review remains approximately v126, with an acceptable v126–v136 range.

## Architecture boundaries

- Local-first transaction, profile, revision, diagnostic, receipt, and receipt-audit processing.
- No transaction or profile uploads.
- Profiles, bundles, revision history, dry runs, receipts, and audits contain bounded metadata only.
- No source rows, credentials, tokens, balances, full account identifiers, or vault contents in downloaded metadata artifacts.
- No automatic receipt rollback or backup-directory scanning.
- No service-worker registration or offline cache.
- One live ES-module runtime chain.
- Never auto-save an empty vault.
- Preserve best-populated readable-vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve the stable v105 rescue page.
