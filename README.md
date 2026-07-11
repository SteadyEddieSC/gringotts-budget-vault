# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v122 — Account Cleanup & Merge Planning**  
Current quality-infrastructure release: **v122 — Account Planning, Route Ownership, and Metadata-Boundary Contracts**

## Live application

https://gringotts-budget-vault.pages.dev/

## Account Cleanup & Merge Planning

v122 adds a planning-first cleanup surface inside **Tools → Import & Restore**.

It provides:

- a masked inventory of account labels used by the current readable vault;
- transaction, pending, owner, and date-range counts;
- explainable duplicate-label, spelling-drift, and possible-rename candidates;
- evidence such as shared words, masked final-four matches, account type, and date-range relationship;
- counts of references in recurring items, rules, budgets, bills and paydays, goals, and planning metadata;
- an explicit decision for every current cleanup candidate;
- a separate populated backup and privacy-safe cleanup-plan download.

v122 does **not** rename accounts, merge transaction histories, delete transactions, rewrite rules, alter budgets, change recurring decisions, or apply a cleanup plan.

## Cleanup-plan decisions

Each candidate can be marked:

- Keep separate;
- Plan rename left → right;
- Plan rename right → left;
- Plan merge left → right;
- Plan merge right → left;
- Investigate.

These are planning decisions only.

The bounded browser-local store is:

`gringottsAccountCleanupPlan.v1`

It stores candidate IDs, decisions, timestamps, and an inventory signature. It is capped at 120 entries, read-back verified, and restored to the previous raw value after failure. When the inventory changes, prior decisions are treated as stale rather than silently reused.

## Cleanup-plan privacy boundary

The sanitized cleanup package includes masked account summaries, counts, candidate evidence, and decisions.

It excludes:

- transaction rows;
- raw account labels;
- full account identifiers;
- balances;
- merchant names;
- source files;
- credentials and tokens;
- vault contents.

The current populated vault backup remains a separate explicit download.

## Preserved Receipt Integrity and import architecture

v121 remains active beneath v122 and continues to provide:

- receipt integrity and count reconciliation;
- receipt-to-receipt continuity;
- duplicate receipt identity detection;
- repeated-source notes;
- optional verified dry-run lineage;
- sanitized full-timeline and selected-batch downloads;
- manual backup and rollback guidance.

v115 remains the authoritative parser, duplicate-review engine, guarded transaction writer, and receipt store. v117–v119 continue to provide profiles, portability, revision review, and metadata-only dry runs.

Full Vault Restore remains a separate task writing only to `gringottsBudgetVault.latest` after a populated preview, acknowledgement, confirmation, and read-back verification.

## Workbook and reports

The local Vault Workbook now contains **37 sheets**.

v122 adds:

- **Account Inventory**;
- **Account Cleanup Plan**.

The existing Import Receipts, Receipt Integrity, and Batch Lineage sheets remain. Reports still previews one of eight pages on screen while Print / Save PDF includes all eight.

## Detailed roadmap horizon

Tools → Roadmap and [`ROADMAP.md`](ROADMAP.md) show v122 through v128 with purpose, capabilities, dependencies, safety boundaries, and expected household outcomes.

- **v123:** Recurring Cost Decisions & Subscription Review
- **v124:** Household Scenario Comparison
- **v125:** Close History & Trend Explainability
- **v126:** Data Portability & Long-Term Maintenance
- **v127:** Family Review Cadence & Governance Packs
- **v128:** Household Data Quality & Stewardship Review

v123 is the strongest next commitment. Later entries remain directional.

## Supported local import sources

- CSV, TSV, semicolon, and pipe-delimited text;
- OFX, QFX, and QBO;
- existing Gringotts JSON transaction packages.

The workflow retains explicit mapping, date/sign interpretation, validation, account masking, exact/fuzzy duplicate review, coverage warnings, populated backup, acknowledgement, confirmation, missing-only insertion, raw-value rollback, count/token verification, and metadata-only receipts.

## UI architecture

The six primary destinations remain:

- Dashboard;
- Money;
- Calendar;
- Reports;
- Activity;
- Tools.

Account cleanup, receipt review, transaction import, and full restore remain organized under Tools → Import & Restore rather than adding another primary destination.

The initial Dashboard request budget remains protected. v118–v122 route code and CSS load only after Tools or Reports is opened.

## Privacy and data boundary

Do not commit or attach:

- real bank or card exports;
- vault backups;
- household profile, revision, dry-run, receipt, batch-index, timeline, or cleanup-plan exports;
- account or routing numbers;
- screenshots containing household financial data;
- filled workbooks or generated reports;
- real QFX, OFX, QBO, CSV, XLSX, DOCX, or PDF financial files.

The application remains local-first:

- source files are parsed in browser memory;
- no transaction upload, parser API, analytics endpoint, or institution credential connection exists;
- profiles, bundles, revisions, dry runs, receipts, audits, batch links, and cleanup decisions retain bounded metadata only;
- reports and downloads are generated locally;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Automated testing and security

The merge gate covers:

- browser-free parser and metadata-model tests;
- account inventory, masking, similarity, decision, stale-plan, and privacy tests;
- v121 receipt-integrity and dry-run-link regression tests;
- Chromium, Firefox, and WebKit desktop behavior;
- Android Chromium, iPad WebKit, and iPhone WebKit layouts;
- keyboard, visual-contract, axe, and Lighthouse budgets;
- the 37-sheet workbook and v122–v128 Roadmap;
- vault byte-for-byte noninterference during planning;
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

- [`RELEASE_NOTES_v122_ACCOUNT_CLEANUP_MERGE_PLANNING.md`](RELEASE_NOTES_v122_ACCOUNT_CLEANUP_MERGE_PLANNING.md)
- [`RELEASE_NOTES_v121_RECEIPT_INTEGRITY.md`](RELEASE_NOTES_v121_RECEIPT_INTEGRITY.md)
- [`ROADMAP.md`](ROADMAP.md)
- [`UI_GOVERNANCE.md`](UI_GOVERNANCE.md)
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md)
