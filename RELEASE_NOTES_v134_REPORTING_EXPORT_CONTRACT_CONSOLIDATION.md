# v134 — Reporting & Export Contract Consolidation

## Summary

v134 is a maintenance-only release that centralizes retained local-export metadata, deterministic filename construction, privacy modes, workbook ownership, and the duplicated browser download executor used by the already-lazy Workflow Review and Decision Gate surfaces. It does not redesign reports, change payload schemas, add an export destination, add a workbook sheet, or expand data authority.

## Retained-output catalog

The authoritative v134 catalog contains exactly sixteen active user-facing local outputs:

1. Vault Workbook;
2. Family Meeting Pack;
3. Guided Household Plan;
4. Full Vault Backup;
5. Rules Review;
6. Household Calendar;
7. Local Diagnostics;
8. Import Profile Bundle;
9. Import Dry-Run Diagnostic;
10. Import Receipt Audit;
11. Import Receipt Timeline;
12. Selected Import Batch Audit;
13. Account Cleanup Plan;
14. Aggregate Close Trend;
15. Workflow Review;
16. Decision Record.

Each contract declares a stable ID, label, owning release/module, format, extension, MIME type, privacy mode, startup-path status, filename policy, success label, failure behavior, cancellation behavior, and no-retry behavior.

The catalog documents existing exports. It does not automatically create, schedule, retry, upload, persist, or substitute any output.

## Workbook ownership

v134 records one exact workbook ownership map:

- v103–v114 base guided workbook: 32 sheets;
- v115 Import Receipts: 1 sheet;
- v121 Receipt Integrity and Batch Lineage: 2 sheets;
- v122 Account Inventory and Account Cleanup Plan: 2 sheets;
- v123 Recurring Decisions and Recurring Decision History: 2 sheets;
- v124 Scenario Comparisons and Scenario Assumptions: 2 sheets;
- v125 Close Trends and Close Drivers: 2 sheets.

The total remains exactly **43 sheets**. v134 adds no sheet and changes no sheet builder.

## Shared local-download executor

`src/v134/local-export.js` and its strict TypeScript counterpart provide one injected browser executor for explicit local downloads. The executor:

- validates the selected export contract and its privacy mode;
- builds the established deterministic filename;
- returns `cancelled` before dispatch when the request is already aborted;
- creates one Blob and one object URL;
- dispatches one anchor download;
- returns `dispatched` only after `click()` is invoked;
- removes the anchor and revokes the object URL;
- throws on failure without retry, partial output, fallback format, or silent substitution.

The executor contains no browser-storage API, network API, observer, service worker, telemetry, analytics, cloud adapter, backend, or automatic retry.

## Migrated lazy surfaces

Only two already-lazy JSON surfaces now use the shared executor:

- v129 Workflow Review;
- v131 Decision Gate.

Their record builders, kinds, versions, releases, privacy declarations, validation, controls, visible messages, and public filename helper functions remain compatible. Success is announced only after the executor reports `dispatched`.

The public `workflowReviewFilename(...)` and `decisionRecordFilename(...)` helpers remain available and now delegate to the v134 filename catalog.

## Preserved legacy outputs

The following established implementations remain unchanged at runtime:

- the v115-era Vault Workbook, meeting pack, guided plan, full backup, rules, calendar, and diagnostics controller;
- import-profile portability and versioning exports;
- receipt audit, receipt timeline, and selected-batch exports;
- the sanitized account-cleanup package;
- the aggregate close-trend export.

v134 tests and catalogs these outputs without adding a startup import or changing their payload schemas.

## Privacy contracts

The catalog distinguishes full-vault, transaction-detail, household-summary, configuration-only, metadata-only, aggregate-only, workflow-only, and diagnostics-only outputs.

The new validator rejects forbidden object keys for constrained privacy modes, including transaction rows, raw source filenames, source fingerprints, vault contents, credentials, tokens, raw account identifiers, raw account labels, merchants, balances, amounts, cards, email addresses, and contacts where the selected contract forbids them.

This validator supplements—not replaces—the existing release-specific sanitizers and payload builders.

## Runtime loading

The production shells continue loading only `src/release-manifest.js`. The v134 catalog and executor are absent from normal startup. They load only when an already-lazy Workflow Review or Decision Gate module requests them.

`window.GringottsV134` publishes only a compact status snapshot with:

- current release identity;
- lazy catalog and executor load status;
- retained-output count of 16;
- workbook count of 43;
- no automatic export;
- no persistent store, network implementation, or observer.

The full catalog is not duplicated into the startup registry.

v133 synthetic longevity drills remain available through the retained lazy compatibility hook. v126 remains the sole route coordinator, action dispatcher, and live `MutationObserver` owner.

## Preserved data and recovery boundaries

v134 preserves:

- `gringottsBudgetVault.latest` as the only authoritative transaction-copy domain;
- guarded import and separate Full Vault Restore;
- empty-vault protection;
- backup-first broad transaction writes with read-back verification and rollback capability;
- immutable month-close history;
- stable `rescue-v105.html`;
- six primary destinations;
- six Tools sections;
- one v126-owned observer;
- the 43-sheet workbook cap.

## Protected limits

The following limits remain unchanged:

- route ready: 750 ms;
- enhancement: 300 ms;
- enhancement passes: 3;
- observer callbacks per route: 12;
- registered actions: 40;
- startup requests: 45;
- startup script bytes: 500,000;
- runtime observers: 1;
- primary destinations: 6;
- workbook sheets: 43.

## Validation requirement

Promotion requires the exact final head to pass:

- strict TypeScript and JavaScript syntax;
- release consistency before browser installation;
- deterministic catalog, filename, MIME, privacy, ownership, dispatch, cancellation, cleanup, and failure contracts;
- real Workflow Review and Decision Gate browser downloads with established payload kinds;
- proof that v134 modules are absent from startup and loaded only on demand;
- proof of no browser-storage, network, observer, service-worker, automatic-retry, or automatic-export implementation;
- unchanged legacy workbook, backup, restore, import, close-history, and report compatibility;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- repeated-route settlement;
- keyboard, visual, axe, and unchanged Lighthouse budgets;
- public-repository security and full-history privacy checks;
- supply-chain and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Next direction

v135 remains **Cross-Device & Low-Resource Resilience**. It should verify complete workflows on constrained devices and input modes without creating a device-specific fork, persistent cache, weaker safety messaging, or expanded product scope.
