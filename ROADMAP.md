# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v130 hardens the runtime ownership and performance contracts exposed by the v129 validation cycle while preserving the feature freeze established in v126. Entries after v130 remain directional and may move when protected testing or completed household review shows a better order.

## Current release

### v130 — Performance & Maintenance Hardening

**Purpose**

Reduce active release-layer coupling and prevent route-ready or event-ownership regressions without changing household-finance functionality.

**Delivered**

- strict TypeScript contracts for route-ready time, enhancement time, enhancement passes, observer callbacks, registered releases, registered actions, network requests, script bytes, workbook sheets, runtime observers, primary destinations, and bounded session samples;
- a pure performance-budget evaluator with explicit pass/fail reasons and no browser, vault, transaction, or account dependency;
- a startup-light production entry that loads the established v128/v126 shell before specialist code;
- Workflow Review integration loaded only when Tools opens, with route, field, and action handling registered through the existing v126 coordinator and dispatcher;
- the performance evaluator and Diagnostics renderer loaded only when Diagnostics opens;
- removal of standalone production Workflow Review click and route-ready ownership;
- `boot-v129.js` retained as a compatibility entry but removed from the active v130 startup chain;
- bounded memory-only route evidence and browser coverage proving repeated Workflow Review, Roadmap, Diagnostics, and primary-route transitions settle without a mutation feedback loop;
- unchanged Lighthouse ceilings of 45 requests and 500,000 script bytes;
- unchanged six primary destinations and 43-sheet workbook cap.

**Safety**

- no transaction, account, balance, merchant, report, provider-token, or portable-vault payload reading for performance evidence;
- no localStorage, sessionStorage, IndexedDB, cookie, service worker, remote logging, analytics, beacon, or new persistent store;
- no second runtime or additional `MutationObserver`;
- no new primary destination, finance feature, report, export, workbook sheet, provider adapter, or remote endpoint;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, and backup-first broad writes remain unchanged.

## Reliability horizon

### v127 — UX Polish & Simplification — Shipped

Standardized action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — TypeScript & Portable Vault Foundation — Shipped

Established strict domain contracts and a provider-neutral, integrity-checked `.gringotts` package core while keeping the deployed app static and local-first. Encryption, end-user file controls, and cloud adapters remain outside that release.

### v129 — Household Workflow Evidence Review — Shipped

Added a manual session-only evidence worksheet and sanitized local export so future simplification and maintenance choices can be grounded in explicit household observations without telemetry.

### v130 — Performance & Maintenance Hardening — Current

Moves Workflow Review under existing runtime ownership, keeps specialist code outside startup, records bounded memory-only route evidence, and enforces the existing route, observer, request, script, and workbook ceilings.

### v131 — Observed Needs Decision Gate — Directional

Decide whether any new household-finance capability is justified. Feature freeze remains the default. Any proposed store or feature requires explicit safety, privacy, cap, migration, recovery, and maintenance contracts plus completed household evidence.

### v132 — Release & Test Infrastructure Simplification — Directional

Centralize release metadata and version assertions, reduce duplicate fixtures and test ownership, improve failure diagnostics, and preserve every exact-head browser, accessibility, security, supply-chain, and deployment gate.

### v133 — Local Data Longevity Drills — Directional

Exercise synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios. Preserve the authoritative vault and prohibit automatic destructive cleanup.

### v134 — Reporting & Export Contract Consolidation — Directional

Reduce duplicated report assembly, labels, filenames, and export ownership while preserving every tested output, aggregate-only privacy boundary, cancellation behavior, and the 43-sheet workbook cap.

### v135 — Cross-Device & Low-Resource Resilience — Directional

Verify complete workflows on small screens, slower CPUs, reduced-memory devices, touch, keyboard-only input, reduced-motion settings, and large synthetic vaults without a device-specific fork or persistent cache.

### v136 — Architecture Baseline & Next-Horizon Decision — Directional

Document the maintained architecture, ownership map, retirement candidates, privacy boundaries, maintenance cost, and protected release history; then decide whether to consolidate further, hold steady, introduce encrypted local file workflows, or approve one narrowly evidenced capability.

## Recommended next action

Complete the v129 Workflow Review across all ten workflows using real household observations. Use the structured review together with v130 runtime evidence to decide v131. The feature freeze remains the default; an incomplete review is not evidence to add or remove a workflow.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.
