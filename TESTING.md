# Gringotts Budget Vault Testing

## Data boundary

All tests use fictional fixtures and isolated browser contexts.

Tests must never read, commit, upload, or publish a real vault, bank export, statement, profile, revision history, profile bundle, dry-run diagnostic, import receipt, receipt audit, batch index, timeline package, backup, report, screenshot, or account identifier.

Synthetic sources include:

- `tests/fixtures/synthetic-vault.json`;
- signed and separate debit/credit CSV;
- fictional card, ledger, wallet, and OFX/QFX data;
- fictional legacy Gringotts JSON packages;
- inline profile, revision, dry-run, receipt, audit, and batch-link metadata;
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

- format and delimiter detection;
- quoted and multiline fields;
- mapping, date, amount, and sign validation;
- OFX-family parsing;
- size and row limits;
- deterministic malformed-input mutations;
- profile identity, compatibility, sanitization, and safe application;
- portable bundle classification and reviewed Add/Replace/Skip plans;
- revision redaction and bounded history;
- dry-run privacy and stale-signature detection;
- receipt arithmetic and manual rollback guidance;
- dry-run-to-receipt reconciliation and mismatch rejection;
- bounded batch-index storage and deduplication;
- continuous, legacy, increase, and decrease lineage;
- timeline filtering and download privacy;
- the detailed v121–v127 Roadmap;
- module-instance and presentation-ownership contracts.

GitHub also runs `node --check` against active v115–v121 modules before installing browsers.

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

## v121 receipt-integrity coverage

Tests verify:

- existing receipts remain authoritative and unchanged;
- destination-family sequence is derived from timestamps and counts;
- continuity states include origin, linked, legacy, untracked increase, and count decrease;
- duplicate receipt identities become Needs review;
- repeated source fingerprints are informational rather than destructive triggers;
- filters work for integrity, result, lineage, dry-run state, destination, and search;
- receipt and timeline review leaves the vault byte-for-byte unchanged;
- manual backup and restore guidance remains available;
- no automatic repair, rollback, deletion, or transaction change exists.

## Verified dry-run linkage

A real synthetic guarded-import test verifies:

- the v121 listener loads before inherited route handlers;
- Prepare Dry Run stages current sanitized metadata only;
- the v115 writer still requires backup, acknowledgement, confirmation, and verification;
- the vault grows only by the expected approved rows;
- the new receipt reconciles to normalized, insert, skip, format, and schema metadata;
- exactly one bounded link is stored;
- index read-back succeeds;
- raw source and household fields are absent;
- stale or mismatched dry runs are rejected.

## Timeline-download privacy

Full and selected timeline packages must exclude:

- transaction rows;
- source filenames and fingerprints;
- mapping summaries;
- destination storage keys;
- account identifiers and labels;
- merchant names;
- balances, credentials, and vault contents.

Packages retain only sanitized source metadata, counts, checks, lineage, readiness, and explicit privacy declarations.

## Workbook and Roadmap coverage

Tests verify:

- the workbook advertises and downloads 35 sheets;
- Receipt Integrity and Batch Lineage are included;
- the existing Import Receipts sheet remains visible;
- the Roadmap displays v121 through v127;
- every release includes capabilities, dependencies, safeguards, and outcome;
- v121 is current and later releases are planned;
- desktop and phone layouts remain within the viewport.

## Preserved v120–v117 coverage

The suite continues to verify:

- v120 receipt arithmetic, backup expectations, sanitized downloads, and manual-only rollback;
- v119 revision-gated Update/Replace and metadata-only dry runs;
- v118 sanitized portable definitions and reviewed Add/Replace/Skip;
- v117 exact-compatible bounded profiles and field explanations.

## Lazy loading and stability

Tests verify:

- v118–v121 route code and CSS are absent from the initial Dashboard request set;
- route layers load before Tools or Reports renders;
- the Lighthouse request budget remains 45;
- v121 reuses the active v115 and v117 module instances;
- v121 interceptors register before inherited controls;
- v120 yields presentation ownership to v121;
- profile, dry-run, timeline, roadmap, reports, and Import/Restore surfaces settle without recursive mutation loops.

## Preserved functional coverage

The established suite continues to verify:

- six primary destinations and persistent shell;
- one report page on screen and all eight print pages;
- separate import and restore tasks;
- signed CSV, debit/credit, OFX/QFX, and legacy JSON imports;
- exact, fuzzy, and pending-to-posted duplicate handling;
- missing-only insertion, populated backup, rollback, and read-back verification;
- restore destination `gringottsBudgetVault.latest` and empty-restore blocking;
- Review Queue, goals, Vault Health, close, reopen, forecast, bills, paydays, debt, Insights, and Guided Plan;
- annual tracker and local downloads;
- phone navigation and no document-level overflow.

## Accessibility and visual quality

The quality suite blocks serious or critical axe findings for configured WCAG and best-practice tags.

Fresh-render v121 coverage scans:

- timeline summary and filters;
- selected batch detail;
- lineage and dry-run cards;
- integrity tables and manual rollback guidance;
- v121–v127 Roadmap;
- desktop and phone layouts.

Existing axe inventory covers all primary and secondary sections, report pages, both Import/Restore tasks, profiles, mappings, bundles, revisions, dry runs, and legacy audit behavior.

Keyboard coverage includes Skip to content, visible focus, tabs, arrow navigation, labeled scrollable regions, native controls, mobile-menu Escape, acknowledgements, and explicit actions.

No PNG baseline is committed. Screenshots, traces, video, axe JSON, Playwright reports, and Lighthouse files upload only on failure.

## Staged GitHub Actions

Draft PRs skip protected jobs. When ready:

1. syntax and browser-free models;
2. Chromium desktop and Android Chromium;
3. Firefox/WebKit desktop and iPad/iPhone WebKit;
4. keyboard and visual contracts;
5. axe inventories;
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

- v121 startup and hardened headers;
- all six destinations;
- batch timeline, profiles, revisions, dry run, and bundle picker;
- supported-format mapping controls;
- separate full restore;
- v121–v127 Roadmap;
- Guided Plan;
- report pages, Import Receipts, Receipt Integrity, Batch Lineage, and report range;
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
