# v116 — UI Architecture Review

## Release purpose

v116 is the scheduled deeper interface review after the six-destination architecture introduced in v106. It improves how dense workflows are presented without replacing the stable runtime, moving features into unrelated tabs, or weakening local-first safeguards.

## Architecture decision

The six primary destinations remain appropriate:

1. Dashboard;
2. Money;
3. Calendar;
4. Reports;
5. Activity;
6. Tools.

No primary destination was added or removed.

The persistent shell remains active. v116 adds a focused presentation layer over the existing runtime instead of reconstructing the application or leaving multiple generations running.

## Reports

The Reports destination now separates three user tasks:

- choose the report range;
- preview one family-report page at a time;
- download local exports.

A native report-page select and Previous / Next controls navigate:

1. Family summary;
2. Year-over-year comparison;
3. Spending breakdown;
4. Goals and Vault Health;
5. Close, forecast, and debt;
6. Household insights;
7. Guided household plan;
8. Family meeting brief.

Only the selected report page is shown on screen. Printing and Save as PDF still include all eight pages.

The annual tracker, 33-sheet Vault Workbook, range CSV, selected-month XLSX, executive report, meeting pack, and Guided Plan downloads remain available.

## Import and restore

Tools → Import / Restore is now presented as two explicit tasks:

- **Import transactions** adds only reviewed missing rows from a bank export;
- **Restore full vault** replaces the destination only through the existing guarded restore workflow.

The two workflows no longer appear as one continuous page on screen.

Bank import also shows three useful progress stages:

1. Inspect;
2. Map;
3. Reconcile.

Progress is inferred from the existing session state. It does not create another storage record and does not bypass any validation.

## Responsive navigation and density

- Activity secondary navigation uses compact horizontal scrolling on narrow phones instead of five oversized stacked controls.
- Report download cards use three columns on wide screens, two on tablets, and one on phones.
- Import task controls and progress collapse to one column on phones.
- Tables remain contained in their own scroll regions.
- Native selects remain in use where one option is selected.

## Preserved behavior

v116 preserves:

- browser-local transaction storage and processing;
- best-populated-readable-vault selection;
- `gringottsBudgetVault.latest` as the restore destination;
- populated backup requirements before broad transaction writes;
- explicit acknowledgement and confirmation;
- transaction-count and inserted-token read-back verification;
- rollback after failed import verification;
- metadata-only import receipts;
- goals, close history, report range, forecast, debt, Guided Plan, and insight data;
- one live ES-module runtime;
- the persistent shell;
- `rescue-v105.html`;
- no service worker, PWA cache, analytics, remote parser, or transaction upload.

## Export naming

User-generated release files now use v116 names for:

- Vault Workbook;
- family meeting pack;
- Guided Plan;
- full vault backup;
- rules review;
- calendar;
- diagnostics.

The existing v115 pre-import backup name remains tied to the unchanged v115 guarded import engine.

## Testing

Synthetic coverage includes:

- six-destination architecture;
- no vault change from navigation or presentation controls;
- every report-preview page;
- Previous and Next behavior;
- all eight print pages;
- separate import and restore tasks;
- import progress states;
- phone Activity navigation;
- no horizontal page overflow;
- axe scans for every report page and both import tasks;
- observer stability;
- v115 parser and guarded-write compatibility;
- v109 import-memory compatibility;
- production Cloudflare smoke behavior.

No real household export, backup, report, or screenshot is used.

## Next release

v117 — Import Profiles & Field Validation

The planned release will locally remember reviewed mapping choices by source schema, improve field-level explanations, and expand synthetic institution-pattern coverage without storing imported transaction copies.
