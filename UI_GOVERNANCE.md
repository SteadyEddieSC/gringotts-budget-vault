# Gringotts Budget Vault UI Governance

## Purpose

The interface must evolve with the feature set. New capabilities should not automatically create another top-level tab, repeated explanation, decorative pill, or desktop-only layout.

## Release-level UI quality gate

Every release reviews navigation fit, content value, action placement, responsive behavior, feature consolidation, accessibility, working controls, print/export completeness, state restraint, and observer stability.

Additional standing rules:

- planning must never look like execution;
- derived evidence must be labeled as evidence rather than certainty;
- guarded writes must state consequences before confirmation;
- dense review work should focus on one candidate or scenario at a time;
- local metadata must never duplicate transaction rows;
- tables belong in labeled focusable scroll regions;
- native selects, date inputs, and number inputs are preferred over decorative controls;
- roadmap cards require purpose, capabilities, dependencies, safeguards, and outcome.

## Current information architecture

The six primary destinations remain:

- **Dashboard** — selected-month overview and report-quality signals.
- **Money** — budgets, recurring decisions, bills, paydays, goals, close, forecast, debt, and scenarios.
- **Calendar** — date-based household cash-flow activity.
- **Reports** — range, one-page preview, annual tracker, workbook, and exports.
- **Activity** — transactions, Review Queue, Rules, Insights, and Guided Plan.
- **Tools** — Import & Restore, account cleanup planning, Exports & Backup, Diagnostics, and Roadmap.

v124 adds no primary destination. Household Scenario Comparison belongs in **Money → Close & Forecast** because it evaluates forecast, debt, goal, and flexibility assumptions before any real plan change.

## Household Scenario Comparison

The v124 scenario surface must:

- appear once inside Close & Forecast;
- use the current forecast as the visible baseline;
- use native controls for all assumptions;
- show baseline, scenario, and difference columns together;
- show the horizon and explicit model limitations;
- keep one saved scenario selected at a time;
- separate Preview, Save Assumptions, New Scenario, and Delete Saved Scenario;
- provide no Apply Scenario, Change Plan, or automatic execution control;
- state that forecast settings, debts, goals, recurring decisions, budgets, and transactions remain unchanged;
- keep the comparison table horizontally scrollable inside its own region on narrow screens;
- stack form and action controls on phones;
- treat debt and goal outputs as simplified planning estimates rather than professional advice.

The scenario store may persist only IDs, names, assumptions, notes, and timestamps. Baseline transaction rows, merchant names, account labels, balances, credentials, and vault contents are excluded.

## Reports

Reports separates range selection, family-report preview, and downloads. Eight pages remain one report. A native page select and Previous/Next controls are appropriate on screen; print includes all pages.

The workbook card must advertise the actual artifact. v124 shows **41 sheets** and names Scenario Comparisons and Scenario Assumptions while retaining receipt, lineage, account-cleanup, and recurring-decision sheets.

Scenario summaries belong on the planning and Family Meeting pages. They must identify assumptions and projection limits rather than imply an applied plan.

## Import, restore, and cleanup

Incremental import and Full Vault Restore remain different tasks. Account cleanup and receipt integrity remain review/planning surfaces, not additional write engines.

- Import adds reviewed missing rows with backup, acknowledgement, confirmation, verification, and rollback.
- Restore replaces the destination vault only after readable populated-file preview and confirmation.
- Cleanup planning cannot rename, merge, delete, or rewrite transactions.
- Receipt integrity cannot repair history or roll back automatically.

## Local and downloaded privacy

Local on-screen review may show information needed for household decisions. Downloads and stored metadata must be more restrictive.

- Timeline packages omit rows, filenames, fingerprints, mappings, destination keys, identifiers, merchants, and vault contents.
- Cleanup packages omit rows, raw account labels, full identifiers, balances, merchants, source files, credentials, tokens, and vault contents.
- Scenario metadata and workbook sheets contain assumption values and derived results but no copied transaction rows or account identifiers.

## Detailed Roadmap

The Roadmap displays the seven-release **v124–v130** horizon. Every card includes purpose, capabilities, dependencies, safety boundaries, outcome, and current/planned status.

The page states that v125 is the strongest next commitment and later entries may move. The same horizon remains in `ROADMAP.md`.

## Responsive navigation and density

- Desktop uses six primary destinations.
- Phone and tablet use the compact menu.
- Secondary navigation may scroll horizontally on narrow phones.
- Dense tables scroll within labeled containers.
- Report cards use three, two, or one columns.
- Filters and forms collapse to one column on phones.
- Action rows become full-width on narrow screens.
- Roadmap note grids collapse from three columns to one.
- Destructive controls remain distinct without dominating the page.

## Architecture result

The v116 information architecture remains authoritative. v111 remains the runtime foundation, v115 remains the parser/writer/receipt authority, and release layers remain lazy and idempotent.

v124 owns presentation. It directly reuses v123 recurring features without activating the v123 release observer, retains v122 cleanup and v121 lineage, and creates only one v124 observer. Route-specific v118–v124 code loads only after Money, Reports, Activity, or Tools opens.

## Larger overhaul cadence

A deeper UI review should occur every 10–20 releases, or sooner if primary destinations exceed seven, mobile overflow repeats, multiple pages serve the same goal, controls become scattered, explanatory copy repeats, Tools becomes a dumping ground, or observer regressions recur.

The next scheduled deeper review remains approximately v126, with an acceptable v126–v136 range.

## Architecture boundaries

- Local-first processing only.
- No transaction or profile uploads.
- Metadata stores never duplicate source rows.
- No automatic receipt repair, rollback, account merge, scenario application, merchant action, or backup-directory scanning.
- No service worker or offline cache.
- One live ES-module runtime.
- Never auto-save an empty vault.
- Preserve best-populated-readable-vault selection.
- Preserve `gringottsBudgetVault.latest` as restore destination.
- Keep backup-first broad-write and restore safeguards.
- Preserve stable v105 rescue.
