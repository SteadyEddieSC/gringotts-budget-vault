# v114 — Guided Household Planning

## Release purpose

v114 turns existing local goals, month-close readiness, forecast pressure, debt priorities, recurring-cost changes, and Household Insights into an explainable household action checklist.

The release also changes the development workflow so normal branch work does not generate a full set of GitHub failure emails before the release candidate is ready.

## Activity → Plan

A fifth Activity subsection now provides a generated checklist without adding another top-level destination.

Each item includes:

- Urgent, High, Medium, or Routine priority;
- the household area involved;
- why the item appears;
- the underlying evidence;
- a recommended next step;
- a button to open the relevant source workflow;
- optional checklist status, owner, target date, and notes.

## Deterministic action sources

### Goals

- no active goal exists;
- a goal due date has passed;
- the saved monthly contribution is below a simple straight-line pace for the due date.

### Month close and data quality

- a closed month has transaction-signature drift;
- a reconciled month is ready but not closed;
- close blockers remain;
- review-queue or pending rows reduce reporting and close reliability.

### Cash flow

- no bill or payday schedule exists;
- a forecasted balance becomes negative;
- a forecasted balance falls below the selected minimum buffer.

### Debt

- a promotional APR payoff pace exceeds the saved target payment;
- the top-ranked non-promo debt carries a high effective APR.

### Household Insights and recurring costs

- high-attention unusual-spending signals require a household decision;
- recurring price increases create an approximate annualized cost increase.

If no exception is generated, the plan includes a routine monthly household review item.

## Explicit checklist writes

Viewing Activity → Plan is read-only.

Only **Save Plan Item** writes checklist metadata. The separate `gringottsGuidedPlan.v1` key stores:

- status: Not started, Planned, Done, or Dismissed;
- owner;
- target date;
- notes;
- item title and area for history display;
- an explicit status-change history.

The save operation reads the item back and verifies status, owner, target date, and notes.

Guided Plan data never changes:

- transaction rows;
- categories, accounts, or owners on transactions;
- budgets or rules;
- goal balances or targets;
- debt balances or payments;
- forecast settings or bill/payday schedules;
- recurring preferences;
- month-close history.

## Reports and exports

v114 adds:

- an eighth printable Guided Plan report page;
- plan priorities in the family meeting brief;
- a dedicated Guided Plan Markdown download;
- Guided Plan and Planning History workbook sheets;
- a 32-sheet Vault Workbook;
- v114-named workbook, meeting pack, backup, calendar, rules-review, and diagnostics downloads.

## Faster and quieter release workflow

The protected final matrix remains intact, but its execution is staged.

### Draft PR suppression

Desktop/responsive Playwright, quality, Lighthouse, security history, supply-chain, and CodeQL jobs skip draft pull requests.

Development and full diff review can occur quietly before ready-for-review.

### Browser preflights

Desktop:

1. install and run Chromium;
2. only after Chromium passes, install Firefox and WebKit;
3. run Firefox and WebKit.

Responsive:

1. run iPad and Android with Chromium;
2. only after those pass, install WebKit;
3. run iPhone/WebKit.

### Quality preflight

Keyboard semantics and visual contracts run before the longer axe surface inventory. Lighthouse remains independent and parallel.

### Failure-only artifacts

Playwright, axe/layout, and Lighthouse diagnostic bundles are uploaded only when their job fails.

`RELEASE_PROCESS.md` documents the full branch → preflight → draft → ready → checks → squash merge → production smoke workflow.

## Scorecard alert triage

`SCORECARD_ALERTS.md` classifies the visible findings:

- Branch Protection: implemented, verify ruleset and refresh;
- Code Review: accepted solo-maintainer limitation with automated compensating controls;
- Maintained: ongoing repository-history signal;
- SAST: CodeQL already implemented, refresh and verify recognition;
- Security Policy: `SECURITY.md` already implemented, refresh and verify settings;
- License: explicit owner legal decision required;
- Fuzzing: meaningful parser fuzz/property testing deferred to v115;
- CII Best Practices: accepted current project-profile tradeoff.

No license is added automatically.

## Test coverage

Synthetic Playwright tests verify:

- generation from review, pending, schedule, goal, forecast, debt, and insight conditions;
- reason, evidence, and next-step text;
- zero planning writes from page viewing;
- explicit checklist saves and read-back verification;
- unchanged vault data after checklist writes;
- status history;
- resolved-item display;
- navigation to the source workflow;
- no network writes;
- phone, tablet, and desktop containment;
- 32-sheet workbook and Guided Plan downloads;
- eight print pages;
- axe coverage on desktop and mobile Plan surfaces;
- visual contracts for the Guided Plan report;
- workflow drift checks for draft gating, staged browsers, and failure-only artifacts.

## Preserved safeguards

v114 preserves:

- `gringottsBudgetVault.latest` as the restore destination;
- best-populated-readable-vault selection;
- restore preview, acknowledgement, confirmation, and read-back verification;
- backup-first verified broad transaction writes;
- v109 duplicate and overlap review;
- v110 close, forecast, and debt planning;
- v111 report ranges and prior-year reporting;
- v112 accessibility and quality gates;
- v113 read-only Household Insights;
- `rescue-v105.html`;
- no transaction upload, service worker, offline cache, bridge runtime, or copied application runtime.

## Next release

v115 — Bank Export Import & Mapping, beginning with local CSV/delimited, OFX, QFX, and QBO parsing plus explicit mapping, duplicate review, backup-first writes, and read-back verification.
