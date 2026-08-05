# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v131 remains the explicit observed-needs gate for product scope. v132 simplifies the release and test infrastructure around that gate so version drift and duplicated assertions fail early without weakening validation.

## Current release

### v132 — Release & Test Infrastructure Simplification

**Purpose**

Make the current release identity authoritative in one browser-compatible manifest and detect metadata drift before browser installation or promotion.

**Delivered**

- one authoritative `src/release-manifest.js` for current version, release name, package version, boot path, runtime label, asset tokens, protected budgets, destination count, and workbook cap;
- versionless HTML shell titles and loading copy, with the active boot applying the final title and visible release version;
- shared Playwright release helpers for current version, title, boot resource, roadmap status counts, and package expectations;
- an exact release-consistency diagnostic covering both shells, package and lockfile metadata, active boot ownership, runtime metadata, roadmap documentation, and shared test expectations;
- a parser-stage consistency gate that reports the precise file and mismatched field before browser installation;
- a repository rule that blocks scattered literal current-release assertions in protected tests;
- retained historical release modules and release-specific compatibility tests;
- unchanged cross-browser, accessibility, Lighthouse, privacy, security, supply-chain, CodeQL, Cloudflare preview, and unresolved-thread promotion requirements.

**Safety**

- no household-finance capability, financial schema, report sheet, migration, persistent store, telemetry, analytics, network endpoint, cloud adapter, service worker, backend, automatic export, or financial action is added;
- v129 Workflow Review, v130 runtime evidence, and v131 Decision Gate remain lazy and behaviorally unchanged;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, backup-first broad writes, six primary destinations, one v126-owned observer, and the 43-sheet workbook cap remain unchanged;
- no protected performance or maintenance ceiling is relaxed.

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

### v132 — Release & Test Infrastructure Simplification — Current

Centralizes current-release identity and test expectations, detects release drift before browser installation, and improves failure diagnostics while preserving every exact-head promotion gate.

### v133 — Local Data Longevity Drills — Directional

Exercise synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios. Preserve the authoritative vault and prohibit automatic destructive cleanup.

### v134 — Reporting & Export Contract Consolidation — Directional

Reduce duplicated report assembly, labels, filenames, and export ownership while preserving every tested output, aggregate-only privacy boundary, cancellation behavior, and the 43-sheet workbook cap.

### v135 — Cross-Device & Low-Resource Resilience — Directional

Verify complete workflows on small screens, slower CPUs, reduced-memory devices, touch, keyboard-only input, reduced-motion settings, and large synthetic vaults without a device-specific fork or persistent cache.

### v136 — Architecture Baseline & Next-Horizon Decision — Directional

Document the maintained architecture, ownership map, retirement candidates, privacy boundaries, maintenance cost, and protected release history; then decide whether to consolidate further, hold steady, introduce encrypted local file workflows, or approve one narrowly evidenced capability.

## Recommended next action

Continue using **Tools → Workflow Review** and **Tools → Decision Gate** for real household evidence. v132 changes how releases are identified and validated, not the scope decision. A `candidate-proposal` result still permits writing one narrow proposal for later review only.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.