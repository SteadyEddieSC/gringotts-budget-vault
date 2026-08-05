# v134 Security Review — Reporting & Export Contract Consolidation

## Review decision

v134 is acceptable for promotion only after the exact final head passes every protected release gate. The release consolidates metadata and local-download execution; it does not expand financial authority, persistence, network reach, report destinations, workbook size, or recovery behavior.

## Assets and trust boundaries

Protected assets remain:

- the authoritative browser-local vault at `gringottsBudgetVault.latest`;
- backup and restore artifacts selected or downloaded by the user;
- transaction rows and household planning data;
- account and source identifiers;
- immutable close-history aggregates;
- sanitized workflow review and decision records;
- retained local report and workbook outputs.

Trust boundaries remain:

- browser memory and local browser storage;
- user-selected files;
- explicit user-initiated local downloads;
- static same-origin application resources;
- Cloudflare Pages deployment headers;
- public source and CI artifacts, which must contain synthetic or structural evidence only.

## Security-relevant changes

v134 adds:

- a typed/browser-compatible catalog for sixteen retained local outputs;
- deterministic filename and MIME contracts;
- a 43-sheet workbook ownership map;
- privacy-mode validators for constrained exports;
- one injected browser download executor;
- compatibility wrappers for the existing v129 and v131 filename helpers;
- migration of the already-lazy Workflow Review and Decision Gate downloads to the shared executor;
- browser-free and browser tests for dispatch, cancellation, cleanup, failure, privacy, storage, and lazy loading.

## Authority analysis

The new catalog is descriptive. It cannot execute an export by itself. The executor requires an explicit call from an existing user action and has no scheduler, observer, background worker, timer loop, retry loop, storage adapter, network adapter, or automatic route hook.

The executor does not read `gringottsBudgetVault.latest`. It receives an already-built payload from the established release-specific builder. The migrated v129 and v131 payload builders continue enforcing their existing workflow-only privacy rules.

v134 does not alter:

- guarded import;
- Full Vault Restore;
- empty-vault protection;
- backup-first broad writes;
- rollback and read-back verification;
- immutable close history;
- the stable v105 rescue page;
- transaction or planning schemas;
- workbook or report builders.

## Privacy validation

The catalog assigns each output one privacy mode. Constrained modes reject forbidden object keys recursively before dispatch.

Aggregate-only and workflow-only checks reject transaction collections, raw source names and fingerprints, vault contents, credentials, tokens, raw account identifiers and labels, merchants, balances, amounts, cards, email addresses, and contacts where prohibited.

The validator is defense in depth. It does not replace existing sanitization, schema validation, or user-visible privacy boundaries.

## Download behavior

Required behavior:

- cancellation before dispatch returns `cancelled` and creates no object URL or anchor;
- success is represented only after the anchor click is dispatched;
- one object URL is created and revoked;
- the temporary anchor is removed;
- any failure throws with the owning export label;
- no automatic retry, fallback format, partial output, or silent substitution occurs.

## Startup and runtime analysis

The v134 catalog and executor are not imported by the release manifest or production shell. They load only when an already-lazy Workflow Review or Decision Gate module is requested.

The startup registry reports only status flags and fixed counts. It does not duplicate the catalog or payload data.

The release adds:

- zero primary destinations;
- zero Tools sections;
- zero observers;
- zero service workers;
- zero persistent stores;
- zero endpoints;
- zero workbook sheets.

## Source constraints

The v134 source must contain no:

- `fetch`, XMLHttpRequest, beacon, WebSocket, or EventSource implementation;
- localStorage, sessionStorage, IndexedDB, or cookie access;
- service-worker registration;
- MutationObserver construction;
- interval or automatic retry implementation;
- authoritative-vault key or transaction schema dependency.

These constraints are enforced in release consistency, browser-free tests, repository-security tests, privacy-history scanning, and CodeQL.

## Failure modes reviewed

### Invalid contract or filename

The executor throws before dispatch. It does not guess another contract, filename, extension, MIME type, or payload.

### Privacy-mode violation

The validator throws before Blob or object-URL creation. No download is dispatched.

### Aborted request

The executor returns `cancelled` before dispatch. No success message is permitted.

### Missing browser download support

The executor throws. It does not upload, persist, queue, or convert the output.

### Object-URL or click failure

The temporary anchor is removed, any created URL is revoked, and the error propagates without retry.

### Legacy output mismatch

Catalog tests fail. v134 does not silently change a historical payload or filename to satisfy the catalog.

## Residual risks

- Browser download behavior ultimately depends on the browser and operating system after dispatch.
- Filename compatibility is contractual but does not prevent users or browsers from renaming downloaded files.
- Key-name privacy validation cannot understand arbitrary sensitive values stored under misleading keys; established payload builders and sanitizers remain the primary protection.
- The legacy startup-path export controller remains duplicated internally; v134 intentionally avoids migrating it because doing so would add startup risk and request/byte pressure.

These risks are accepted only with the existing local-first boundary, explicit user action, retained sanitizers, no network path, and full protected regression matrix.

## Required promotion evidence

- strict TypeScript and syntax;
- deterministic browser-free catalog and executor tests;
- release consistency;
- real v129 and v131 local-download tests;
- unchanged browser storage and observer count;
- startup absence and on-demand module loading;
- six-browser/device regression;
- keyboard, visual, axe, and unchanged Lighthouse budgets;
- public-repository security and full-history privacy;
- supply-chain and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.
