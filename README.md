# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application release: **v114 — Guided Household Planning**  
Current quality-infrastructure release: **v114 — Staged Release Gates**

## Live application

https://gringotts-budget-vault.pages.dev/

## Guided Household Planning

v114 adds **Activity → Plan**, an explainable local checklist generated from:

- goals and contribution pace;
- month-close readiness and post-close drift;
- pending and review-queue rows;
- saved bills, paydays, cash-buffer pressure, and negative forecast days;
- debt priority, promotional APR deadlines, and payoff gaps;
- high-attention Household Insights and recurring-cost increases.

Every generated item shows why it appeared, its evidence, and a recommended next step. Viewing the checklist performs no write. A user must explicitly select **Save Plan Item** before status, owner, target date, or notes are stored.

Guided Plan data uses a separate browser-local key, `gringottsGuidedPlan.v1`, and never changes transactions, categories, budgets, goals, debt balances, forecast settings, recurring preferences, or month-close history.

The Reports Center now includes:

- an eighth printable Guided Plan page;
- Guided Plan actions in the family meeting brief;
- Guided Plan and Planning History workbook sheets;
- a 32-sheet Vault Workbook;
- a dedicated Guided Plan Markdown export;
- v114-named local workbook, meeting-pack, backup, calendar, rule-review, and diagnostics downloads.

## Faster, quieter release process

v114 changes how releases are validated without weakening the final merge gate:

- development remains on a feature branch before a PR is opened;
- draft PRs skip expensive browser, quality, security, supply-chain, and CodeQL jobs;
- Chromium runs as the browser preflight before Firefox and WebKit are installed;
- tablet and Android checks run before mobile WebKit is installed;
- keyboard and visual contracts run before the longer axe surface inventory;
- diagnostics are uploaded only when a job fails;
- the full required matrix still runs when the PR is marked ready for review.

See [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md) for the exact workflow.

## Privacy and data boundary

Do not commit or attach:

- bank or credit-card transaction exports;
- Gringotts vault backups;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- QFX, OFX, QBO, XLSX, DOCX, or PDF files containing personal data.

The application remains local-first:

- transaction processing, duplicate reconciliation, insights, and guided planning run in the browser;
- report and checklist settings never copy transaction arrays;
- custom-range, prior-year, Markdown, CSV, XLSX, and printable reports are generated locally;
- month-close history stores summaries and signatures rather than transaction copies;
- import history stores metadata only;
- no service worker or offline application cache is registered;
- an empty vault is never automatically saved over a populated vault;
- broad transaction writes remain backup-first and read-back verified.

## Future bank export imports

A dedicated **v115 — Bank Export Import & Mapping** release is planned for:

- CSV and other delimited exports;
- OFX;
- QFX;
- QBO.

It requires content-aware format and schema detection, explicit field mapping, amount-sign validation, duplicate review, backup-first writes, confirmation, and read-back verification. See [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md).

## Automated testing and security

The final merge gate covers:

- Chromium, Firefox, and WebKit desktop behavior;
- iPad, Android-phone, and iPhone/WebKit layouts;
- Guided Plan generation, explicit saves, read-back verification, history, source navigation, and no-write viewing;
- Household Insights, reports, eight-page print layout, and 32-sheet downloads;
- restore, duplicate import, month close, forecast, debt, goals, and Review Queue safeguards;
- axe accessibility scans, tab semantics, focus, scroll regions, and mobile navigation;
- privacy-safe visual contracts and Lighthouse budgets;
- full-history privacy and Gitleaks scans;
- Dependency Review, high/critical `npm audit`, and CodeQL;
- pinned GitHub Actions and least-privilege workflow permissions.

OpenSSF Scorecard findings are triaged in [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md). Some findings are direct code or documentation fixes, some require manual repository settings, and some are accepted tradeoffs for a solo-maintained static personal project.

## Local browser testing

Requirements:

- Node.js 24;
- Python 3.

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

- [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md) — staged branch, draft, ready-for-review, and merge process;
- [`TESTING.md`](TESTING.md) — browser and security commands;
- [`QUALITY_GATES.md`](QUALITY_GATES.md) — accessibility, visual-contract, and Lighthouse details;
- [`SCORECARD_ALERTS.md`](SCORECARD_ALERTS.md) — OpenSSF finding triage;
- [`BANK_IMPORT_ROADMAP.md`](BANK_IMPORT_ROADMAP.md) — planned guarded bank-export workflow;
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
