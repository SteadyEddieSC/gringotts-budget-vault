# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v117 — Import Profiles & Field Validation**  
Current quality-infrastructure release: **v117 — Profile and Field-Validation Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## Import Profiles & Field Validation

v117 adds reusable browser-local mapping profiles to Tools → Import transactions without replacing the v115 guarded parser or writer.

### Exact-compatible profiles

Profiles remember reviewed import metadata only:

- user-supplied profile name;
- format, schema, and delimiter;
- a non-reversible ordered-header signature;
- mapped source header names;
- date order and amount-sign interpretation;
- account handling and destination label;
- explicit source-category preference;
- timestamps.

Profiles never contain transaction rows, raw records, source file content, source filenames, source fingerprints, balances, credentials, or full unmasked account identifiers.

A profile applies only when format, schema, delimiter, ordered headers, and all remembered mapped headers match exactly. One compatible profile applies automatically. Multiple compatible profiles require an explicit selection.

### Profile controls

The Import task provides:

- Apply Selected Profile;
- Save New Profile;
- Update Profile;
- New Profile;
- Delete Profile.

Profile writes are bounded to 24 records, sanitized, browser-local, and read-back verified. Applying a profile changes only the in-memory import session and does not write transactions.

### Field-level explanations

v117 explains the current interpretation of:

- dates and ambiguity handling;
- signed amounts or debit/credit columns;
- stable transaction IDs;
- account mapping and masking;
- pending status;
- source categories;
- transaction type;
- profile-remembered field choices.

The normalized preview and all existing unresolved-field blocking remain authoritative.

## UI architecture

The six primary destinations remain:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

Reports continues to show one of eight report pages at a time on screen while Print / Save PDF includes all eight pages. Tools continues to separate incremental transaction import from full vault restore. Activity secondary navigation remains compact on narrow phones.

## Bank Export Import & Mapping

v115 remains the guarded local import engine under the v117 profile and validation layer.

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

Full restore remains separate and writes only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

## Privacy and data boundary

Do not commit or attach:

- bank or credit-card exports;
- Gringotts vault backups;
- saved household import profiles;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- bank exports are parsed in memory inside the browser;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- profiles retain mapping metadata only;
- source account identifiers are masked when mapped;
- raw imported rows are not copied into receipts or profiles;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Performance and staged release process

The initial request budget remains unchanged because profile code and `styles/v117.css` load only after Tools → Import is rendered.

The parser/static gate runs before Playwright browser installation:

- v115 and v117 modules are checked with `node --check`;
- parser, profile, mapping, malformed-input, size-limit, and mutation tests use Node's built-in runner;
- desktop and responsive browser jobs cannot begin until preflight passes;
- Chromium runs before Firefox and WebKit installation;
- Android Chromium runs before iPad and iPhone WebKit;
- keyboard and visual contracts run before the longer axe inventory;
- diagnostics upload only on failure;
- draft pull requests skip expensive protected jobs.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md).

## Automated testing and security

The final merge gate covers:

- browser-free parser and profile-model preflight;
- Chromium, Firefox, and WebKit desktop behavior;
- iPad, Android, and iPhone/WebKit layouts;
- profile save, auto-apply, conflicts, incompatibility, deletion, and vault noninterference;
- field-validation explanations and profile observer stability;
- all eight report-preview pages and complete print output;
- signed CSV, debit/credit, OFX-family, and legacy JSON imports;
- duplicate, rollback, backup, restore, and verification behavior;
- month close, forecast, debt, goals, Guided Plan, Insights, and Review Queue safeguards;
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

- [`RELEASE_NOTES_v117_IMPORT_PROFILES_FIELD_VALIDATION.md`](RELEASE_NOTES_v117_IMPORT_PROFILES_FIELD_VALIDATION.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
