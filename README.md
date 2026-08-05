# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v131 — Observed Needs Decision Gate**

## Live application

https://gringotts-budget-vault.pages.dev/

## v131 observed-needs decision gate

v131 makes the feature freeze explicit. A product-scope change cannot be inferred from roadmap momentum, clicks, transactions, reports, or telemetry.

The release provides:

- a session-only **Tools → Decision Gate** workspace;
- explicit local import and strict validation of a v129 Household Workflow Review bundle;
- current maintenance evidence read through the published v130 runtime snapshot;
- closed-by-default `evidence-incomplete` and `runtime-blocked` states;
- an explicit `decision-ready` state only after all ten workflow observations are complete and runtime evidence passes;
- human dispositions to hold scope, permit maintenance-only scoping, or allow one narrow proposal for later review;
- privacy-filtered rationale and sanitized local decision records;
- no automatic feature approval, removal, consolidation, migration, write, or financial action;
- startup-light loading that keeps v131 specialist code outside the Dashboard path.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review and sanitized local export.
- v130 remains the bounded runtime and maintenance evidence contract.
- The active v131 boot loads the established v128/v126 shell first; Workflow Review, Decision Gate integration, Decision Gate UI, and Diagnostics remain route-lazy.
- v131 adds no second runtime, observer, backend, service worker, analytics endpoint, or persistent store.
- The application retains six primary destinations and the Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain transaction copies.
- Decision Gate evidence comes only from a user-selected privacy-filtered workflow-review file and the published runtime snapshot.
- The gate does not inspect vault contents, balances, accounts, merchants, reports, credentials, or prior route history.
- Imported evidence, rationale, and decisions remain in module memory and are cleared by reload.
- Decision records contain aggregate workflow identifiers and the explicit disposition, not transaction rows or raw workflow observations.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v132 — Release & Test Infrastructure Simplification**. It should reduce duplicated release metadata and test ownership without weakening exact-head browser, accessibility, privacy, security, supply-chain, deployment, or recovery gates. See `ROADMAP.md`.

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

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v131_OBSERVED_NEEDS_DECISION_GATE.md`, and `V131_SECURITY_REVIEW.md`.