# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v128 begins the typed architecture transition while preserving the feature freeze established in v126. Entries after v128 are directional and may move when protected testing or real household use shows a better order.

## Current release

### v128 — TypeScript & Portable Vault Foundation

**Purpose**

Introduce strict data contracts and a provider-neutral portable-vault package core without rewriting the static application or sending financial data to Cloudflare or another service.

**Delivered**

- strict TypeScript contracts and required no-emit CI typechecking;
- typed authoritative-vault, transaction, manifest, integrity, receipt, and future-adapter interfaces;
- deterministic JSON canonicalization;
- SHA-256 integrity verification;
- populated-vault creation, serialization, parsing, and validation;
- empty-vault, schema, format, authority, count, malformed-data, and tamper rejection;
- browser and Node proof of no package-core network or browser-storage activity;
- a consolidated v128 bootstrap that retains v127 UX behavior without increasing the request budget.

**Safety**

- Cloudflare serves static assets only;
- no package encryption or cloud upload is represented as complete;
- no Google Drive, OneDrive, Dropbox, iCloud, WebDAV, or other adapter is enabled;
- no automatic sync, restore, migration, merge, or newest-copy-wins behavior;
- v126 remains the only live route coordinator and action dispatcher;
- no new primary destination, finance feature, browser-local store, workbook sheet, remote endpoint, service worker, or second runtime;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, and the 43-sheet workbook cap remain unchanged.

## Reliability horizon

### v127 — UX Polish & Simplification — Shipped

Standardized action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — TypeScript & Portable Vault Foundation — Current

Establish strict domain contracts and a provider-neutral, integrity-checked `.gringotts` package core. Keep the deployed app static and local-first. Encryption, end-user file controls, and cloud adapters remain outside this release.

### v129 — Household Workflow Evidence Review — Directional

Review real workflow friction, abandoned specialist surfaces, repeated failures, confusing states, and unmet needs using privacy-safe evidence. Identify controls and surfaces that should be simplified, consolidated, demoted, or removed. Do not approve features from roadmap momentum alone.

### v130 — Performance & Maintenance Hardening — Directional

Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets. Reduce historical maintenance cost and begin replacing release-layer accumulation with stable typed modules without creating a second runtime or exceeding the 43-sheet cap.

### v131 — Observed Needs Decision Gate — Directional

Decide whether any new household-finance capability is justified. Feature freeze remains the default. Any proposed store or feature requires explicit safety, privacy, cap, migration, recovery, and maintenance contracts.

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

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.
