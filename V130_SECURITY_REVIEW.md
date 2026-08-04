# v130 Security and Privacy Review

## Release

**v130 — Performance & Maintenance Hardening**

## Threat boundary

Gringotts remains a static, local-first browser application. Cloudflare Pages serves application assets only. v130 does not add a backend, server-side function, Worker, KV, D1, R2, analytics service, remote logger, provider proxy, or service worker.

## Data reviewed by v130

The small startup layer may observe only:

- the current primary route and secondary route identifier;
- coordinator cycle and readiness state;
- route-ready and enhancement durations;
- enhancement-pass and observer-callback counts;
- registered release and dispatcher-action counts;
- startup resource-entry request count and available script transfer/decoded sizes;
- the fixed six-destination and 43-sheet release contracts;
- whether Workflow Review has loaded under v126 ownership.

It does not read:

- the authoritative vault payload;
- transaction rows or identifiers;
- account names, numbers, or balances;
- merchant names;
- budgets, goals, planning events, debts, scenarios, reports, or workbook contents;
- bank-import files, profile bundles, receipts, provider credentials, OAuth tokens, or portable-vault bytes.

## Storage and retention

- Runtime evidence is held in a module-memory array only.
- The array is capped at 12 samples.
- Reload clears the array.
- v130 adds no localStorage, sessionStorage, IndexedDB, cookie, cache, file-system, or remote store.
- No automatic export or upload exists.

## Event and observer ownership

- v126 remains the only live route coordinator.
- v126 remains the only specialist capture-action dispatcher.
- v126 remains the only live `MutationObserver` owner.
- v130 registers one coordinator enhancer and one passive route-ready measurement listener; it creates no observer and does not mutate DOM from the route-ready listener.
- When Tools first opens, the shared v129 integration loads and registers Workflow Review route, field, and action handlers through the v126 owners.
- In active v130, v129 is not registered as a second coordinator enhancer; the v130 enhancer invokes its idempotent route integration.
- When Diagnostics opens, the evaluator and renderer load and update the Diagnostics DOM only through the coordinator enhancement pass.

## Startup loading boundary

The v130 production entry statically imports `boot-v128.js` only. It does not statically import the v129 integration, the v130 Diagnostics renderer, or the performance evaluator.

- Workflow Review integration loads only on Tools.
- Diagnostics and evaluation code load only on Diagnostics.
- `boot-v129.js` remains as a compatibility entry but is not loaded by the v130 shells.

The first v130 Lighthouse run measured 48 requests and 512,645 script bytes. The release corrected the loading boundary rather than weakening the protected ceilings of 45 requests and 500,000 script bytes.

This preserves the established v126 runtime and v127/v128 policies without introducing a second runtime, framework, or persistent cache.

## Budget controls

Protected contracts retain:

- 750 ms route-ready ceiling;
- 300 ms enhancement ceiling;
- 3 enhancement passes;
- 12 observer callbacks per route;
- 12 registered release enhancers;
- 40 registered dispatcher actions;
- 45 startup requests;
- 500,000 startup script bytes;
- 43 workbook sheets;
- 1 runtime observer;
- 6 primary destinations;
- 12 memory-only runtime samples.

Lighthouse remains authoritative for startup request and script-byte enforcement.

## Financial-write safety

v130 changes no financial write path. Existing controls remain:

- `gringottsBudgetVault.latest` is the sole authoritative transaction-copy domain;
- empty transaction arrays cannot replace the populated vault;
- broad transaction writes remain backup-first, rollback-capable, and read-back verified;
- Full Vault Restore targets the authoritative key only and remains separate from bank import;
- immutable close snapshots are not recomputed or silently rewritten;
- stable `rescue-v105.html` remains available.

## Network and content security

The release preserves:

- `default-src 'self'`;
- `connect-src 'self'`;
- `worker-src 'none'`;
- `frame-ancestors 'none'`;
- no fetch, XHR, WebSocket, EventSource, beacon, or remote telemetry implementation in v129 integration or v130 modules;
- no third-party runtime script or stylesheet.

## Supply-chain review

- TypeScript remains pinned to 5.9.2.
- Playwright and axe dependencies remain lockfile-pinned.
- GitHub Actions remain pinned to full commit SHAs.
- Protected dependency review, npm audit, public-repository history scan, CodeQL, and supply-chain workflows remain required.

## Security conclusion

v130 reduces rather than expands the attack and maintenance surface. It centralizes Workflow Review interaction under existing runtime owners, keeps specialist code outside startup, removes one active boot-wrapper hop, adds bounded memory-only diagnostics, and preserves all financial-data, storage, recovery, CSP, supply-chain, and exact-head promotion boundaries.
