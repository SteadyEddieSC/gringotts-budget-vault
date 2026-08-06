# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v134 — Reporting & Export Contract Consolidation**

## Live application

https://gringotts-budget-vault.pages.dev/

## v134 reporting and export contracts

v134 is a maintenance-only release. It centralizes the retained local-export catalog, filename construction, privacy modes, workbook ownership, and the duplicated browser download executor used by the already-lazy Workflow Review and Decision Gate surfaces.

The release provides:

- one strict TypeScript and browser-compatible catalog for sixteen retained outputs;
- stable IDs, labels, owners, formats, extensions, MIME types, filename policies, privacy modes, success labels, failure behavior, cancellation behavior, and no-retry declarations;
- one exact workbook ownership map totaling **43 sheets**;
- deterministic filename construction that preserves recognizable prefixes and historical release ownership;
- recursive privacy validation for aggregate-only, metadata-only, configuration-only, diagnostics-only, and workflow-only outputs;
- one injected local download executor with explicit `cancelled` and `dispatched` outcomes;
- object-URL cleanup, no automatic retry, and no silent output substitution;
- migration of only the already-lazy v129 Workflow Review and v131 Decision Gate downloads;
- real browser download validation for their established JSON kinds and privacy declarations;
- unchanged legacy workbook, backup, restore, import, close-history, account-cleanup, and close-trend builders.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review.
- v130 remains the bounded runtime and maintenance evidence contract.
- v131 remains the closed-by-default Observed Needs Decision Gate.
- v132 remains the authoritative manifest and release-consistency infrastructure.
- v133 remains the lazy synthetic-only longevity-drill capability.
- v134 catalog and executor code stays outside normal startup and loads only with an already-lazy export surface.
- The application retains six primary destinations, six Tools sections, and the Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain authoritative transaction copies.
- v134 does not read that key or add a storage adapter.
- v134 adds no new report destination, workbook sheet, transaction schema, financial capability, automatic export, scheduler, retry loop, service worker, telemetry, analytics, remote endpoint, cloud adapter, backend, or persistent store.
- Workflow Review and Decision Gate payload schemas remain unchanged.
- Aggregate-only and workflow-only contracts reject forbidden household-detail fields before dispatch.
- Success is announced only after the browser download action is dispatched.
- Cancellation before dispatch creates no download and no success result.
- Failures throw without retry, fallback format, partial output, or silent substitution.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v135 — Cross-Device & Low-Resource Resilience**. It should verify complete workflows across constrained devices and input modes without a device-specific fork, persistent cache, weaker safety messaging, or expanded product scope. See `ROADMAP.md`.

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

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v134_REPORTING_EXPORT_CONTRACT_CONSOLIDATION.md`, `V134_SECURITY_REVIEW.md`, and `V134_IMPLEMENTATION_SCOPE.md`.
