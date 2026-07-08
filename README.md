# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application runtime: **v111 — Household Reporting III**  
Current quality-infrastructure release: **v112 — Accessibility & Quality Automation**

## Live application

https://gringotts-budget-vault.pages.dev/

## Privacy and data boundary

This repository contains application code, synthetic test data, documentation, and automated tests only.

Do not commit or attach:

- bank or credit-card transaction exports;
- Gringotts vault backups;
- account or routing numbers;
- screenshots containing household financial data;
- filled spreadsheets or generated reports;
- QFX, OFX, QBO, XLSX, DOCX, or PDF files containing personal data.

The application remains local-first:

- transaction processing and duplicate reconciliation occur in the browser;
- report ranges are saved as settings only and never copy or mutate transactions;
- custom-range, prior-year, Markdown, CSV, XLSX, and printable reports are generated in the browser;
- month-close history stores summaries and signatures, not redundant transaction copies;
- forecast settings and debt planning remain separate from transaction history;
- import history stores metadata only, not redundant transaction copies;
- automated browser and quality tests use a fictional vault in an isolated browser profile;
- axe, visual-layout, and Lighthouse checks run against local static content only;
- no screenshot baseline containing transaction data is committed;
- no service worker or offline application cache is registered;
- the application must not automatically save an empty vault;
- broad transaction writes remain backup-first and verified after storage.

## Automated testing and security

Playwright regression tests cover:

- application startup and module errors;
- primary and secondary navigation;
- desktop, tablet, Android-phone, and iPhone layouts;
- month navigation and responsive overflow;
- custom report ranges and year-to-date presets;
- equivalent prior-year comparisons using fictional test rows;
- complete family report sections for goals, health, close, forecast, and debt;
- 28-sheet workbook and range CSV downloads;
- print-media page layout and screen-control hiding;
- Review Queue dropdowns and guarded editing;
- Goals and Vault Health;
- exact and fuzzy duplicate import review;
- missing-only imports, import history, date-gap warnings, and read-back verification;
- statement reconciliation and month-close blockers;
- verified close and reasoned reopen events without transaction changes;
- recurring bill/payday forecasting and local forecast settings;
- debt and promotional APR planning;
- malformed, missing-array, empty-import, and empty-restore blocking;
- report and backup downloads;
- service-worker absence and unexpected network writes.

v112 quality automation adds:

- axe-core scans across eight important household workflows;
- a release block for serious or critical WCAG-tagged violations;
- keyboard and skip-link smoke coverage;
- Lighthouse CI category, timing, resource-size, and request-count budgets;
- a zero third-party request budget;
- deterministic text-based visual-layout snapshots for key desktop and phone surfaces;
- short-lived accessibility, Lighthouse, screenshot-on-failure, trace, and video artifacts;
- security-drift enforcement for pinned quality tools and local synthetic data.

Public-repository and supply-chain automation adds:

- full-history secret scanning with Gitleaks;
- custom financial-data and forbidden-file history checks;
- dependency-change review on pull requests;
- high/critical `npm audit` enforcement;
- CodeQL analysis for JavaScript;
- OpenSSF Scorecard analysis;
- Dependabot updates for npm and GitHub Actions;
- full-commit-SHA pinning for every external GitHub Action;
- regression checks that prevent workflow-permission, action-pinning, security-header, and quality-gate drift.

The Cloudflare deployment serves a restrictive Content Security Policy, clickjacking protection, no-referrer policy, disabled worker execution, and cross-origin isolation headers suitable for the local-first static application.

See:

- [`TESTING.md`](TESTING.md) for automated checks and local commands;
- [`QUALITY_GATES.md`](QUALITY_GATES.md) for axe, Lighthouse, and visual-contract details;
- [`GITHUB_SETTINGS_CHECKLIST.md`](GITHUB_SETTINGS_CHECKLIST.md) for the exact repository settings that must be confirmed manually;
- [`SECURITY.md`](SECURITY.md) for private vulnerability reporting and sensitive-data boundaries.

## Local browser testing

Requirements:

- Node.js 24;
- Python 3.

```bash
npm ci
npx playwright install chromium firefox webkit
npm run test:local
npm run privacy:history
npm audit --audit-level=high
```

The quality suite uses exact temporary tool versions and does not modify the lockfile. See [`QUALITY_GATES.md`](QUALITY_GATES.md) for those commands.

## Cloudflare Pages deployment

Use Cloudflare Pages, not Workers/Wrangler:

- Project type: Pages / Static
- Repository: `SteadyEddieSC/gringotts-budget-vault`
- Production branch: `main`
- Build command: leave blank
- Output directory: `/`

## Security reports

Do not open a public issue containing credentials, account data, transaction exports, generated quality artifacts, or other sensitive information. Follow [`SECURITY.md`](SECURITY.md) for private reporting guidance.

## Project status

The application is an unofficial fan-themed personal project and is not affiliated with or endorsed by Warner Bros., the Wizarding World, or any financial institution.
