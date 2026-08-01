# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Household financial data remains inside the browser unless the user explicitly downloads a local backup or report.

Current release: **v125 — Close History & Trend Explainability**

## Live application

https://gringotts-budget-vault.pages.dev/

## v125 close-history explainability

Inside **Money → Close & Forecast**, v125 compares household months using two clearly separated evidence sources:

- **closed months:** immutable close snapshots retained by the existing month-close workflow;
- **open months:** currently posted rows, with pending rows excluded and lower confidence.

The review shows:

- selected and comparison periods;
- close state, close revision, and reopen-event counts;
- income, recurring-expense, variable-expense, and transfer-neutral operating-net change;
- ranked aggregate drivers;
- account and date coverage;
- high, medium, or low confidence with explicit reasons;
- warnings when current row coverage no longer matches a retained close snapshot.

Ranked drivers describe aggregate correlation between months. They are not claims that a transaction, category, decision, or outside event caused the change.

## Reporting and exports

Close-trend context appears in Guided Plan, Reports, Family Meeting Markdown, Guided Plan Markdown, diagnostics, and aggregate-only JSON.

The Vault Workbook contains **43 sheets**. v125 adds:

- **Close Trends**;
- **Close Drivers**.

The close-trend export excludes transaction rows, merchants, account labels, filenames, fingerprints, credentials, tokens, vault contents, and other household-detail fields.

## Safety boundaries

v125 does not provide or perform:

- transaction rewriting;
- silent close-history mutation;
- automatic reopen;
- automatic forecast, budget, debt, goal, scenario, or recurring-decision changes;
- transfers, payments, cancellations, borrowing, merchant contact, or institution actions.

Full Vault Restore remains separate and continues to target `gringottsBudgetVault.latest`. Empty-vault overwrite remains blocked. Stable v105 rescue remains available.

## Strategic direction

The product is now in a feature-freeze phase. The next releases prioritize:

1. **v126 — Runtime Consolidation & Reliability**;
2. **v127 — UX Polish & Simplification**;
3. **v128 — Data Portability & Recovery**;
4. observed workflow needs and maintenance evidence before any additional household-finance feature.

The current 43-sheet workbook is the cap. A later sheet addition requires consolidation or removal unless a strong documented household need justifies it.

## Privacy and architecture

- no analytics endpoint;
- no remote financial parser;
- no institution credential storage;
- no service worker;
- no real household data, bank exports, filled reports, or screenshots in source control or CI artifacts;
- one active transaction engine and one live runtime;
- broad transaction writes remain backup-first and read-back verified.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, and `RELEASE_NOTES_v125_CLOSE_HISTORY_TREND_EXPLAINABILITY.md`.
