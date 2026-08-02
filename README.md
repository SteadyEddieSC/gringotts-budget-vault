# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Household financial data remains inside the browser unless the user explicitly downloads a local backup or report.

Current release: **v126 — Runtime Consolidation & Reliability**

## Live application

https://gringotts-budget-vault.pages.dev/

## v126 reliability release

v126 freezes feature growth and consolidates the runtime lifecycle behind the existing six primary destinations.

The release provides:

- one authoritative route-enhancement coordinator;
- one owned `MutationObserver` for rendered-route stabilization;
- one priority-ordered capture dispatcher for specialist actions and current-release downloads;
- deterministic route states: rendering, enhancing, ready, or failed;
- bounded enhancement passes and route-readiness budgets;
- a consolidated release registry for inherited v118–v125 capabilities;
- an inventory of 18 browser-local storage domains and their recovery boundaries;
- non-destructive retry and stable v105 rescue paths.

Historical release modules still provide their tested household capabilities. Their overlapping observers and global action listeners are suppressed or adapted so v126 owns the live lifecycle.

## Preserved household capabilities

v126 does not add a household-finance feature. It preserves the v125 product surface, including:

- immutable close-history trend explainability;
- scenario comparison;
- recurring-cost decisions;
- account cleanup planning;
- receipt integrity and import batch lineage;
- guarded import and separate Full Vault Restore;
- Guided Plan, Reports, Family Meeting exports, diagnostics, and workbook reporting.

The Vault Workbook remains capped at **43 sheets**. No sheet was added in v126.

## Safety and recovery boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain transaction copies.
- Full Vault Restore continues to target that exact key and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- No automatic payment, transfer, borrowing, cancellation, merchant contact, account connection, plan application, or close mutation exists.
- No analytics endpoint, remote parser, service worker, or second transaction runtime is introduced.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The feature freeze remains active. The roadmap now prioritizes:

1. **v127 — UX Polish & Simplification**;
2. **v128 — Data Portability & Recovery**;
3. workflow evidence and performance/maintenance hardening;
4. an explicit observed-needs decision gate before additional finance scope.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, and `RELEASE_NOTES_v126_RUNTIME_CONSOLIDATION_RELIABILITY.md`.
