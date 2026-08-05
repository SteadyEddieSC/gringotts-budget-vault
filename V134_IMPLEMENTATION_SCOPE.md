# v134 Implementation Scope — Reporting & Export Contract Consolidation

## In scope

- strict TypeScript and browser-compatible export-contract models;
- an authoritative catalog for exactly sixteen retained local outputs;
- stable IDs, labels, owners, formats, extensions, MIME types, filename policies, privacy modes, startup-path status, success labels, failure behavior, cancellation behavior, and no-retry declarations;
- deterministic filename construction that preserves established prefixes, release ownership, and extensions;
- one exact workbook ownership map totaling 43 sheets;
- recursive forbidden-field validation for constrained privacy modes;
- one injected local browser download executor;
- explicit `cancelled` and `dispatched` results;
- object-URL and temporary-anchor cleanup;
- migration of v129 Workflow Review and v131 Decision Gate downloads only;
- retained compatibility wrappers for `workflowReviewFilename(...)` and `decisionRecordFilename(...)`;
- compact lazy-load status through `window.GringottsV134`;
- browser-free and real-browser download validation;
- synchronized manifest, package metadata, roadmap, test helpers, parser workflow, release consistency, repository security, release notes, security review, and maintained documentation.

## Explicitly out of scope

- new report or export destination;
- new Tools section or primary destination;
- report-content redesign;
- payload-schema change;
- transaction, backup, restore, import, close-history, planning, Workflow Review, or Decision Gate schema change;
- migration of the v115 startup-path workbook and backup controller;
- migration of v118–v125 export controllers;
- new workbook sheet;
- automatic export, scheduling, retry, background generation, or synchronization;
- localStorage, sessionStorage, IndexedDB, cookie, service worker, telemetry, analytics, endpoint, cloud adapter, backend, or new persistent store;
- encryption, passphrase, cloud-drive, or universal file-workflow implementation;
- automatic financial action or feature-scope approval.

## Retained outputs

The v134 catalog covers:

- Vault Workbook;
- Family Meeting Pack;
- Guided Household Plan;
- Full Vault Backup;
- Rules Review;
- Household Calendar;
- Local Diagnostics;
- Import Profile Bundle;
- Import Dry-Run Diagnostic;
- Import Receipt Audit;
- Import Receipt Timeline;
- Selected Import Batch Audit;
- Account Cleanup Plan;
- Aggregate Close Trend;
- Workflow Review;
- Decision Record.

## Workbook ownership

The maintained workbook remains:

- 32 base sheets owned by v103–v114;
- 1 v115 import-receipt sheet;
- 2 v121 receipt-integrity sheets;
- 2 v122 account-cleanup sheets;
- 2 v123 recurring-decision sheets;
- 2 v124 scenario sheets;
- 2 v125 close-trend sheets.

Total: **43**.

## Loading contract

- production shells load `src/release-manifest.js` only;
- `src/boot-v134.js` is a compatibility re-export only;
- neither `src/v134/export-contracts.js` nor `src/v134/local-export.js` is imported by the manifest;
- the catalog may load when a retained lazy export model is loaded;
- the executor loads only with the already-lazy Workflow Review or Decision Gate UI;
- the compact registry starts with `catalogLoaded:false` and `executorLoaded:false`;
- no full catalog or payload is copied into startup state.

## Download contract

A local export must:

1. resolve an existing contract;
2. construct the deterministic filename;
3. validate the payload against the contract privacy mode;
4. stop before dispatch when aborted;
5. verify browser download primitives are available;
6. create one Blob and one object URL;
7. append and click one temporary anchor;
8. remove the anchor;
9. revoke the URL;
10. return `dispatched` only after the click;
11. throw on failure without retry or substitution.

## Preserved safety boundaries

- `gringottsBudgetVault.latest` remains the only authoritative transaction-copy domain;
- Full Vault Restore remains separate and rejects empty transaction arrays;
- broad writes remain backup-first, read-back verified, and rollback-capable;
- close-history evidence remains immutable and aggregate-only;
- stable `rescue-v105.html` remains available;
- v126 remains sole route, dispatcher, and observer owner;
- six primary destinations and six Tools sections remain unchanged;
- startup request and script-byte ceilings remain 45 and 500,000;
- workbook sheets remain 43.

## Promotion contract

The exact final head must pass:

- strict TypeScript and JavaScript syntax;
- release consistency;
- browser-free catalog, filename, MIME, privacy, ownership, dispatch, cancellation, cleanup, and failure tests;
- established v129 and v131 payload download tests;
- legacy export compatibility checks;
- startup absence and on-demand load checks;
- browser-storage and observer non-regression checks;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- route settlement, keyboard, visual, axe, and Lighthouse;
- public-repository security, privacy history, supply chain, and CodeQL;
- exact-head preview;
- zero unresolved review threads.
