# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v131 remains the explicit observed-needs gate for product scope. v132 simplified release identity and test ownership. v133 exercises long-lived synthetic local data without authorizing mutation of real household data. v134 consolidates export contracts and the newer lazy JSON download implementation without changing report content or the legacy startup-path workbook and backup controller.

## Current release

### v134 — Reporting & Export Contract Consolidation — Current

**Purpose**

Make retained local exports easier to audit and maintain by centralizing stable metadata, filename construction, workbook ownership, privacy modes, and the duplicated local-download executor while preserving every established payload and output.

**Delivered**

- one strict TypeScript and browser-compatible catalog for sixteen retained local outputs;
- stable export IDs, labels, owners, formats, extensions, MIME types, filename policies, privacy modes, success labels, failure behavior, cancellation behavior, and no-retry declarations;
- one exact workbook ownership map totaling 43 sheets across the retained base workbook and v115/v121–v125 extensions;
- deterministic filename builders that preserve recognizable prefixes, historical release ownership, and extensions;
- aggregate-only, metadata-only, configuration-only, diagnostics-only, and workflow-only forbidden-field validation;
- one injected local browser executor with explicit `cancelled` and `dispatched` outcomes, object-URL cleanup, no automatic retry, and no silent substitution;
- migration of only the already-lazy Workflow Review and Decision Gate JSON downloads to the shared executor;
- retained public filename helpers in v129 and v131 as compatibility wrappers over the v134 catalog;
- real browser download tests that validate established v129 and v131 payload kinds and prove no browser-storage or observer change;
- unchanged legacy workbook, meeting pack, guided plan, full backup, rules, calendar, diagnostics, profile, import-audit, account-cleanup, and close-trend payload builders.

**Safety**

- no new report destination, Tools section, primary destination, workbook sheet, persistent store, service worker, telemetry, analytics, endpoint, cloud adapter, backend, financial schema, or automatic export;
- the v134 catalog and executor remain absent from normal startup and load only with an already-lazy export surface;
- no report-content redesign and no transaction, backup, restore, import, close-history, Workflow Review, or Decision Gate schema change;
- success is announced only after the local download action is dispatched;
- cancellation occurs before dispatch and creates no download or success outcome;
- failures throw without retry, partial output, or fallback substitution;
- `gringottsBudgetVault.latest` remains the sole authoritative transaction-copy domain;
- stable v105 rescue, guarded import, separate Full Vault Restore, empty-vault protection, backup-first broad writes, immutable close history, six primary destinations, one v126-owned observer, six Tools sections, the 43-sheet workbook cap, 45-request ceiling, and 500,000-script-byte ceiling remain unchanged.

## Reliability horizon

### v127 — UX Polish & Simplification — Shipped

Standardized action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — TypeScript & Portable Vault Foundation — Shipped

Established strict domain contracts and a provider-neutral, integrity-checked `.gringotts` package core while keeping the deployed app static and local-first. Encryption, end-user file controls, and cloud adapters remain outside that release.

### v129 — Household Workflow Evidence Review — Shipped

Added a manual session-only evidence worksheet and sanitized local export so future simplification and maintenance choices can be grounded in explicit household observations without telemetry.

### v130 — Performance & Maintenance Hardening — Shipped

Moved Workflow Review under existing runtime ownership, kept specialist code outside startup, recorded bounded memory-only route evidence, and enforced route, observer, request, script, and workbook ceilings.

### v131 — Observed Needs Decision Gate — Shipped

Combines an explicitly imported completed workflow review with the current v130 runtime contract, keeps the feature freeze closed by default, and permits only a human-recorded hold, maintenance scope, or later proposal—not implementation approval.

### v132 — Release & Test Infrastructure Simplification — Shipped

Centralized current-release identity and test expectations, detected release drift before browser installation, and improved failure diagnostics while preserving every exact-head promotion gate.

### v133 — Local Data Longevity Drills — Shipped

Exercises synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios while prohibiting automatic destructive cleanup or real-data mutation.

### v134 — Reporting & Export Contract Consolidation — Current

Centralizes the retained output catalog, deterministic filenames, 43-sheet ownership map, privacy validation, and the duplicated lazy JSON download executor while preserving every established report and payload.

### v135 — Cross-Device & Low-Resource Resilience — Directional

Verify complete workflows on small screens, slower CPUs, reduced-memory devices, touch, keyboard-only input, reduced-motion settings, and large synthetic vaults without a device-specific fork or persistent cache.

### v136 — Architecture Baseline & Next-Horizon Decision — Directional

Document the maintained architecture, ownership map, retirement candidates, privacy boundaries, maintenance cost, and protected release history; then decide whether to consolidate further, hold steady, introduce encrypted local file workflows, or approve one narrowly evidenced capability.

## Recommended next action

Use the existing report and export actions normally. The v134 contract layer does not add another export surface or change payload content. Continue using **Tools → Workflow Review** and **Tools → Decision Gate** for explicit household evidence and decisions. Any future report, workbook sheet, cloud adapter, encrypted package flow, or automatic action requires a separately scoped design, threat review, ownership entry, privacy contract, recovery behavior, and full protected validation.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.
