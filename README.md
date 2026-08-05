# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v132 — Release & Test Infrastructure Simplification**

## Live application

https://gringotts-budget-vault.pages.dev/

## v132 release and test infrastructure

v132 is a maintenance-only release. It adds no household-finance capability. It reduces release drift and late stale-version failures by making one browser-compatible manifest authoritative for current release identity.

The release provides:

- `src/release-manifest.js` as the single current-release source for version, name, package version, active boot path, runtime label, asset tokens, protected budgets, destination count, and workbook cap;
- versionless HTML shell titles and loading copy, with the active boot applying the final title and visible release version;
- shared Playwright helpers for current version, title, boot resource, roadmap counts, and package expectations;
- `scripts/release-consistency.mjs`, which checks shells, package metadata, active boot ownership, runtime metadata, roadmap status, and shared test expectations before browser installation;
- exact file-and-field diagnostics when release metadata drifts;
- a repository rule that blocks new scattered literal assertions for the current release;
- unchanged Chromium, Firefox, WebKit, Android, iPad, iPhone, accessibility, Lighthouse, privacy, security, supply-chain, CodeQL, Cloudflare preview, and unresolved-thread gates.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review.
- v130 remains the bounded runtime and maintenance evidence contract.
- v131 remains the closed-by-default Observed Needs Decision Gate.
- v132 changes release identity and test ownership only; the v129, v130, and v131 specialist surfaces remain route-lazy.
- The application retains six primary destinations and the Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain authoritative transaction copies.
- v132 reads no vault, transaction, account, balance, merchant, report, credential, or portable-vault data.
- v132 adds no localStorage, sessionStorage, IndexedDB, cookies, service worker, telemetry, analytics, remote endpoint, cloud adapter, backend, migration, financial schema, report sheet, or automatic financial action.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v133 — Local Data Longevity Drills**. It should exercise synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios without destructive automatic cleanup. See `ROADMAP.md`.

## Local validation

Requirements: Node.js 24 and Python 3.

```bash
npm ci --ignore-scripts
npm run release:check
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v132_RELEASE_TEST_INFRASTRUCTURE_SIMPLIFICATION.md`, and `V132_SECURITY_REVIEW.md`.