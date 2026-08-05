# v133 Security Review — Local Data Longevity Drills

## Scope

This review covers the strict TypeScript and JavaScript longevity-drill engine, deterministic synthetic fixture generation, six drill scenarios, privacy-safe reports, the lazy browser registry, the v133 release-manifest update, compatibility boot, parser and browser tests, documentation, and retained runtime boundaries.

## Security conclusion

v133 does not expand the household-finance attack surface. It adds a pure synthetic test and diagnostic layer. The drill engine receives caller-supplied synthetic values, returns bounded reports, and has no access to browser storage, network APIs, credentials, or real household data. It introduces no backend, endpoint, service worker, persistent store, financial schema, report sheet, automatic export, financial action, observer, or destructive cleanup behavior.

## Assets protected

- the authoritative browser-local vault and transaction rows;
- account, balance, merchant, report, credential, import, profile, receipt, close-history, and planning data;
- portable-vault integrity and authority boundaries;
- guarded import and separate Full Vault Restore;
- immutable close history and backup-first broad writes;
- stable rescue behavior;
- runtime ownership and performance ceilings;
- release identity and exact-head promotion evidence;
- test integrity across supported browsers and devices.

## Trust boundaries

### Synthetic drill inputs

Drill inputs are untrusted values. The engine validates object shape, safe integers, release labels, populated transaction arrays, unique metadata identifiers, references, and supported scenario names. Invalid inputs throw a bounded `Longevity drill rejected` error.

The engine does not fetch fixtures, inspect the DOM, read environment variables, read browser storage, enumerate filesystem content, or discover real data. All committed and browser-test fixtures are visibly synthetic.

### Portable package validation

The corruption drill delegates validation to the retained v128 portable-vault validator. A corruption drill passes only when the validator rejects the modified package. A package that validates successfully produces a `rejected` drill disposition because it does not prove corruption handling.

The drill does not restore the package or write its payload anywhere.

### Rollback rehearsal

Rollback accepts an explicit synthetic backup, candidate, and verification result. It canonicalizes cloned values, verifies that restoration from the backup is exact, confirms the backup remains unchanged, and records that the failed candidate is preserved.

It does not call production import or restore code, write browser storage, download a file, or authorize a real rollback. A rollback request with a successful verification precondition is rejected.

### Orphan metadata

The orphan drill compares caller-supplied synthetic record identifiers and references. It returns sorted missing identifiers and explicitly records zero deletions and zero rewrites. The presence of any orphan produces `manual-review`.

The drill has no delete, remove, clear, reset, or storage-write operation.

### Stale schemas

The stale-schema drill identifies a non-current schema version and produces `manual-review` with `automaticMigrationPerformed: false`. A current-schema fixture is rejected because it does not exercise the intended condition.

No migration function, schema rewrite, compatibility shim, or automatic fallback is introduced.

### Capacity bounds

Capacity measures transaction count, canonical UTF-8 byte size, and metadata count. The limits keep automated synthetic fixtures bounded. They are not production quotas and do not authorize truncation, compaction, cleanup, reset, deletion, or warning suppression.

Exceeding a bound produces `manual-review` and explicitly records that no automatic cleanup occurred and no production limit was declared.

### Lazy browser registry

The production shells continue loading the authoritative release manifest. The manifest publishes `window.GringottsV133` with a snapshot and explicit `runSyntheticDrill` entry. The drill module is dynamically imported only when that function is called.

The registry:

- adds no user-facing control or destination;
- does not run a drill automatically;
- does not read the authoritative vault;
- stores only the last synthetic drill report in module memory;
- clears on reload;
- adds no event listener, observer, action registration, route, or persistent state.

## Data-flow analysis

1. A test explicitly supplies synthetic input to `runLongevityDrill` or `window.GringottsV133.runSyntheticDrill`.
2. The engine validates and canonicalizes caller-supplied data in memory.
3. Scenario-specific logic produces a deterministic report.
4. The report includes aggregate counts, identifiers supplied by the synthetic fixture, disposition, safeguards, and human action.
5. No data is transmitted, persisted, automatically downloaded, applied to the application, or written to the authoritative vault.

