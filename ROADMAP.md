# Gringotts Budget Vault Roadmap

The roadmap prioritizes reliability, simplicity, recovery, and maintenance over feature count. v127 continues the feature freeze established in v126. Entries after v128 are directional and may move when protected testing or real household use shows a better order.

## Current release

### v127 — UX Polish & Simplification

**Purpose**

Reduce visible complexity and make the existing six-destination household-finance workflow easier to understand and recover across desktop, keyboard, phone, and tablet use.

**Delivered**

- one shared action-intent policy for primary, preview, export, recovery, destructive, cancel, and secondary controls;
- consistent action hierarchy without changing financial behavior;
- a single polite status region for route, export, recovery, and destructive-action feedback;
- focus movement to the rendered route heading after deliberate primary navigation;
- focus restoration for supported dialogs;
- labeled, keyboard-reachable table regions while preserving native table semantics;
- progressive-disclosure styling for existing details and diagnostic surfaces;
- responsive touch targets, dialogs, action rows, roadmap cards, and reduced-motion behavior;
- a ten-release reliability roadmap from v127 through v136.

**Safety**

- v126 remains the only live route coordinator and owns the only enhancement `MutationObserver`;
- no new primary destination, finance feature, browser-local store, workbook sheet, remote endpoint, service worker, or second runtime;
- no automatic payment, transfer, borrowing, cancellation, import, restore, close, scenario, recurring-decision, or account-cleanup action;
- no transaction or metadata writes were added;
- `gringottsBudgetVault.latest`, stable v105 rescue, guarded import and restore, immutable close history, and the 43-sheet workbook cap remain unchanged.

## Next ten releases

### v127 — UX Polish & Simplification — Current

Standardize action intent and hierarchy, feedback states, progressive disclosure, focus behavior, table regions, dialogs, mobile layout, touch targets, keyboard flow, and reduced-motion behavior without adding financial functionality.

### v128 — Data Portability & Recovery — Planned

Version every browser-local metadata domain; document caps, corruption handling, migrations, rollback, orphan handling, and privacy contracts; add one-domain recovery without clearing the authoritative vault.

### v129 — Household Workflow Evidence Review — Directional

Review real workflow friction, abandoned specialist surfaces, repeated failures, confusing states, and unmet needs using privacy-safe evidence. Do not approve features from roadmap momentum alone.

### v130 — Performance & Maintenance Hardening — Directional

Protect boot, route, enhancement, report, workbook, observer, byte, and network budgets. Reduce historical maintenance cost without creating a second runtime or exceeding the 43-sheet workbook cap.

### v131 — Observed Needs Decision Gate — Directional

Decide whether any new household-finance capability is justified. Feature freeze remains the default. Any proposed store or feature requires explicit safety, privacy, cap, migration, recovery, and maintenance contracts.

### v132 — Release & Test Infrastructure Simplification — Directional

Centralize release metadata and version assertions, reduce duplicate fixtures and test ownership, improve failure diagnostics, and preserve every exact-head browser, accessibility, security, and deployment gate.

### v133 — Local Data Longevity Drills — Directional

Exercise synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios. Preserve the authoritative vault and prohibit automatic destructive cleanup.

### v134 — Reporting & Export Contract Consolidation — Directional

Reduce duplicated report assembly, labels, filenames, and export ownership while preserving every tested output, aggregate-only privacy boundaries, cancellation behavior, and the 43-sheet workbook cap.

### v135 — Cross-Device & Low-Resource Resilience — Directional

Verify complete workflows on small screens, slower CPUs, reduced-memory devices, touch, keyboard-only input, reduced-motion settings, and large synthetic vaults without a device-specific fork or persistent cache.

### v136 — Architecture Baseline & Next-Horizon Decision — Directional

Document the maintained architecture, ownership map, retirement candidates, privacy boundaries, maintenance cost, and protected release history; then decide whether to consolidate further, hold steady, or approve one narrowly evidenced capability.
