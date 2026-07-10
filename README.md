# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v121 — Receipt Integrity & Import Batch Reconciliation**  
Current quality-infrastructure release: **v121 — Timeline, Batch Lineage, and Route-Ownership Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## Receipt Integrity & Import Batch Reconciliation

v121 turns retained metadata-only import receipts into a filterable local timeline.

Tools → Import & Restore now shows:

- receipt integrity state;
- inserted, skipped, incoming, before, and after counts;
- predecessor and successor batch identities;
- receipt-to-receipt count continuity;
- duplicate receipt-ID failures;
- repeated-source information;
- optional dry-run readiness lineage;
- the v120 manual backup and rollback guidance.

Continuity states distinguish the earliest retained receipt, continuous counts, legacy counts, untracked increases, and count decreases. A continuity note never repairs history, restores a backup, deletes rows, or changes transactions.

### Timeline filters

The local timeline can be filtered by:

- integrity state;
- inserted/no-change result;
- lineage state;
- dry-run link state;
- destination family;
- local receipt, source, schema, or format search.

Source filenames, fingerprints, and destination keys may appear in the local browser review but are omitted from downloaded timeline packages.

## Verified dry-run lineage

v121 observes the existing explicit **Prepare Dry Run** and **Confirm Missing-Only Import** actions without replacing the v119 diagnostic model or v115 transaction writer.

A dry-run link is retained only when the resulting receipt reconciles on:

- format;
- schema label;
- normalized rows;
- would-insert count;
- would-skip count.

Links are stored separately under `gringottsImportBatchIndex.v1`, capped at 80, read-back verified, and rolled back to the prior raw value after failure.

A missing link does not invalidate an older import. v121 does not infer or backfill dry-run history.

## Metadata boundary

The batch index stores only references, timestamps, a non-reversible signature, source format/schema labels, counts, readiness flags, and explicit privacy declarations.

It excludes:

- transaction rows;
- filenames and source fingerprints;
- mapping summaries;
- destination storage keys;
- account identifiers and labels;
- merchants;
- balances;
- credentials and tokens;
- vault contents.

Sanitized downloads are available for the full timeline and a selected batch.

## Workbook and reports

The local Vault Workbook now contains **35 sheets**.

v121 adds:

- **Receipt Integrity**;
- **Batch Lineage**.

The existing Import Receipts sheet remains. Reports still previews one of eight pages on screen while Print / Save PDF includes all eight.

## Detailed roadmap horizon

Tools → Roadmap and [`ROADMAP.md`](ROADMAP.md) now show v121 through v127 with purpose, planned capabilities, dependencies, safety boundaries, and expected outcomes.

- **v122:** Account Cleanup & Merge Planning
- **v123:** Recurring Cost Decisions & Subscription Review
- **v124:** Household Scenario Comparison
- **v125:** Close History & Trend Explainability
- **v126:** Data Portability & Long-Term Maintenance
- **v127:** Family Review Cadence & Governance Packs

v122 is the strongest next commitment. Later entries remain directional.

## Preserved import architecture

v115 remains the authoritative transaction engine beneath v117–v121.

Supported local sources:

- CSV, TSV, semicolon, and pipe-delimited text;
- OFX, QFX, and QBO;
- existing Gringotts JSON transaction packages.

The workflow retains explicit mapping, date/sign interpretation, validation, account masking, exact/fuzzy duplicate review, coverage warnings, populated backup, acknowledgement, confirmation, missing-only insertion, rollback, count/token verification, and metadata-only receipts.

Full restore remains separate and writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

## UI architecture

The six primary destinations remain:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

The persistent shell, compact phone navigation, separated Import/Restore tasks, and one live ES-module runtime remain authoritative.

The initial Dashboard request budget remains protected: profile portability, revisions, dry runs, receipt auditing, batch lineage, and detailed Roadmap code load only after Tools or Reports is opened.

## Privacy and data boundary

Do not commit or attach:

- real bank or card exports;
- vault backups;
- household profile, revision, dry-run, receipt, batch-index, or timeline exports;
- account or routing numbers;
- screenshots containing household financial data;
- filled workbooks or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- source files are parsed in browser memory;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- profiles, bundles, revisions, dry runs, receipts, audits, and batch links retain bounded metadata only;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Automated testing and security

The merge gate covers:

- browser-free parser, profile, portability, revision, receipt-audit, batch-lineage, and roadmap tests;
- real synthetic dry-run-to-receipt linking through the unchanged guarded writer;
- Chromium, Firefox, and WebKit desktop behavior;
- Android Chromium, iPad WebKit, and iPhone WebKit layouts;
- timeline filtering and privacy-safe downloads;
- vault noninterference and manual-only rollback;
- all eight report pages and the 35-sheet workbook;
- axe, keyboard, visual-contract, and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, npm audit, CodeQL, pinned Actions, and least-privilege permissions.

## Local testing

Requirements:

- Node.js 24;
- Python 3 for the static server.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See [`TESTING.md`](TESTING.md), [`QUALITY_GATES.md`](QUALITY_GATES.md), and [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Unsupported import formats

PDF statements, Office files, archives, executables, unsupported binaries, files above 5 MB, and imports above the configured row limit remain blocked.

CAMT, MT940, guarded XLSX, institution-specific JSON, OCR, and PDF extraction require separate representative fixtures and safety review.

## Release documentation

- [`RELEASE_NOTES_v121_RECEIPT_INTEGRITY.md`](RELEASE_NOTES_v121_RECEIPT_INTEGRITY.md)
- [`RELEASE_NOTES_v120_IMPORT_RECEIPT_AUDIT.md`](RELEASE_NOTES_v120_IMPORT_RECEIPT_AUDIT.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
