# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v115 — Bank Export Import & Mapping**  
Current quality-infrastructure release: **v115 — Parser-First Release Gates**

## Live application

https://gringotts-budget-vault.pages.dev/

## Bank Export Import & Mapping

v115 expands **Tools → Import / Restore** into a guarded local transaction-import workflow.

Supported local sources:

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon and pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

The workflow provides:

- format, schema, encoding, institution, row-count, and source-fingerprint inspection;
- raw source preview;
- explicit date, description, amount, debit, credit, status, account, memo, ID, category, and transaction-type mapping;
- explicit date-order and signed-amount interpretation;
- normalized transaction preview;
- ignored-column disclosure;
- masked account handling;
- exact, fingerprint, fuzzy, and pending-to-posted duplicate review;
- coverage and overlap warnings;
- required populated backup before transaction insertion;
- acknowledgement, confirmation, missing-only insertion, rollback, and read-back verification;
- metadata-only import receipts.

Imported rows default to `Other`, unreviewed, and review-required unless source-category use is explicitly selected. Incremental bank import never replaces the destination vault.

Full vault restore remains a separate guarded workflow and still writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

The Reports Center now includes an **Import Receipts** sheet, expanding the Vault Workbook from 32 to **33 sheets**.

See [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md) for implemented details and future candidate formats.

## Guided Household Planning

Activity → Plan remains an explainable local checklist generated from goals, month-close readiness, forecast pressure, debt priorities, recurring-price changes, and Household Insights.

Viewing the checklist performs no write. Only **Save Plan Item** stores status, owner, target date, notes, and history under the separate `gringottsGuidedPlan.v1` key.

## Faster, quieter release process

v115 adds a browser-free gate ahead of Playwright:

- current release modules are checked with `node --check`;
- parser, mapping, malformed-input, size-limit, and deterministic mutation tests run with Node's built-in test runner;
- no browser or additional parser-test dependency is installed for this stage;
- desktop and responsive browser jobs cannot begin until the parser/static job passes;
- Chromium desktop still runs before Firefox and WebKit installation;
- Android Chromium still runs before iPad and iPhone WebKit;
- keyboard and visual contracts still run before the longer axe inventory;
- diagnostics upload only on failure;
- draft pull requests still skip expensive gates.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Privacy and data boundary

Do not commit or attach:

- bank or credit-card exports;
- Gringotts vault backups;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- bank exports are parsed in memory inside the browser;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- source account identifiers are masked when mapped;
- raw imported rows are not copied into metadata receipts;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Unsupported import formats

v115 intentionally blocks PDF statements, Office files, archives, executables, unsupported binaries, files above 5 MB, and imports above the configured transaction-row limit.

CAMT, MT940, XLSX, institution-specific JSON, OCR, and PDF extraction remain future candidates requiring their own fixtures and safety review.

## Automated testing and security

The final merge gate covers:

- browser-free parser and static preflight;
- Chromium, Firefox, and WebKit desktop behavior;
- iPad, Android, and iPhone/WebKit layouts;
- signed CSV and separate debit/credit normalization;
- quoted commas, multiline memos, BOM, multiple delimiters, ambiguous dates, and sign modes;
- OFX/QFX/QBO FITIDs and masked accounts;
- exact, fuzzy, pending-to-posted, missing-only, rollback, backup, and verification behavior;
- legacy Gringotts JSON compatibility;
- restore, month close, forecast, debt, goals, Guided Plan, and Review Queue safeguards;
- 33-sheet reports and eight-page printable reports;
- axe, keyboard, visual contracts, and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, high/critical npm audit, and CodeQL;
- pinned Actions and least-privilege permissions.

OpenSSF Scorecard findings are triaged in [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md).

## Local testing

Requirements:

- Node.js 24;
- Python 3 for the local static server.

Fast parser-only gate:

```bash
npm run test:parser
```

Complete local checks:

```bash
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
npm run test:local
npm run privacy:history
npm audit --audit-level=high
```

## Documentation

- [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md) — parser-first, draft, ready-for-review, and merge process;
- [`TESTING.md`](TESTING.md) — parser, browser, and security commands;
- [`QUALITY_GATES.md`](QUALITY_GATES.md) — accessibility, visual-contract, Lighthouse, and parser-preflight details;
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md) — implemented import safeguards and future formats;
- [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md) — OpenSSF finding triage;
- [`GITHUB_SETTINGS_CHECKLIST.md`](GITHUB_SETTINGS_CHECKLIST.md) — manual repository settings;
- [`SECURITY.md`](SECURITY.md) — private vulnerability reporting and sensitive-data boundaries.

## Cloudflare Pages deployment

- Project type: Pages / Static
- Repository: `SteadyEddieSC/gringotts-budget-vault`
- Production branch: `main`
- Build command: leave blank
- Output directory: `/`

## Project status

The application is an unofficial fan-themed personal project and is not affiliated with or endorsed by Warner Bros., the Wizarding World, or any financial institution.
