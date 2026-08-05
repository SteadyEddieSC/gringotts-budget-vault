# v132 Security Review — Release & Test Infrastructure Simplification

## Scope

This review covers the authoritative release manifest, manifest-driven production boot, versionless HTML shells, shared release test helpers, release-consistency diagnostics, CI integration, retained specialist loading boundaries, and associated documentation and tests.

## Security conclusion

v132 does not expand the household-finance attack surface. It centralizes static release metadata and adds local build/test diagnostics. It introduces no backend, remote endpoint, provider token, persistent store, financial schema, service worker, automatic financial action, or additional observer.

## Assets protected

- authoritative browser-local vault and transaction rows;
- account, balance, merchant, report, credential, and portable-vault data;
- guarded import and separate restore boundaries;
- immutable close history and backup-first broad writes;
- runtime ownership, performance ceilings, and route stability;
- release identity and exact-head promotion evidence;
- test integrity across supported browsers and devices.

## Trust boundaries

### Release manifest

`src/release-manifest.js` is static application code. It contains release identity and protected budgets only. It does not read user data, browser storage, environment secrets, network responses, or provider credentials.

The manifest validates:

- version and numeric release agreement;
- package-version agreement;
- active boot path and boot-specifier agreement;
- six primary destinations;
- one runtime observer;
- the 43-sheet workbook cap;
- roadmap-horizon containment;
- budget agreement with destination and workbook declarations.

### HTML shells

The shells contain no current version in their title or loading copy. They load one exact active boot specifier and retain the existing restrictive Cloudflare headers. No inline network, storage, or service-worker behavior is added.

### Release consistency diagnostic

`scripts/release-consistency.mjs` reads repository files during local validation or CI. It:

- performs no network operation;
- reads no user browser data;
- receives no secret input;
- writes no repository or application data;
- reports mismatches to standard output and exits non-zero;
- scans protected tests for scattered current-release assertions.

Its output contains repository paths and expected metadata only.

### Shared test helper

`tests/helpers/release.js` imports the static manifest and derives test expectations. It performs no application write, network request, browser persistence, or financial-data operation.

## Runtime review

The active v132 boot:

- statically imports the retained v128/v126 shell and release manifest only;
- loads v129 Workflow Review after Tools opens;
- loads v131 Decision Gate integration after Tools opens;
- loads Decision Gate UI and contracts only after Decision Gate opens;
- loads v130 Diagnostics and performance evaluation lazily;
- reasserts manifest identity after retained integrations run;
- registers one current coordinator release without adding an observer;
- preserves the v126 dispatcher and action ceiling.

No new DOM observer, timer-based readiness runtime, worker, cache, backend, or remote logging channel is introduced.

## Data-flow review

### Reads

- static release manifest;
- static repository files during validation;
- existing in-memory runtime ownership and budget snapshots.

### Writes

- document title and visible version text;
- existing runtime build metadata;
- CI standard output and failure artifacts containing consistency diagnostics.

### Prohibited and absent

- `fetch`, XHR, WebSocket, beacon, analytics, or remote logging;
- localStorage, sessionStorage, IndexedDB, cookies, Cache API, or service-worker storage;
- vault, transaction, balance, account, merchant, report, credential, or portable-vault access;
- automatic export, synchronization, migration, or financial write.

## CI and supply-chain review

- locked dependencies and pinned GitHub Actions remain unchanged;
- release consistency and strict contracts execute before browser installation;
- consistency failure logs are retained for seven days;
- no retry is added that could conceal a deterministic mismatch;
- Chromium must pass before Firefox/WebKit installation;
- Android Chromium must pass before iPad/iPhone WebKit execution;
- Lighthouse budgets remain 45 requests and 500,000 script bytes;
- public-repository security, dependency review, npm audit, supply-chain, CodeQL, exact-head preview, and unresolved-thread gates remain required.

## Residual risks and mitigations

### Incorrect manifest update

A malformed or internally inconsistent manifest fails validation. Cross-file drift fails the parser-stage consistency diagnostic before browser installation.

### Overbroad test allowlist

The consistency script has a narrow allowlist for deliberately release-specific tests. Repository-security tests verify the consistency script and shared-helper ownership. Future changes to the allowlist remain reviewable source changes.

### Historical compatibility code changes metadata

The v132 boot reasserts current manifest metadata after every enhancement cycle. Cross-route tests verify that Workflow Review, Decision Gate, and Diagnostics cannot leave historical current-release labels behind.

### Build diagnostics reveal repository structure

Failure artifacts contain repository-relative paths and release metadata only. They contain no user data, credentials, vault content, or financial records.

## Required validation

- release-consistency diagnostic and browser-free manifest contracts;
- strict TypeScript and syntax checks;
- cross-browser and responsive Playwright;
- repeated route settlement and single-observer assertions;
- axe, keyboard, visual, and Lighthouse gates;
- public-repository secret/privacy scans;
- dependency review, npm audit, supply-chain, and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Approval statement

v132 is acceptable for promotion only after the exact final head passes every protected gate. This review authorizes only the release and test infrastructure simplification described above and does not authorize any new household-finance capability.