No path exists from `gringottsBudgetVault.latest` to the drill engine. No path exists from a drill report to a production write or financial action.

## Privacy review

The engine contains no:

- `localStorage`, `sessionStorage`, IndexedDB, cookie, Cache API, or filesystem access;
- `fetch`, XMLHttpRequest, beacon, WebSocket, EventSource, or provider adapter;
- telemetry, analytics, fingerprinting, route-history collection, or timing upload;
- account, merchant, credential, token, email, phone, or household-contact parser;
- automatic report or screenshot generation.

Repository tests prohibit real household data and inspect the drill sources for browser persistence, network APIs, service-worker registration, observer creation, and destructive storage operations.

## Integrity review

- deterministic canonical JSON is reused from the v128 foundation;
- corrupted portable packages are rejected by retained SHA-256 validation;
- transaction arrays must remain populated;
- rollback verifies exact canonical equality to an explicit backup;
- duplicate metadata record identifiers are rejected;
- orphan identifiers are deduplicated and sorted;
- non-finite and non-JSON-compatible values remain rejected by canonicalization;
- reports use fixed scenario and disposition vocabularies.

## Availability and resource review

The synthetic generator is bounded. Automated tests exercise 5,000 and 5,001 transaction cases without declaring a production limit. The v133 implementation remains outside startup, so normal Dashboard load does not fetch or parse the drill module.

The existing limits remain unchanged:

- 750 ms route ready;
- 300 ms enhancement;
- 3 enhancement passes;
- 12 observer callbacks per route;
- 40 registered actions;
- 45 startup requests;
- 500,000 startup script bytes;
- one runtime observer;
- six primary destinations;
- 43 workbook sheets.

## Preserved recovery controls

v133 does not alter:

- `gringottsBudgetVault.latest` authority;
- empty-vault rejection;
- guarded bank import;
- separate Full Vault Restore;
- backup-first broad writes;
- read-back verification and rollback behavior;
- immutable closed-month evidence;
- stable `rescue-v105.html`.

A synthetic drill result cannot bypass, replace, or weaken any recovery control.

## Threats considered

### Malicious or malformed synthetic input

Mitigation: strict shape checks, canonical JSON validation, safe-integer checks, bounded arrays, supported scenario vocabulary, and closed rejection.

### Corrupted package accepted as recovery evidence

Mitigation: retained integrity validation; a successful package validation rejects the corruption drill rather than treating it as proof.

### Drill result mistaken for migration or cleanup authority

Mitigation: every report includes explicit false safeguards for automatic migration, repair, cleanup, rollback, authoritative-vault read/write, destructive action, network, and persistence. Documentation states that real corrective action requires a separate scope and review.

### Orphan detection deletes user metadata

Mitigation: no deletion or storage API exists; reports record zero deletion and zero rewrite; orphans remain manual review.

### Capacity threshold causes data loss

Mitigation: bounds are explicitly synthetic harness limits; exceedance preserves the dataset and produces manual review with no production-limit declaration.

### Runtime ownership expansion

Mitigation: no new observer, route, event listener, action, destination, or Tools section. v126 remains sole lifecycle and dispatcher owner. The module is dynamically imported only on explicit invocation.

### Privacy leakage through committed fixtures

Mitigation: fixtures are deterministic and visibly synthetic; repository security and history scans remain required; real exports, backups, reports, profiles, receipts, close history, planning data, and screenshots remain prohibited.

## Validation requirements

Promotion requires the exact final head to pass:

- strict TypeScript and syntax validation;
- release consistency before browser installation;
- browser-free tests for all six scenarios and deterministic reports;
- source inspection proving no persistence, network, observer, service worker, or destructive storage operation;
- supported desktop and responsive browser matrices;
- route-settlement, keyboard, visual, axe, and unchanged Lighthouse gates;
- public-repository security and full-history privacy scanning;
- dependency, supply-chain, and CodeQL gates;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Residual risk

The drills validate the currently modeled synthetic scenarios; they do not prove that every future schema or browser-storage failure mode is covered. They intentionally do not operate on real data. Any future migration, repair, cleanup, rollback, encrypted file workflow, or adapter requires a separate design, threat model, explicit comparison and backup UX, and complete protected validation.
