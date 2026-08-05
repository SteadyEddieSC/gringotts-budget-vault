# v132 Security Review — Release & Test Infrastructure Simplification

## Scope

This review covers the authoritative release manifest and combined browser entry, versionless HTML shells, shared release test helpers, release-consistency diagnostics, CI integration, retained specialist loading boundaries, compatibility re-export, and associated documentation and tests.

## Security conclusion

v132 does not expand the household-finance attack surface. It centralizes static release metadata and current-release orchestration in one browser module and adds local build/test diagnostics. It introduces no backend, remote endpoint, provider token, persistent store, financial schema, service worker, automatic financial action, or additional observer.

## Assets protected

- authoritative browser-local vault and transaction rows;
- account, balance, merchant, report, credential, and portable-vault data;
- guarded import and separate restore boundaries;
- immutable close history and backup-first broad writes;
- runtime ownership, performance ceilings, and route stability;
- release identity and exact-head promotion evidence;
- test integrity across supported browsers and devices.

## Trust boundaries

### Combined release manifest and browser entry

`src/release-manifest.js` is static application code. It contains release identity, protected budgets, and bounded current-release orchestration. It does not read user data, browser storage, environment secrets, network responses, or provider credentials.

The module validates:

- version and numeric release agreement;
- package-version agreement;
- active browser-entry path and specifier agreement;
- six primary destinations;
- one runtime observer;
- the 43-sheet workbook cap;
- roadmap-horizon containment;
- budget agreement with destination and workbook declarations.

After validation, the browser-only guarded path loads the retained v128/v126 foundation. Node-based tests can import the same manifest without starting browser behavior.

`src/boot-v132.js` is a compatibility re-export only. Production shells do not load it, and consistency tests verify that its executable content contains no duplicate runtime implementation.

### HTML shells

The shells contain no current version in their title or loading copy. They load one exact manifest browser-entry specifier and retain the existing restrictive Cloudflare headers. No inline network, storage, or service-worker behavior is added.

### Release consistency diagnostic

`scripts/release-consistency.mjs` reads repository files during local validation or CI. It:

- performs no network operation;
- reads no user browser data;
- receives no secret input;
- writes no repository or application data;
- reports mismatches to standard output and exits non-zero;
- verifies that the compatibility boot is only a re-export;
- scans protected tests for scattered current-release assertions.

Its output contains repository paths and expected metadata only.

### Shared test helper

`tests/helpers/release.js` imports the static manifest and derives test expectations. The browser guard prevents this import from starting application runtime in Node. The helper performs no application write, network request, browser persistence, or financial-data operation.

## Runtime review

The combined v132 manifest entry:

- validates release identity before starting the current release;
- loads the retained v128/v126 foundation;
- loads v129 Workflow Review after Tools opens;
- loads v131 Decision Gate integration after Tools opens;
- loads Decision Gate UI and contracts only after Decision Gate opens;
- loads v130 Diagnostics and performance evaluation lazily;
- reasserts manifest identity after retained integrations run;
- registers one current coordinator release without adding an observer;
- preserves the v126 dispatcher and action ceiling;
- removes the extra startup request created by the earlier split manifest/boot design.

No new DOM observer, timer-based readiness runtime, worker, cache, backend, or remote logging channel is introduced.

## Data-flow review

### Reads

- static release manifest and current-release constants;
- static repository files during validation;
- existing in-memory runtime ownership and budget snapshots.

### Writes

- document title and visible version text;
- existing runtime build metadata;
- bounded in-memory release and performance snapshots;
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
- the combined entry has demonstrated compliance without relaxing either ceiling;
- public-repository security, dependency review, npm audit, supply-chain, CodeQL, exact-head preview, and unresolved-thread gates remain required.

## Residual risks and mitigations

### Incorrect manifest update

A malformed or internally inconsistent manifest fails validation. Cross-file drift fails the parser-stage consistency diagnostic before browser installation.

### Browser behavior during Node import

The module starts runtime only when both `window` and `document` exist. Browser-free tests verify manifest imports and helper derivation without invoking application startup.

### Compatibility entry divergence

The compatibility file is not loaded by production shells. The consistency diagnostic strips historical comments and requires its executable content to be exactly the manifest re-export.

### Overbroad test allowlist

The consistency script has a narrow allowlist for deliberately release-specific tests. Repository-security tests verify the consistency script and shared-helper ownership. Future changes to the allowlist remain reviewable source changes.

### Historical compatibility code changes metadata

The combined v132 entry reasserts current manifest metadata after every enhancement cycle. Cross-route tests verify that Workflow Review, Decision Gate, and Diagnostics cannot leave historical current-release labels behind.

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