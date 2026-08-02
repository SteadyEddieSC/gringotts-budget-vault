# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Household financial data remains inside the browser unless the user explicitly downloads a local backup or report.

Current release: **v127 — UX Polish & Simplification**

## Live application

https://gringotts-budget-vault.pages.dev/

## v127 simplification release

v127 keeps the v126 runtime consolidation and feature freeze while making the existing six primary destinations calmer and easier to operate.

The release provides:

- one shared action-intent policy for primary, preview, export, recovery, destructive, cancel, and secondary controls;
- clearer visual hierarchy without changing the underlying financial action;
- one polite status region for route, export, recovery, and destructive-action feedback;
- route-heading focus after deliberate primary navigation;
- focus restoration for supported dialogs;
- labeled, keyboard-reachable table regions that retain native table semantics;
- progressive-disclosure styling for details and diagnostics;
- responsive touch targets, dialogs, action rows, roadmap cards, and reduced-motion behavior;
- an official ten-release reliability roadmap through v136.

v126 remains the only live route coordinator and continues to own the single enhancement `MutationObserver` and specialist action dispatcher.

## Preserved household capabilities

v127 adds no household-finance feature. It preserves:

- immutable close-history trend explainability;
- scenario comparison;
- recurring-cost decisions;
- account cleanup planning;
- receipt integrity and import batch lineage;
- guarded import and separate Full Vault Restore;
- Guided Plan, Reports, Family Meeting exports, diagnostics, and workbook reporting.

The Vault Workbook remains capped at **43 sheets**.

## Safety and recovery boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain transaction copies.
- Full Vault Restore continues to target that exact key and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- v127 introduces no storage writes, automatic financial actions, analytics endpoint, remote parser, service worker, or second runtime.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The feature freeze remains active. The next committed release is **v128 — Data Portability & Recovery**. Releases v129–v136 are directional reliability, evidence, maintenance, data-longevity, export-consolidation, cross-device, and architecture decision gates. See `ROADMAP.md`.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, and `RELEASE_NOTES_v127_UX_POLISH_SIMPLIFICATION.md`.
