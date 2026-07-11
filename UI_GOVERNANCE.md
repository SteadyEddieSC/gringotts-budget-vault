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
19. **Derived evidence labels** — continuity, similarity, repeated source, and readiness are evidence rather than certainty.
20. **No automatic history repair** — integrity findings never offer one-click repair.
21. **Planning is not execution** — a merge or rename plan must not look like an applied account change.
22. **One candidate at a time** — dense review work should focus the household on one decision rather than scatter controls across the page.

## Current information architecture

The six primary destinations remain:

- **Dashboard** — selected-month overview and report-quality signals.
- **Money** — budgets, recurring charges, bills, paydays, goals, close, forecast, and debt.
- **Calendar** — date-based household cash-flow activity.
- **Reports** — range, one-page preview, annual tracker, workbook, and exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import & Restore, account cleanup planning, Exports & Backup, Diagnostics, and Roadmap.

v122 adds no primary destination. Account cleanup belongs in Tools → Import & Restore because it concerns transaction-account organization and future data maintenance. Receipt integrity and Full Vault Restore remain on the same page but retain distinct tasks and safety boundaries.

## Account cleanup planning

The v122 cleanup surface must:

- appear once near the top of Tools → Import & Restore;
- inventory accounts before presenting candidate decisions;
- mask identifier-like account labels;
- explain why a pair was surfaced;
- show confidence and date-range relationship without claiming certainty;
- show downstream reference counts without exposing copied values;
- review one candidate at a time with a native select;
- distinguish Keep Separate, Rename Plan, Merge Plan, and Investigate decisions;
- state that automatic rename, merge, deletion, and transaction writes are unavailable;
- offer a populated backup separately from the sanitized cleanup-plan download;
- avoid any Apply, Merge Now, Rename Now, or one-click repair control;
- reset stale decisions when the account inventory changes;
- keep dense inventory tables in labeled, focusable scroll regions;
- stack filters and actions on narrow phones.

The plan store may persist only candidate IDs, decisions, timestamps, and the inventory signature. Filters, search text, selected candidate, transaction rows, raw labels, balances, and merchant names remain ephemeral or excluded.

## Reports

Reports separates range selection, family-report preview, and downloads. Eight pages remain one report. A native page select and Previous/Next controls are appropriate on screen; print includes all pages.

The workbook card must advertise the actual release artifact. v122 shows 37 sheets and names Account Inventory and Account Cleanup Plan while retaining Receipt Integrity and Batch Lineage.

Route-specific v118–v122 code loads only after Reports or Tools opens.

## Import and restore

Incremental import and full restore remain different tasks:

- import adds reviewed missing rows;
- restore replaces the destination vault.

They share a Tools section but not a single uninterrupted workflow. Restore remains hidden until deliberately selected. Account cleanup planning does not become a third write workflow; it is a read-only evidence and decision surface.

## Import batch timeline

The v121 timeline remains visible under v122 and must continue to:

- summarize retained batches, verified items, review items, dry-run links, and continuity breaks;
- offer native filters for integrity, result, lineage, dry-run state, and destination family;
- provide local search without persisting the query;
- show source filename, fingerprint, and destination key only in local browser detail;
- keep dense tables in labeled focusable scroll regions;
- explain continuity states in plain language;
- distinguish informational repeated-source evidence from a failure;
- state that no automatic repair or rollback is available;
- retain backup filename and expected pre-import count guidance;
- open the existing Full Vault Restore task rather than creating another restore engine.

## Local and downloaded privacy

Local on-screen review may show information needed to identify a receipt or account. Downloads must be more restrictive.

Timeline packages omit rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, and vault contents.

Cleanup-plan packages omit transaction rows, raw account labels, full identifiers, balances, merchant names, source files, credentials, tokens, and vault contents.

## Detailed Roadmap

The Roadmap page displays the seven-release v122–v128 horizon.

Every release requires:

- purpose;
- meaningful capabilities;
- dependencies;
- safety boundaries;
- expected household outcome;
- current/planned status.

The page states that v123 is the strongest next commitment and later entries may move. Cards use readable lists rather than pills. The same horizon remains in `ROADMAP.md`.

## Profiles, portability, revisions, and dry runs

Saved profiles remain Import configuration, not a destination. Portable bundles require Add, Replace, or Skip for each definition. Existing-profile Update and portable Replace pause for field-by-field revision review with acknowledgement and confirmation.

Prepare/Refresh Dry Run and Download Dry Run remain separate controls. Mapping or reconciliation changes invalidate the prepared result.

## Responsive navigation and density

- Desktop uses six primary destinations.
- Phone/tablet use the compact menu.
- Secondary navigation may scroll horizontally on narrow phones.
- Dense tables scroll within their own labeled containers.
- Report download cards use three, two, or one columns.
- Timeline and cleanup filters use compact multi-column layouts wide and one column on phones.
- Candidate impact cards stack on phones.
- Action rows become full-width on narrow screens.
- Roadmap note grids collapse from three columns to one.
- Destructive confirmations remain distinct without dominating the page.

## Architecture result

The v116 architecture remains authoritative:

- six primary destinations are correct;
- the persistent shell remains;
- Reports uses progressive presentation;
- Import/Restore uses task separation;
- Activity phone subnavigation uses compact overflow;
- v115 remains the authoritative parser, writer, and receipt store;
- v111 remains the runtime foundation;
- release layers stay small and idempotent.

v122 identifies the app at boot and lazy-loads v118 portability, v119 revisions/dry run, v120 audit support, v121 lineage, and v122 cleanup planning only for Tools or Reports.

v122 owns current presentation. v121 yields page-level presentation while v122 explicitly retains the v121 receipt-timeline enhancer. Account cleanup is inserted only when the current rendered Tools page does not already contain the card, preventing observer ping-pong.

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

- Local-first transaction, profile, revision, diagnostic, receipt, audit, batch-lineage, and cleanup-planning processing.
- No transaction or profile uploads.
- Metadata channels never duplicate source rows.
- No automatic receipt repair, rollback, account merge, rename, deletion, or backup-directory scanning.
- No service worker or offline cache.
- One live ES-module runtime.
- Never auto-save an empty vault.
- Preserve best-populated-readable-vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve stable v105 rescue.
