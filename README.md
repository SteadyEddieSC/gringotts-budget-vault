# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)
[![OpenSSF Scorecard](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/scorecard.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v128 — TypeScript & Portable Vault Foundation**

## Live application

https://gringotts-budget-vault.pages.dev/

## v128 architecture foundation

v128 begins a gradual TypeScript transition without rewriting the application or changing its static deployment.

The release provides:

- strict TypeScript contracts for JSON-safe data, transactions, the authoritative vault, package manifests, integrity records, backup receipts, and future storage adapters;
- exact TypeScript compiler pinning and required no-emit typechecking in protected CI;
- a provider-neutral `.gringotts` package foundation;
- deterministic sorted-key JSON canonicalization;
- SHA-256 payload integrity verification;
- rejection of empty vaults, unsupported versions, invalid authority boundaries, count mismatches, and modified payloads;
- browser and Node proof that package operations do not issue network requests or write browser storage.

The browser still receives ordinary static HTML, CSS, and JavaScript. v128 adds no framework, server, Pages Function, service worker, persistent cache, or second runtime.

## Deliberate limits

v128 does not yet provide an end-user portable-file workflow. It adds no:

- package encryption or passphrase UI;
- `.gringotts` Open, Save As, Backup, or Restore controls;
- Google Drive, OneDrive, Dropbox, iCloud, WebDAV, or other provider connector;
- OAuth token storage;
- background upload, automatic synchronization, or automatic conflict resolution.

Those capabilities require later releases after the package and recovery contracts are proven.

## Preserved household capabilities

The feature freeze remains active. v128 preserves:

- the six primary destinations;
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
- v126 remains the only route coordinator and specialist action dispatcher.
- v127 remains the retained UX and accessibility policy.
- v128 introduces no storage write, automatic financial action, analytics endpoint, remote parser, cloud adapter, or additional observer.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The product now prioritizes simplification, efficiency, typed architecture, safe portability, and evidence-based consolidation rather than new finance features. Releases v129–v136 remain directional. See `ROADMAP.md`.

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

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v128_TYPESCRIPT_PORTABLE_VAULT_FOUNDATION.md`, and `V128_SECURITY_REVIEW.md`.
