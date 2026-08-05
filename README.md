# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v133 — Local Data Longevity Drills**

## Live application

https://gringotts-budget-vault.pages.dev/

## v133 local data longevity drills

v133 is a maintenance-only release. It adds a pure synthetic drill layer for upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios. The drills do not inspect or change the real browser-local vault.

The release provides:

- strict TypeScript and JavaScript longevity contracts;
- deterministic synthetic long-lived vault generation;
- exactly six explicit drill scenarios;
- privacy-safe reports with disposition, evidence, safeguards, and required human action;
- closed-default manual review for unsupported schemas, orphan metadata, and exceeded drill bounds;
- rollback verification against an explicit synthetic backup while preserving both backup and failed candidate;
- a lazy `window.GringottsV133.runSyntheticDrill(...)` test hook that stays outside startup;
- unchanged Chromium, Firefox, WebKit, Android, iPad, iPhone, accessibility, Lighthouse, privacy, security, supply-chain, CodeQL, Cloudflare preview, and unresolved-thread gates.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained UX and accessibility policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review.
- v130 remains the bounded runtime and maintenance evidence contract.
- v131 remains the closed-by-default Observed Needs Decision Gate.
- v132 remains the authoritative manifest and release-consistency infrastructure.
- v133 drill code is loaded only after explicit synthetic invocation.
- The application retains six primary destinations, six Tools sections, and the Vault Workbook remains capped at **43 sheets**.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain authoritative transaction copies.
- The v133 drill engine never reads or writes that key.
- v133 adds no automatic migration, repair, cleanup, compaction, rollback, overwrite, reset, or authoritative-vault replacement.
- v133 adds no localStorage, sessionStorage, IndexedDB, cookies, service worker, telemetry, analytics, remote endpoint, cloud adapter, backend, financial schema, report sheet, automatic export, or financial action.
- Drill limits are synthetic test-harness bounds, not production deletion or reset authority.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.

## Strategic direction

The next directional release is **v134 — Reporting & Export Contract Consolidation**. It should reduce duplicated export metadata, labels, filenames, and assembly ownership while preserving all tested outputs, aggregate-only privacy boundaries, cancellation behavior, and the 43-sheet workbook cap. See `ROADMAP.md`.

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

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v133_LOCAL_DATA_LONGEVITY_DRILLS.md`, and `V133_SECURITY_REVIEW.md`.
