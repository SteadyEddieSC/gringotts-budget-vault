# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v130 — Performance & Maintenance Hardening**

## Live application

https://gringotts-budget-vault.pages.dev/

## v130 performance and maintenance hardening

v130 reduces active release-layer coupling and makes the existing runtime budgets explicit without adding household-finance functionality.

The release provides:

- strict TypeScript contracts for route-ready, enhancement, observer, action, request, script-byte, workbook, runtime-owner, destination, and session-history budgets;
- a pure evaluator that reports every exceeded budget without reading financial data or changing browser state;
- a startup-light production entry that loads the established v128/v126 shell first;
- Workflow Review code loaded only when Tools opens, then owned by the v126 coordinator and dispatcher;
- the evaluator and Performance & Maintenance Diagnostics renderer loaded only when Diagnostics opens;
- bounded memory-only route evidence collected by the small v130 coordinator enhancer;
- repeated-route settlement tests that guard against mutation feedback loops and detached click targets;
- unchanged Lighthouse ceilings of 45 requests and 500,000 script bytes.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review and sanitized local export.
- `boot-v129.js` remains a compatibility entry but is not part of the v130 production startup chain.
- v130 adds no second runtime, observer, backend, service worker, analytics endpoint, or persistent store.
- The application retains six primary destinations and the Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain transaction copies.
- Performance history contains route lifecycle measurements and ownership status only; it does not inspect vault contents, balances, accounts, merchants, reports, credentials, or portable-vault bytes.
- Performance history exists only in memory for the current tab and is bounded to 12 samples.
- Workflow Review remains manual, session-only, and cleared by reload.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v131 — Observed Needs Decision Gate**. The feature freeze remains the default. Any proposed capability or removal should be justified by completed household Workflow Review evidence together with v130 maintenance and runtime evidence. See `ROADMAP.md`.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v130_PERFORMANCE_MAINTENANCE_HARDENING.md`, and `V130_SECURITY_REVIEW.md`.
