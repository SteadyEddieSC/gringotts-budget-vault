# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site.

The source code is public. Household transaction data is not part of this repository and is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current application runtime: **v108 — Goals & Vault Health**  
Current quality-infrastructure release: **v108.2 — Public Repository Hardening**

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

- transaction processing occurs in the browser;
- automated browser tests use a fictional vault in an isolated browser profile;
- no service worker or offline application cache is registered;
- the application must not automatically save an empty vault;
- broad transaction writes remain backup-first and verified after storage.

## Automated testing

Playwright regression tests cover:

- application startup and module errors;
- primary and secondary navigation;
- desktop, tablet, Android-phone, and iPhone layouts;
- month navigation and responsive overflow;
- Review Queue dropdowns and guarded editing;
- Goals and Vault Health;
- report and backup downloads;
- empty-restore blocking;
- service-worker absence and unexpected network writes.

Public-repository security automation adds:

- full-history secret scanning with Gitleaks;
- custom financial-data and forbidden-file history checks;
- CodeQL analysis for JavaScript;
- Dependabot updates for npm and GitHub Actions.

See [`TESTING.md`](TESTING.md) for local commands and release-gate details.

## Local browser testing

Requirements:

- Node.js 24;
- Python 3.

```bash
npm ci
npx playwright install chromium firefox webkit
npm run test:local
```

## Cloudflare Pages deployment

Use Cloudflare Pages, not Workers/Wrangler:

- Project type: Pages / Static
- Repository: `SteadyEddieSC/gringotts-budget-vault`
- Production branch: `main`
- Build command: leave blank
- Output directory: `/`

## Security reports

Do not open a public issue containing credentials, account data, transaction exports, or other sensitive information. Follow [`SECURITY.md`](SECURITY.md) for private reporting guidance.

## Project status

The application is an unofficial fan-themed personal project and is not affiliated with or endorsed by Warner Bros., the Wizarding World, or any financial institution.
