# Gringotts Budget Vault

[![Playwright Regression](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/playwright.yml)
[![Accessibility & Quality](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/quality.yml)
[![Public Repository Security](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/security.yml)
[![Supply Chain](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/supply-chain.yml)
[![CodeQL](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml/badge.svg)](https://github.com/SteadyEddieSC/gringotts-budget-vault/actions/workflows/codeql.yml)

A public, local-first household budgeting application deployed as a static Cloudflare Pages site. Cloudflare serves application assets only. Household financial data remains on the current device unless the user explicitly creates a local export or backup.

Current release: **v135 — Cross-Device & Low-Resource Resilience**

## Live application

https://gringotts-budget-vault.pages.dev/

## v135 resilience baseline

v135 is a maintenance-and-validation release. It proves representative household workflows across supported desktop, phone, and tablet profiles without adding household-finance functionality or a device-specific product mode.

The release provides:

- six governed validation profiles covering Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard-only completion evidence across the three desktop engines;
- touch completion evidence across Android, iPad, and iPhone projects;
- reduced-motion checks across all six supported projects;
- responsive-overflow and minimum 44-pixel target checks;
- a deterministic fictional 1,200-transaction large-vault generator with a hard 2,000-transaction test cap;
- large-vault Activity, Reports, Tools, and guarded Full Vault Restore evidence;
- explicit pass/fail contracts for timing, focus, safety messaging, storage, network, observers, duplicate dispatch, persistent caches, and device forks;
- exact inheritance of the v130 750 ms route-ready and 300 ms enhancement ceilings;
- bounded v126 route-replay hardening: one normal attempt and at most one recovery attempt before the existing fail-closed recovery shell.

## Preserved architecture

- v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.
- v127 remains the retained interaction, focus, responsive, touch-target, and reduced-motion policy.
- v128 remains the strict typed portable-vault foundation.
- v129 remains the manual, session-only Workflow Review.
- v130 remains the authoritative bounded runtime and maintenance evidence contract.
- v131 remains the closed-by-default Observed Needs Decision Gate.
- v132 remains the authoritative manifest and release-consistency infrastructure.
- v133 remains the lazy synthetic-only longevity-drill capability.
- v134 remains the lazy retained export-contract and local-download capability.
- v135 resilience contracts stay outside normal startup and are loaded only by protected tests.
- The application retains six primary destinations, six Tools sections, and a **43-sheet** Vault Workbook cap.

## Privacy and safety boundaries

- `gringottsBudgetVault.latest` remains the only domain that may contain authoritative transaction copies.
- The v135 contract module has no browser-storage, network, service-worker, cache, telemetry, analytics, or device-detection implementation.
- Test profiles are validation declarations, not production branches.
- No alternate phone, tablet, reduced-motion, or low-resource application mode is introduced.
- Full Vault Restore remains separate and blocks empty transaction arrays.
- Broad transaction writes remain backup-first, rollback-capable, and read-back verified.
- Immutable month-close snapshots are not recomputed or silently rewritten.
- Workflow Review and Decision Gate remain manual, local, privacy-filtered, and non-authorizing.
- v134 export privacy modes, cancellation, cleanup, and no-retry behavior remain unchanged.
- Stable `rescue-v105.html` remains available if the current shell cannot initialize.
- Startup remains capped at **45 requests** and **500,000 script bytes**; no budget waiver is permitted.
- Legitimate v130 runtime failure remains blocking evidence on every device profile.

## Strategic direction

The next directional release is **v136 — Architecture Baseline & Next-Horizon Decision**. It should document the maintained architecture and explicitly decide whether to consolidate further, hold steady, or approve one narrowly evidenced capability. v135 does not authorize new product scope. See `ROADMAP.md`.

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

See `TESTING.md`, `QUALITY_GATES.md`, `UI_GOVERNANCE.md`, `BANK_IMPORT_ROADMAP.md`, `RELEASE_NOTES_v135_CROSS_DEVICE_LOW_RESOURCE_RESILIENCE.md`, `V135_SECURITY_REVIEW.md`, and `V135_IMPLEMENTATION_SCOPE.md`.
