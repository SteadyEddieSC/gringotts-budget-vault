# Gringotts Budget Vault Testing

## Data boundary

All tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real vault, bank export, statement, account-cleanup plan, profile, revision history, profile bundle, dry-run diagnostic, import receipt, receipt audit, batch index, timeline package, backup, report, screenshot, or account identifier.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed and separate debit/credit CSV;
- fictional card, ledger, wallet, and OFX/QFX data;
- fictional legacy Gringotts JSON packages;
- inline profile, revision, dry-run, receipt, audit, batch-link, and account-cleanup metadata;
- deterministic malformed-input mutations.

## Requirements

- Node.js 24 or newer;
- Python 3 for the local static server;
- Git history for privacy scanning.

## Browser-free preflight

```bash
npm run test:parser
```

Node's built-in runner covers:

- parser format, delimiter, mapping, date, sign, size, and row-limit behavior;
- profile compatibility and portable-bundle review;
- revision redaction and bounded history;
- dry-run privacy and stale signatures;
- receipt arithmetic, batch continuity, and timeline privacy;
- masked account inventory and date coverage;
- explainable duplicate-label, spelling-drift, and possible-rename candidates;
- downstream reference counting without copied values;
- bounded cleanup decisions and stale-inventory reset;
- sanitized cleanup-plan packages;
- the detailed v122–v128 Roadmap;
- module-instance and presentation-ownership contracts.

GitHub also runs `node --check` against all active v115–v122 modules and `src/boot-v122.js` before installing browsers.

## Local setup

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
npm run privacy:history
npm audit --audit-level=high
```

Complete matrix:

```bash
npx playwright install firefox webkit
npm run test:local
```

Additional commands:

```bash
npm run test:a11y
npm run test:visual
npm run test:headed
npm run test:ui
npm run report
```

## v122 account-cleanup coverage

Pure-model and browser tests verify:

- account labels are inventoried from the current readable vault;
- displayed identifiers are masked;
- transaction rows are never copied to the plan store or sanitized download;
- candidate evidence includes shared words, text similarity, masked final-four, inferred type, and date relationship;
- distinct synthetic accounts are not surfaced merely because both are cards or checking accounts;
- overlapping date ranges remain a caution rather than merge authorization;
- reference impact covers transactions, rules, recurring items, budgets, bills and paydays, goals, planning, and other metadata;
- every decision is explicit;
- the metadata store is capped at 120 decisions;
- changed inventory signatures reset stale decisions;
- plan writes are read-back verified and restore the prior raw value after failure;
- saving a decision leaves the vault byte-for-byte unchanged;
- no Apply Merge, Rename Now, delete, or transaction-write action exists;
- a populated backup and sanitized plan are separate downloads;
- plan packages omit raw labels, full identifiers, rows, balances, merchants, files, credentials, tokens, and vault contents.

## Preserved v121 receipt-integrity coverage

The v121 regression suite continues to verify:

- receipts remain authoritative and unchanged;
- destination-family sequence and continuity states;
- duplicate receipt identities and repeated-source notes;
- all timeline filters;
- explicit dry-run-to-receipt reconciliation;
- bounded batch-index storage and prior-value restoration;
- manual-only rollback and separate Full Vault Restore;
- sanitized timeline downloads;
- the unchanged v115 backup, acknowledgement, confirmation, write, rollback, and verification controls.

## Workbook and Roadmap coverage

Tests verify:

- the workbook advertises and downloads 37 sheets;
- Account Inventory and Account Cleanup Plan are included;
- Import Receipts, Receipt Integrity, and Batch Lineage remain;
- the Roadmap displays v122 through v128;
- each release includes capabilities, dependencies, safety boundaries, and household outcome;
- v122 is current, v123 is next, and later releases are directional;
- desktop and phone layouts remain inside the viewport.

## Lazy loading and route stability

Tests verify:

- v118–v122 route code and CSS are absent from the initial Dashboard request set;
- route layers load only when Tools or Reports opens;
- the Lighthouse request budget remains 45;
- v121 reuses the active v115 and v117 module identities;
- v122 reads active core state rather than creating another transaction engine;
- v122 interceptors load before inherited route controls;
- v120 yields to v121 and v121 yields presentation ownership to v122;
- v122 explicitly retains the v121 receipt timeline;
- account cleanup, profiles, dry runs, timeline, Roadmap, reports, and task switching settle without mutation-observer loops.

## Preserved functional coverage

The established suite continues to verify:

- six primary destinations and persistent shell;
- one report page on screen and all eight print pages;
- separate transaction import and full restore tasks;
- signed CSV, debit/credit, OFX/QFX, and legacy JSON imports;
- exact, fuzzy, and pending-to-posted duplicate handling;
- missing-only insertion, populated backup, rollback, and read-back verification;
- restore destination `gringottsBudgetVault.latest` and empty-restore blocking;
- Review Queue, goals, Vault Health, close, reopen, forecast, bills, paydays, debt, Insights, Guided Plan, and annual tracker;
- phone navigation and no document-level overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Fresh v122 coverage scans:

- account inventory and focusable table region;
- cleanup filters and native candidate selector;
- evidence, impact, and decision controls;
- v122–v128 Roadmap;
- desktop and phone layouts.

Existing axe coverage remains for all primary and secondary sections, eight report pages, import and restore, profiles, mappings, bundles, revisions, dry runs, receipt timeline, and rollback guidance.

Keyboard coverage includes Skip to content, visible focus, tabs, arrow navigation, labeled scroll regions, native controls, mobile-menu Escape, acknowledgements, and explicit actions.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft PRs skip protected jobs. When ready:

1. syntax and browser-free models;
2. Chromium desktop and Android Chromium;
3. Firefox/WebKit desktop and iPad/iPhone WebKit;
4. keyboard and visual contracts;
5. axe inventories and focused v122 scans;
6. Lighthouse budgets;
7. privacy, supply-chain, and CodeQL.

Concurrency cancellation stops superseded runs.

## Security gates

The final candidate runs:

- full-history financial-data and identifier scanning;
- Gitleaks;
- Dependency Review;
- locked npm audit with scripts disabled;
- CodeQL `security-extended` queries;
- action pinning and least-privilege checks;
- CSP/header checks;
- parser/model purity;
- metadata-only storage boundaries;
- required-file and staged-workflow drift tests.

## Production smoke

After merge, the main smoke verifies:

- v122 startup and hardened headers;
- all six destinations;
- account cleanup, batch timeline, profiles, revisions, dry run, bundle picker, import, and full restore;
- v122–v128 Roadmap;
- Guided Plan and report pages;
- Import Receipts, Receipt Integrity, Batch Lineage, Account Inventory, and Account Cleanup Plan;
- no page errors.

## Final merge gate

The exact final head must pass:

1. Parser and static preflight;
2. Local source — desktop;
3. Local source — responsive;
4. Accessibility and visual contracts;
5. Lighthouse CI budgets;
6. Full-history privacy and secret scan;
7. CodeQL;
8. Dependency Review;
9. npm audit;
10. repository security-drift tests;
11. exact-head Cloudflare preview;
12. no unresolved review threads.
