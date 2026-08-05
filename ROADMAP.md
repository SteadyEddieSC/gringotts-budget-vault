# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, privacy, portability, and maintenance over feature count. v131 remains the explicit observed-needs gate for product scope. v132 simplified release identity and test ownership. v133 now exercises long-lived synthetic local data without authorizing migration, cleanup, rollback, or repair of real household data.

## Current release

### v133 — Local Data Longevity Drills

**Purpose**

Exercise upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios against deterministic synthetic long-lived data while preserving the authoritative browser-local vault and requiring explicit human review for any real corrective action.

**Delivered**

- strict TypeScript and JavaScript longevity-drill contracts;
- exactly six explicit scenarios: supported upgrade rehearsal, corrupted portable package, rollback verification, orphan metadata detection, unsupported schema, and bounded capacity;
- deterministic synthetic vault generation with no committed real household data;
- privacy-safe reports that record disposition, evidence, safeguards, and required human action;
- closed-default `manual-review` results for unsupported schemas, orphan metadata, and capacity-bound exceedance;
- exact rollback comparison against an explicit synthetic backup without mutating the backup or discarding the failed candidate;
- a lazy `window.GringottsV133.runSyntheticDrill(...)` hook used only after explicit test invocation;
- unchanged startup, browser, accessibility, privacy, security, supply-chain, deployment, observer, destination, and workbook gates.

**Safety**

- the drill engine never reads or writes `gringottsBudgetVault.latest`;
- no automatic migration, repair, cleanup, compaction, rollback, overwrite, reset, or authoritative-vault replacement;
- no localStorage, sessionStorage, IndexedDB, cookie, service worker, telemetry, analytics, remote endpoint, cloud adapter, backend, financial schema, report sheet, automatic export, or financial action;
- drill limits bound synthetic test inputs only and do not declare a production data limit or authorize deletion;
- v129 Workflow Review, v130 runtime evidence, v131 Decision Gate, and v132 release-manifest infrastructure remain behaviorally unchanged and lazy where previously lazy;
- stable v105 rescue, guarded import, separate Full Vault Restore, empty-vault protection, backup-first broad writes, immutable close history, six primary destinations, one v126-owned observer, six Tools sections, and the 43-sheet workbook cap remain unchanged.

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

### v133 — Local Data Longevity Drills — Current

Exercises synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios while prohibiting automatic destructive cleanup or real-data mutation.

### v134 — Reporting & Export Contract Consolidation — Directional

Reduce duplicated report assembly, labels, filenames, and export ownership while preserving every tested output, aggregate-only privacy boundary, cancellation behavior, and the 43-sheet workbook cap.

### v135 — Cross-Device & Low-Resource Resilience — Directional

Verify complete workflows on small screens, slower CPUs, reduced-memory devices, touch, keyboard-only input, reduced-motion settings, and large synthetic vaults without a device-specific fork or persistent cache.

### v136 — Architecture Baseline & Next-Horizon Decision — Directional

Document the maintained architecture, ownership map, retirement candidates, privacy boundaries, maintenance cost, and protected release history; then decide whether to consolidate further, hold steady, introduce encrypted local file workflows, or approve one narrowly evidenced capability.

## Recommended next action

Continue using **Tools → Workflow Review** and **Tools → Decision Gate** for real household evidence. Use the v133 drill engine only with synthetic inputs. A drill result never authorizes a real migration, repair, cleanup, rollback, overwrite, or reset. Any such action requires a separately scoped design, threat review, explicit backup and comparison workflow, and full protected validation.

## Future portability sequence

The following sequence is intentionally not assigned to automatic release numbers. Each step requires a separate scope and threat review:

1. encrypted `.gringotts` package and passphrase/recovery UX;
2. local Open, Save As, Backup, Restore, comparison, and verification workflows;
3. direct optional Google Drive and OneDrive adapters using least privilege;
4. Dropbox after demonstrated demand;
5. Apple Files/iCloud through the universal file workflow;
6. advanced Nextcloud/WebDAV or other adapters only when evidence supports their maintenance cost.

No future adapter may proxy vault bytes or OAuth tokens through Cloudflare, silently synchronize, or replace the current vault without explicit comparison, backup, and confirmation.
