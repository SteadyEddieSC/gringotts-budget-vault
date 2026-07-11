# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Household transaction data is intended to remain inside the user's browser unless the user explicitly downloads a local backup or report.

Current release: **v123 — Recurring Cost Decisions & Subscription Review**

## Live application

https://gringotts-budget-vault.pages.dev/

## v123 recurring-cost workflow

Inside **Money → Bills, Recurring & Budgets**, v123 turns recurring-charge evidence into an owned household decision queue.

It provides:

- posted-charge grouping by normalized merchant and account;
- pending, income, transfer-like, and weak one-time exclusions;
- cadence, typical-day-gap, amount-stability, and latest-price-change evidence;
- masked account and detected owner context;
- simple cadence-based annual footprint and annualized increase estimates;
- Keep, Cancel, Renegotiate, Investigate, and Completed decisions;
- owner, target date, follow-up status, notes, and bounded decision history;
- Guided Plan, report, Family Meeting, and Markdown integration.

Gringotts does **not** cancel services, contact merchants, send emails, change payments, or connect to external accounts. Annual amounts are discussion estimates rather than guaranteed savings.

## Browser-local metadata boundary

The v123 store is:

`gringottsRecurringDecisions.v1`

It is capped at 120 decision records and 240 history entries. Stored values contain candidate IDs, decisions, status, owner, target date, notes, and timestamps—not transaction rows, merchant names, account labels, amounts, balances, credentials, or institution identifiers.

Writes are read-back verified. If a write fails, the prior raw value is restored. Decisions that no longer match current evidence remain dormant and are never silently applied to another merchant or account.

## Preserved v122 and import capabilities

v123 retains:

- masked account inventory and account cleanup planning;
- receipt integrity and import batch lineage;
- profiles, portability, revisions, and metadata-only dry runs;
- backup-first missing-only import with rollback and read-back verification;
- a separate Full Vault Restore task targeting `gringottsBudgetVault.latest`;
- six primary destinations and stable v105 rescue behavior.

## Workbook and reports

The local Vault Workbook now contains **39 sheets**.

v123 adds:

- **Recurring Decisions**;
- **Recurring Decision History**.

The existing Receipt Integrity, Batch Lineage, Account Inventory, and Account Cleanup Plan sheets remain.

Open Cancel, Renegotiate, and Investigate decisions also appear in Guided Household Plan, report previews, the Family Meeting Pack, and local Markdown downloads.

## Roadmap

The detailed horizon in Tools → Roadmap and [`ROADMAP.md`](ROADMAP.md) covers v123 through v129.

- v124 — Household Scenario Comparison
- v125 — Close History & Trend Explainability
- v126 — Data Portability & Long-Term Maintenance
- v127 — Family Review Cadence & Governance Packs
- v128 — Household Data Quality & Stewardship Review
- v129 — Decision Outcome Review & Forecast Calibration

v124 is the strongest next commitment. Later entries remain directional.

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

The release gate covers:

- pure recurring-model tests;
- pending, income, transfer, and one-time exclusions;
- cadence, amount stability, price change, annualization, and account separation;
- bounded metadata, dormant decisions, history, and rollback;
- vault byte-for-byte noninterference;
- Guided Plan, reports, Markdown, and 39-sheet workbook integration;
- Chromium, Firefox, and WebKit desktop;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates;
- privacy, Gitleaks, Dependency Review, npm audit, Supply Chain, and CodeQL;
- Cloudflare preview and production smoke.

## Local testing

Requirements: Node.js 24 and Python 3.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See [`TESTING.md`](TESTING.md), [`QUALITY_GATES.md`](QUALITY_GATES.md), [`RELEASE_PROCESS.md`](RELEASE_PROCESS.md), and [`RELEASE_NOTES_v123_RECURRING_COST_DECISIONS.md`](RELEASE_NOTES_v123_RECURRING_COST_DECISIONS.md).
