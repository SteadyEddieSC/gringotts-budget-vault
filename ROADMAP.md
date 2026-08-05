# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v131 turns the feature freeze into an explicit evidence gate so roadmap momentum cannot authorize a new capability, removal, or consolidation. Entries after v131 remain directional and may move when protected testing or completed household review shows a better order.

## Current release

### v131 — Observed Needs Decision Gate

**Purpose**

Require complete household workflow evidence and healthy runtime evidence before even writing a future product-scope proposal.

**Delivered**

- a session-only **Tools → Decision Gate** secondary workspace while retaining exactly six primary destinations;
- explicit local import of a v129 Household Workflow Review JSON bundle;
- strict validation of review kind, version, inventory version, privacy declarations, known unique workflow IDs, and recomputed summary consistency;
- current maintenance evidence read only through the published `window.GringottsV130.snapshot()` contract;
- closed-by-default states for incomplete evidence and runtime blockers;
- explicit human dispositions for holding the feature freeze, scoping maintenance-only work, or permitting one narrowly evidenced proposal for later review;
- no automatic approval or implementation of a capability, removal, consolidation, migration, or financial action;
- privacy-filtered workflow-only rationale with rejection of likely amounts, account, card, transaction, merchant, balance, or contact details;
- explicit local decision-record download and clipboard summary with no raw workflow observations or financial data;
- startup-light loading: v131 integration loads after Tools opens and the Decision Gate UI/model loads only after the Decision Gate is selected.

**Safety**

- imported review evidence and decisions remain only in module memory and are cleared by reload;
- the gate does not inspect the authoritative vault, transactions, accounts, balances, merchants, reports, credentials, or prior route history;
- no localStorage, sessionStorage, IndexedDB, cookie, service worker, telemetry, analytics, beacon, cloud adapter, remote endpoint, or persistent store is added;
- no new financial schema, report, export sheet, primary destination, second runtime, or additional `MutationObserver` is added;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, backup-first broad writes, six primary destinations, one v126-owned observer, and the 43-sheet workbook cap remain unchanged.

## Reliability horizon

### v127 — UX Polish & Simplification — Shipped

Standardized action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — TypeScript & Portable Vault Foundation — Shipped

Established strict domain contracts and a provider-neutral, integrity-checked `.gringotts` package core while keeping the deployed app static and local-first. Encryption, end-user file controls, and cloud adapters remain outside that release.

### v129 — Household Workflow Evidence Review — Shipped

Added a manual session-only evidence worksheet and sanitized local export so future simplification and maintenance choices can be grounded in explicit household observations without telemetry.

### v130 — Performance & Maintenance Hardening — Shipped

Moved Workflow Review under existing runtime ownership, kept specialist code outside startup, recorded bounded memory-only route evidence, and enforced route, observer, request, script, and workbook ceilings.

### v131 — Observed Needs Decision Gate — Current

Combines an explicitly imported completed workflow review with the current v130 runtime contract, keeps the feature freeze closed by default, and permits only a human-recorded hold, maintenance scope, or later proposal—not implementation approval.

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

Use **Tools → Workflow Review** during real household workflows and download the completed local review. Import that file into **Tools → Decision Gate**. Until all ten workflows are complete and current runtime evidence passes, the correct v131 result is `evidence-incomplete` or `runtime-blocked`, not a new feature. A `candidate-proposal` result permits writing one narrow proposal for later review only.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.