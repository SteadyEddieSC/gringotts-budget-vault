# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v120 — Import Receipt Audit & Rollback Guidance**  
Current quality-infrastructure release: **v120 — Receipt Audit, Detailed Roadmap, and Lazy-Route Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## Import Receipt Audit & Rollback Guidance

v120 turns the existing metadata-only import receipts into a practical local audit view.

For each completed or reviewed no-change import, Tools → Import & Restore now explains:

- source format, schema, encoding, and retained date coverage;
- incoming, inserted, skipped, exact-duplicate, fuzzy-candidate, and warning counts;
- destination count before and after the import;
- whether the guarded writer recorded a verified or verified-no-change result;
- whether count arithmetic is internally coherent;
- whether the current readable destination still matches the receipt's after-count;
- whether a pre-import backup was expected;
- the expected backup filename pattern and pre-import transaction count.

A current-vault count difference is a review note rather than an automatic failure because legitimate household activity may have occurred after the import.

### Manual rollback only

No automatic rollback is available.

v120 never scans a backup directory, restores a vault, deletes rows, or rewrites transactions from the receipt-audit screen. It provides a manual checklist and links to the separate Full vault restore task, which still requires a populated preview, acknowledgement, confirmation, and read-back verification.

### Sanitized receipt-audit download

A selected receipt can be downloaded as a metadata-only JSON audit. The download contains source format/schema metadata, counts, verification state, audit checks, backup expectations, and manual guidance.

It excludes transaction rows, source filenames, source fingerprints, mappings, destination storage keys, account identifiers, merchant names, and vault contents.

## Detailed roadmap horizon

Tools → Roadmap now shows a detailed horizon from v120 through v126 instead of only the next release.

Every release card includes:

- purpose;
- planned capabilities;
- dependencies;
- safety boundaries;
- expected household outcome.

The same horizon is maintained in [`ROADMAP.md`](ROADMAP.md). The next release is the strongest commitment; later releases are directional and may move as real use, testing, or safety findings change priorities.

Current horizon:

- **v121:** Receipt Integrity & Import Batch Reconciliation
- **v122:** Account Cleanup & Merge Planning
- **v123:** Recurring Cost Decisions & Subscription Review
- **v124:** Household Scenario Comparison
- **v125:** Close History & Trend Explainability
- **v126:** Data Portability & Long-Term Maintenance

## Profile Versioning & Dry-Run Diagnostics

v119 remains the revision and readiness layer below v120.

Updating an existing mapping profile or replacing one through a portable bundle pauses before storage and shows every changed mapping and normalization option. Revision history is stored separately under `gringottsImportProfileRevisions.v1`, capped at 60 summaries total and 8 per profile, with destination-account-label values redacted.

The local import dry run summarizes source format/schema, mappings, non-sensitive options, validation counts, date coverage, duplicate counts, and readiness without writing transactions. Its download excludes rows, filenames, fingerprints, account identifiers, destination labels, balances, credentials, and vault contents.

## Profile Portability & Field Validation

v118 and v117 remain the portable-definition and mapping-profile layers.

Portable profile bundles omit local profile IDs, local timestamps, transaction rows, source files, filenames, fingerprints, balances, credentials, tokens, and full account numbers. Imported definitions require explicit Add, Replace, or Skip decisions, and Replace is limited to an identity-matched profile and revision-gated by v119.

Browser-local profiles remain capped at 24 sanitized records and apply automatically only when exactly one saved profile matches the source format, schema, delimiter, ordered headers, and remembered mapped headers.

## UI architecture

The six primary destinations remain:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

Reports shows one of eight pages at a time on screen while Print / Save PDF includes all eight. Tools separates incremental transaction import from full vault restore. Activity secondary navigation remains compact on narrow phones.

The initial Dashboard request budget remains protected: portability, revision, dry-run, receipt-audit, and detailed-roadmap layers load only when Tools or Reports is opened.

## Bank Export Import & Mapping

v115 remains the guarded local transaction engine beneath the v117–v120 metadata and audit layers.

Supported local sources:

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon and pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

The workflow provides format/schema inspection, explicit mapping, date-order and signed-amount interpretation, normalized preview, masked accounts, exact and fuzzy duplicate review, coverage warnings, backup-first insertion, rollback, count/token verification, and metadata-only receipts.

Imported rows default to `Other`, unreviewed, and review-required unless source-category use is explicitly selected. Incremental import never replaces the destination vault.

Full restore remains separate and writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

## Privacy and data boundary

Do not commit or attach:

- bank or credit-card exports;
- Gringotts vault backups;
- saved household profiles, revision-history exports, profile bundles, dry-run diagnostics, or receipt-audit downloads;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- bank exports and profile bundles are parsed in browser memory;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- profiles, bundles, revision history, dry runs, receipts, and receipt audits retain metadata only;
- raw imported rows are not copied into receipts, profiles, revisions, diagnostics, or audits;
- audit downloads omit filenames, fingerprints, mappings, destination keys, identifiers, merchants, and vault contents;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Performance and staged release process

The parser/static gate runs before Playwright browser installation:

- active v115–v120 modules are checked with `node --check`;
- parser, profile, portability, revision, diagnostic, receipt-audit, roadmap, malformed-input, size-limit, and mutation tests use Node's built-in runner;
- desktop and responsive jobs cannot begin until preflight passes;
- Chromium runs before Firefox and WebKit installation;
- Android Chromium runs before iPad and iPhone WebKit;
- keyboard and visual contracts run before axe inventories;
- focused v120 receipt-audit and roadmap axe tests start from fresh renders;
- diagnostics upload only on failure;
- draft pull requests skip expensive protected jobs.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Automated testing and security

The final merge gate covers:

- browser-free parser, profile, portability, revision, diagnostic, receipt-audit, and roadmap preflight;
- Chromium, Firefox, and WebKit desktop behavior;
- Android Chromium, iPad WebKit, and iPhone WebKit layouts;
- sanitized profile, dry-run, and receipt-audit downloads;
- vault byte-for-byte noninterference;
- explicit manual-only rollback guidance;
- the seven-release roadmap horizon;
- field validation and observer stability;
- all eight report-preview pages and print completeness;
- duplicate, backup, restore, rollback, and verification behavior;
- month close, forecast, debt, goals, Guided Plan, Insights, and Review Queue safeguards;
- axe, keyboard, visual contracts, and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, npm audit, CodeQL, pinned Actions, and least-privilege permissions.

OpenSSF Scorecard findings are triaged in [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md).

## Local testing

Requirements:

- Node.js 24;
- Python 3 for the local static server.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See [`TESTING.md`](TESTING.md) and [`QUALITY_GATES.md`](QUALITY_GATES.md) for the complete matrix.

## Unsupported import formats

PDF statements, Office files, archives, executables, unsupported binaries, files above 5 MB, and transaction imports above the configured row limit remain blocked.

CAMT, MT940, guarded XLSX, institution-specific JSON, OCR, and PDF extraction require separate representative fixtures and safety review.

## Release documentation

- [`RELEASE_NOTES_v120_IMPORT_RECEIPT_AUDIT.md`](RELEASE_NOTES_v120_IMPORT_RECEIPT_AUDIT.md)
- [`RELEASE_NOTES_v119_PROFILE_VERSIONING_DIAGNOSTICS.md`](RELEASE_NOTES_v119_PROFILE_VERSIONING_DIAGNOSTICS.md)
- [`RELEASE_NOTES_v118_PROFILE_PORTABILITY_PATTERNS.md`](RELEASE_NOTES_v118_PROFILE_PORTABILITY_PATTERNS.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
