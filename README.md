# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Household financial data is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current release: **v124 — Household Scenario Comparison**

## Live application

https://gringotts-budget-vault.pages.dev/

## v124 scenario comparison

Inside **Money → Close & Forecast**, v124 compares the current cash-forecast baseline with temporary household assumptions.

A scenario can model:

- starting-cash changes;
- monthly income changes;
- recurring-cost savings;
- flexible-spending changes;
- one dated purchase or expense;
- extra monthly debt payments;
- extra monthly goal contributions;
- 30-, 60-, or 90-day horizons.

The side-by-side comparison shows ending cash, the low point, buffer-pressure days, negative days, monthly flexibility, modeled debt direction, and aggregate goal timing.

## Planning-only safety boundary

v124 provides **no Apply Scenario action**. Preview and Save Assumptions affect only scenario metadata.

The feature cannot automatically change:

- transactions or budgets;
- forecast settings;
- debt records or payments;
- goals or contributions;
- recurring-cost decisions;
- merchant, institution, or account activity.

Debt direction models extra principal only. It does not model interest, fees, changing minimums, or full amortization. Outputs are household discussion projections, not guarantees or financial advice.

## Browser-local metadata

The v124 store is:

`gringottsScenarioComparisons.v1`

It is capped at 24 scenarios and 80 history entries. Stored values contain scenario IDs, names, assumptions, notes, and timestamps—not transaction rows, merchant names, account labels, balances, credentials, tokens, or vault contents.

Writes are read-back verified. If a write fails, the prior raw value is restored.

## Guided Plan, reports, and workbook

Saved scenarios appear in Guided Household Plan, the planning report page, Family Meeting preparation, and local Markdown downloads.

The Vault Workbook now contains **41 sheets**. v124 adds:

- **Scenario Comparisons**;
- **Scenario Assumptions**.

Receipt Integrity, Batch Lineage, Account Inventory, Account Cleanup Plan, Recurring Decisions, and Recurring Decision History remain.

## Preserved capabilities

v124 retains:

- recurring-cost decisions and follow-up;
- masked account cleanup planning;
- receipt integrity and batch lineage;
- import profiles, portability, revisions, and dry runs;
- backup-first missing-only import with rollback and read-back verification;
- separate Full Vault Restore targeting `gringottsBudgetVault.latest`;
- six primary destinations and stable v105 rescue behavior.

## Roadmap

Tools → Roadmap and [`ROADMAP.md`](ROADMAP.md) cover v124 through v130.

- v125 — Close History & Trend Explainability
- v126 — Data Portability & Long-Term Maintenance
- v127 — Family Review Cadence & Governance Packs
- v128 — Household Data Quality & Stewardship Review
- v129 — Decision Outcome Review & Forecast Calibration
- v130 — Household Resilience & Contingency Planning

v125 is the strongest next commitment. Later entries remain directional.

## Privacy and architecture

Do not commit or attach real bank exports, vault backups, planning metadata exports, screenshots containing household financial data, filled workbooks, or generated reports.

The application remains local-first:

- no transaction upload or remote parser;
- no institution credential connection;
- no analytics endpoint;
- no service worker or offline application cache;
- no empty-vault overwrite;
- one live ES-module runtime;
- broad transaction writes remain backup-first and read-back verified.

## Automated validation

The release gate covers pure model and browser tests, store rollback and noninterference, 41-sheet reporting, desktop and responsive browser matrices, keyboard and axe accessibility, visual contracts, Lighthouse budgets, full-history privacy scanning, Gitleaks, dependency review, npm audit, supply-chain checks, CodeQL, Cloudflare preview, and production smoke.

## Local testing

Requirements: Node.js 24 and Python 3.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See [`TESTING.md`](TESTING.md), [`QUALITY_GATES.md`](QUALITY_GATES.md), [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md), and [`RELEASE_NOTES_v124_HOUSEHOLD_SCENARIO_COMPARISON.md`](RELEASE_NOTES_v124_HOUSEHOLD_SCENARIO_COMPARISON.md).
