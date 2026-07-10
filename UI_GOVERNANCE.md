# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not automatically create another top-level tab, repeated explanation, decorative pill, or desktop-only layout.

## Release-level UI quality gate

Every release reviews:

1. **Navigation fit** — use an existing destination when the user goal is already represented.
2. **Content value** — keep text that explains a decision, risk, limitation, or next action.
3. **Action placement** — put guarded actions beside the workflow they affect.
4. **Responsive behavior** — test phone, tablet, laptop, and wide desktop without document overflow.
5. **Feature consolidation** — group related functions rather than scattering them.
6. **Accessibility** — preserve keyboard access, focus, labels, contrast, native controls, and state.
7. **No informational-pill clutter** — prefer headings, lists, status panels, and tables.
8. **Working-control review** — test every action, filter, picker, download, and metadata write.
9. **Print/export completeness** — screen simplification must not remove required output.
10. **State restraint** — persistent metadata must provide clear value and never duplicate transactions.
11. **Explain remembered choices** — restored settings remain attributable and editable.
12. **No silent compatibility guesses** — automatic profile use requires one exact match.
13. **No silent portable merges** — every definition requires Add, Replace, or Skip.
14. **Review revisions** — Update and Replace show field changes before storage.
15. **Explicit diagnostics** — preparing and downloading a dry run are separate actions.
16. **Consequence-first controls** — Replace, Delete, Restore, and transaction writes are visibly distinct.
17. **Manual rollback boundary** — audits and timelines may guide restore but never impersonate automatic undo.
18. **Roadmap depth without clutter** — releases include scope, dependencies, safeguards, and outcomes.
19. **Derived evidence labels** — continuity, repeated source, and readiness must be explained as evidence rather than certainty.
20. **No automatic history repair** — receipt integrity can flag gaps but must not offer one-click repair.

## Current information architecture

The six primary destinations remain:

- **Dashboard** — selected-month overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt.
- **Calendar** — date-based household cash-flow activity.
- **Reports** — range, one-page preview, annual tracker, workbook, and exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import / Restore, Exports & Backup, Diagnostics, and Roadmap.

v121 adds no primary destination. Receipt integrity belongs in Tools → Import & Restore because it explains outcomes of prior import activity. The release horizon remains under Tools → Roadmap.

## Reports

Reports separates range selection, family-report preview, and downloads. Eight pages remain one report. A native page select and Previous/Next controls are appropriate on screen; print includes all pages.

The workbook card must advertise the actual release artifact. v121 shows 35 sheets and names Receipt Integrity and Batch Lineage.

Route-specific v118–v121 code loads only after Reports or Tools opens.

## Import and restore

Incremental import and full restore remain different tasks:

- import adds reviewed missing rows;
- restore replaces the destination vault.

They share a Tools section but not a single uninterrupted workflow. Restore remains hidden until deliberately selected.

## Import batch timeline

The v121 timeline replaces the passive receipt/audit card while preserving v120 receipt checks and manual rollback guidance.

It must:

- summarize retained batches, verified items, review items, dry-run links, and continuity breaks;
- offer native filters for integrity, result, lineage, dry-run state, and destination family;
- provide a local search field without persisting the query;
- show source filename, fingerprint, and destination key only in the local browser detail;
- keep dense receipt and check tables in labeled focusable scroll regions;
- explain every continuity state in plain language;
- distinguish informational repeated-source evidence from a failure;
- state that no automatic repair or rollback is available;
- retain backup filename and expected pre-import count guidance;
- open the existing Full vault restore task rather than creating a second restore engine;
- avoid persisting selected batch, filters, or transaction copies.

## Dry-run lineage

Prepare Dry Run remains an explicit existing action. v121 may stage sanitized readiness metadata only after that action.

The UI must not claim a link unless format, schema, normalized rows, insert count, and skip count reconcile to the resulting receipt.

A missing link must be described as valid for older or no-dry-run imports. The UI must not imply that v121 can reconstruct a historical dry run.

## Local and downloaded privacy

Source filenames, fingerprints, and local destination keys may appear on screen for identification. Full-timeline and selected-batch downloads must omit them.

Download descriptions should state that rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, and vault contents are excluded.

## Detailed Roadmap

The Roadmap page must display the seven-release v121–v127 horizon.

Every release requires:

- purpose;
- meaningful capabilities;
- dependencies;
- safety boundaries;
- expected household outcome;
- current/planned status.

The page must state that the next release is the strongest commitment and later entries may move. Cards use readable lists rather than pills. The same horizon must remain in `ROADMAP.md`.

## Profiles, portability, revisions, and dry runs

Saved profiles remain Import configuration, not a destination. The library distinguishes name, destination label, source pattern/schema, and non-reversible header identity.

Portable bundles require Add, Replace, or Skip for each definition. Replace remains identity-matched.

Existing-profile Update and portable Replace pause for a field-by-field revision review with acknowledgement and confirmation.

Prepare/Refresh Dry Run and Download Dry Run remain separate controls. Mapping or reconciliation changes invalidate the prepared result.

## Responsive navigation and density

- Desktop uses six primary destinations.
- Phone/tablet use the compact menu.
- Secondary navigation may scroll horizontally on narrow phones.
- Dense tables scroll within their own labeled containers.
- Report download cards use three, two, or one columns.
- Timeline filters use three columns wide, two on tablet, and one on phone.
- Timeline overview cards stack on phones.
- Timeline and rollback action rows become full-width on narrow screens.
- Roadmap note grids collapse from three columns to one.
- Destructive confirmations remain distinct without dominating the page.

## Architecture result

The v116 architecture review remains authoritative:

- six primary destinations are correct;
- the persistent shell remains;
- Reports uses progressive presentation;
- Import/Restore uses task separation;
- Activity phone subnavigation uses compact overflow;
- v115 remains the authoritative parser, writer, and receipt store;
- v111 remains the runtime foundation;
- release layers stay small and idempotent.

v121 identifies the app at boot and lazy-loads v118 portability, v119 revisions/dry run, v120 audit support, and v121 lineage only for Tools or Reports.

v121 owns current presentation. v120 must yield Reports, Import, and Roadmap writing when v121 is active so observers cannot alternate content.

## Larger overhaul cadence

A deeper UI review should occur every 10–20 releases, or sooner if:

- primary destinations exceed seven;
- mobile overflow repeats;
- multiple pages serve the same goal;
- major actions appear in unrelated places;
- explanatory copy repeats;
- Tools becomes a dumping ground;
- navigation or observer regressions recur.

The next scheduled deeper review remains approximately v126, with an acceptable v126–v136 range.

## Architecture boundaries

- Local-first transaction, profile, revision, diagnostic, receipt, audit, and batch-lineage processing.
- No transaction or profile uploads.
- Metadata channels never duplicate source rows.
- No filenames, fingerprints, destination keys, credentials, tokens, balances, full identifiers, or vault contents in timeline downloads.
- No automatic receipt repair, rollback, account merge, or backup-directory scanning.
- No service worker or offline cache.
- One live ES-module runtime.
- Never auto-save an empty vault.
- Preserve best-populated-readable-vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve stable v105 rescue.
