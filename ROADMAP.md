# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v129 adds explicit household workflow evidence without telemetry while preserving the feature freeze established in v126. Entries after v129 remain directional and may move when protected testing or recorded household review shows a better order.

## Current release

### v129 — Household Workflow Evidence Review

**Purpose**

Record privacy-safe, structured household observations about the existing Gringotts workflows before approving new product scope or removing a surface.

**Delivered**

- strict TypeScript contracts for workflow inventory, observations, summaries, and sanitized bundles;
- ten bounded workflows across Dashboard, Money, Calendar, Reports, Activity, and Tools;
- a session-only Workflow Review tab under Tools;
- explicit usage, friction, outcome, signal, and disposition choices;
- optional workflow-only notes with private-detail rejection;
- local JSON download and clipboard summary after explicit action;
- high-friction, consolidation, unmet-need, and keep-candidate summaries;
- browser and Node proof of no vault reading, persistence, telemetry, or remote transmission;
- consolidated v106/v107 styles so the v129 bootstrap does not increase the startup request ceiling.

**Safety**

- no automatic event logging, route-history collection, performance beacon, browser fingerprinting, analytics endpoint, or background observation;
- no transaction, account, balance, merchant, report, provider-token, or portable-vault payload reading;
- no localStorage, sessionStorage, IndexedDB, cookie, service worker, or new persistent store;
- no automatic workflow deletion, consolidation, or feature approval;
- v126 remains the only live route coordinator and action dispatcher;
- no new primary destination, finance feature, workbook sheet, remote endpoint, or second runtime;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, and the 43-sheet workbook cap remain unchanged.

## Reliability horizon

### v127 — UX Polish & Simplification — Shipped

Standardized action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — TypeScript & Portable Vault Foundation — Shipped

Established strict domain contracts and a provider-neutral, integrity-checked `.gringotts` package core while keeping the deployed app static and local-first. Encryption, end-user file controls, and cloud adapters remain outside that release.

### v129 — Household Workflow Evidence Review — Current

Adds a manual session-only evidence worksheet and sanitized local export so future simplification and maintenance choices can be grounded in explicit household observations without telemetry.

### v130 — Performance & Maintenance Hardening — Directional

Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets. Use the v129 review to identify high-friction and high-maintenance paths before consolidating historical layers. Do not create a second runtime or exceed the 43-sheet cap.

### v131 — Observed Needs Decision Gate — Directional

Decide whether any new household-finance capability is justified. Feature freeze remains the default. Any proposed store or feature requires explicit safety, privacy, cap, migration, recovery, and maintenance contracts plus evidence from the household workflow review.

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

Complete the v129 Workflow Review across all ten workflows using real household observations. Use the exported structured review to select the highest-friction route or the clearest maintenance burden for v130. Do not treat an incomplete review as evidence to remove a workflow.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.
