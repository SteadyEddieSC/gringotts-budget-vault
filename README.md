# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v116 — UI Architecture Review**  
Current quality-infrastructure release: **v116 — Task-Based UI Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## UI Architecture Review

v116 keeps the six established primary destinations:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

The review found that the primary architecture still matches durable household goals. The changes therefore focus on dense workflows rather than adding or moving top-level destinations.

### Reports

Reports now presents three clear tasks:

- choose a reusable report range;
- preview one of the eight family-report pages;
- download local exports.

The preview uses a native select plus Previous and Next controls. Only one report page is shown on screen, while Print / Save PDF still includes all eight pages.

The annual tracker, 33-sheet Vault Workbook, range CSV, selected-month quick XLSX, executive Markdown, family meeting pack, and Guided Plan remain available.

### Import and restore

Tools → Import / Restore now has two explicit paths:

- **Import transactions** for reviewed missing-only transaction insertion;
- **Restore full vault** for replacement through the guarded restore workflow.

Bank import shows Inspect, Map, and Reconcile progress without storing new transaction copies or bypassing existing safeguards.

### Responsive behavior

- Activity secondary navigation scrolls horizontally on narrow phones instead of creating five oversized rows.
- Report downloads use three columns on wide displays, two on tablets, and one on phones.
- Import task controls and progress stack on phones.
- Tables remain inside their own scroll containers.

## Bank Export Import & Mapping

v115 remains the guarded local import engine under the v116 presentation.

Supported local sources:

- CSV and comma-delimited text;
- TSV and tab-delimited text;
- semicolon and pipe-delimited text;
- OFX;
- QFX;
- QBO;
- existing Gringotts JSON transaction packages.

The workflow provides format and schema inspection, explicit mapping, date-order and signed-amount interpretation, normalized preview, masked accounts, exact and fuzzy duplicate review, coverage warnings, backup-first insertion, rollback, read-back verification, and metadata-only receipts.

Imported rows default to `Other`, unreviewed, and review-required unless source-category use is explicitly selected. Incremental import never replaces the destination vault.

Full restore remains separate and still writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

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

## Faster, quieter release process

The parser/static gate runs before Playwright browser installation:

- current v115 and v116 modules are checked with `node --check`;
- parser, mapping, malformed-input, size-limit, and mutation tests use Node's built-in runner;
- desktop and responsive browser jobs cannot begin until preflight passes;
- Chromium runs before Firefox and WebKit installation;
- Android Chromium runs before iPad and iPhone WebKit;
- keyboard and visual contracts run before the longer axe inventory;
- diagnostics upload only on failure;
- draft pull requests skip expensive protected jobs.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Automated testing and security

The final merge gate covers:

- browser-free parser and static preflight;
- Chromium, Firefox, and WebKit desktop behavior;
- iPad, Android, and iPhone/WebKit layouts;
- all eight report-preview pages and complete print output;
- separated import and restore paths;
- signed CSV, debit/credit, OFX-family, and legacy JSON imports;
- duplicate, rollback, backup, and verification behavior;
- restore, month close, forecast, debt, goals, Guided Plan, and Review Queue safeguards;
- axe, keyboard, visual contracts, and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, high/critical npm audit, and CodeQL;
- pinned Actions and least-privilege permissions.

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

PDF statements, Office files, archives, executables, unsupported binaries, files above 5 MB, and imports above the configured transaction-row limit remain blocked.

CAMT, MT940, XLSX, institution-specific JSON, OCR, and PDF extraction require separate fixtures and safety review.

## Release documentation

- [`RELEASE_NOTES_v116_UI_ARCHITECTURE_REVIEW.md`](RELEASE_NOTES_v116_UI_ARCHITECTURE_REVIEW.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
