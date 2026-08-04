# v130 — Performance & Maintenance Hardening

## Summary

v130 hardens the existing Gringotts runtime using the failures discovered during v129 exact-head validation. It reduces active release-layer coupling, moves Workflow Review under the established v126 coordinator and dispatcher, and makes the existing performance ceilings explicit without adding household-finance functionality.

## Runtime ownership hardening

The v129 validation cycle exposed two architectural risks:

- a capture listener outside the v126 dispatcher could compete with inherited Tools-tab handlers;
- non-idempotent route-ready DOM mutations could create a coordinator feedback loop and block browser interaction.

v130 removes those conditions from the maintained path:

- Workflow Review route selection is registered as `v129-workflow-review-route` in the v126 dispatcher;
- Workflow Review field and export actions are also dispatcher-owned;
- the shared v129 integration is registered as a v126 coordinator release enhancer;
- Workflow Review rehydrates only when it is active and the inherited renderer genuinely removed it;
- roadmap and metadata updates are idempotent;
- repeated route transitions are required to settle without continued cycles, enhancement passes, or observer callbacks.

## Flattened active boot

The production shell now loads `src/boot-v130.js`.

The v130 entry imports v128 directly, installs the shared v129 Workflow Review integration, and then installs v130 performance hardening. This removes `boot-v129.js` from the active production chain while retaining it as a compatible historical entry.

No framework, bundler runtime, server, Pages Function, Worker, service worker, or second application runtime was added.

## Strict performance contracts

v130 adds strict TypeScript and JavaScript counterparts for these ceilings:

- route ready: 750 ms;
- enhancement work: 300 ms;
- enhancement passes: 3;
- observer callbacks per route: 12;
- registered release enhancers: 12;
- registered dispatcher actions: 40;
- startup requests: 45;
- startup script bytes: 500,000;
- workbook sheets: 43;
- live runtime observers: 1;
- primary destinations: 6;
- in-session runtime samples: 12.

The pure evaluator returns every failed contract and rejects negative or non-finite measurements.

Lighthouse remains authoritative for request and script-byte enforcement. The browser Diagnostics surface presents session evidence but does not replace protected Lighthouse validation.

## Session-only Diagnostics

**Tools → Diagnostics** now includes a Performance & Maintenance card showing route-ready time, enhancement time, passes, observer callbacks, observer ownership, dispatcher registrations, bounded sample count, and the workbook cap.

The history:

- exists only in module memory;
- is capped at 12 route-ready samples;
- is cleared by reload;
- contains route lifecycle measurements and contract results only;
- reads no vault, transaction, account, balance, merchant, report, credential, or portable-vault data;
- is not exported or transmitted automatically.

## Preserved boundaries

v130 adds no:

- budgeting, planning, forecasting, import, recurring-cost, scenario, close-history, calendar, reporting, spreadsheet, or cloud capability;
- persistent store or migration;
- remote logging, telemetry, analytics, beacon, or provider adapter;
- primary destination or workbook sheet;
- automatic financial action;
- additional observer or service worker.

The authoritative vault, guarded import, separate Full Vault Restore, empty-vault block, backup-first broad writes, immutable close history, v105 rescue, six primary destinations, and 43-sheet workbook cap remain unchanged.

## Validation requirement

Promotion requires the exact final head to pass strict TypeScript, browser-free budget and privacy contracts, Chromium/Firefox/WebKit desktop, Android Chromium, iPad/iPhone WebKit, repeated-route settlement, keyboard, visual, axe, Lighthouse, public-repository security, supply-chain, CodeQL, exact-head Cloudflare preview, and unresolved-thread verification.

## Next direction

v131 remains **Observed Needs Decision Gate**. The feature freeze remains the default. A new capability or workflow removal should require completed household Workflow Review evidence plus v130 maintenance and runtime evidence.
