# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v134 required gates

- locked dependency installation before parser validation;
- exact release-consistency diagnostics before browser installation;
- strict TypeScript no-emit checking for retained typed contracts, the v133 drill engine, and v134 export contracts and executor;
- parser and static syntax for inherited runtime modules, the authoritative release manifest, compatibility entries, release diagnostics, shared helpers, longevity modules, and v134 modules;
- browser-free contracts for catalog completeness, deterministic filenames and MIME types, privacy modes, 43-sheet ownership, dispatch, cancellation, cleanup, failure propagation, no retry, and local-only source behavior;
- real Workflow Review and Decision Gate downloads with established record kinds, payload schemas, release ownership, and privacy declarations;
- explicit browser proof that v134 code stays outside startup, loads only with an already-lazy export surface, leaves browser storage unchanged, and adds no observer;
- unchanged legacy workbook, backup, restore, import, account-cleanup, close-history, and reporting compatibility;
- Chromium, Firefox, and desktop WebKit;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- repeated Workflow Review, Decision Gate, Roadmap, Diagnostics, and primary-route settlement without detached targets or mutation feedback loops;
- keyboard and visual contracts;
- axe accessibility for desktop and mobile retained household and infrastructure surfaces;
- Lighthouse ceilings of no more than 45 startup requests and 500,000 startup script bytes;
- public-repository security and full-history privacy/secret scanning;
- dependency review and high/critical npm audit;
- supply-chain checks and CodeQL;
- exact-head Cloudflare preview;
- unresolved review-thread check.

## Export-contract assertions

- the authoritative catalog contains exactly sixteen retained local outputs and sixteen unique IDs;
- every output declares an owner, format, extension, MIME type, filename policy, privacy mode, startup-path status, success label, failure behavior, cancellation behavior, and `retryBehavior:'none'`;
- deterministic filenames preserve recognizable prefixes, historical release ownership, and extensions;
- the workbook ownership map totals exactly 43 sheets as 32+1+2+2+2+2+2;
- constrained privacy modes reject transaction rows, raw sources, vault contents, credentials, tokens, raw account identifiers or labels, merchants, balances, amounts, cards, email addresses, and contacts where forbidden;
- cancellation before dispatch creates no anchor, object URL, download, or success outcome;
- success is available only after the temporary anchor click is dispatched;
- object URLs are revoked and temporary anchors removed;
- dispatch failure throws after one attempt without retry, fallback format, partial output, upload, persistence, or silent substitution;
- Workflow Review and Decision Gate continue using their established release-specific record builders;
- legacy startup-path and v118–v125 export controllers are cataloged and tested without runtime migration.

## Release consistency assertions

- `src/release-manifest.js` is the authoritative current-release source for version, number, package version, name, boot path, boot specifier, runtime label, asset tokens, protected budgets, primary destinations, and workbook sheets;
- `index.html` and `app.html` use a versionless `<title>Gringotts Budget Vault</title>` and load only the manifest-declared active entry;
- the active entry sets the final document title, visible version, runtime build version, release name, runtime label, and cache-bust metadata from the manifest;
- `package.json`, `package-lock.json`, the active shell specifier, `ROADMAP.md`, the runtime snapshot, and shared test expectations match the manifest;
- the v134 compatibility boot remains a manifest-only re-export and is not loaded by either production shell;
- the v133 drill implementation remains dynamically imported only after explicit synthetic invocation;
- neither v134 export module is imported by the current manifest;
- the compact v134 registry begins with both lazy-load flags false and publishes only fixed status and counts;
- protected tests use `tests/helpers/release.js` for current release identity;
- newly scattered literal current-release assertions fail `npm run release:check` with the exact file and mismatch;
- release-consistency output is uploaded with parser failure diagnostics.

## Preserved architecture and safety assertions

- v126 remains the only coordinator for rendered-route readiness, the only specialist action dispatcher, and the only live `MutationObserver` owner;
- v127 remains the retained interaction, focus, action-language, table-region, dialog, and responsive presentation policy;
- v128 remains the typed portable-vault and integrity foundation;
- v129 Workflow Review remains manual, session-only, privacy-filtered, and route-lazy;
- v130 runtime evidence remains bounded, memory-only, and route-lazy;
- v131 Decision Gate remains closed by default, manual-only, privacy-filtered, and route-lazy;
- v132 remains the authoritative release-manifest and release-consistency infrastructure;
- v133 remains a lazy, synthetic-only longevity capability and never gains real-data authority;
- v134 adds no household-finance capability, persistent store, telemetry, analytics, endpoint, cloud adapter, service worker, backend, automatic export, financial schema, report destination, report sheet, second runtime, additional observer, primary destination, or Tools section;
- route-ready time remains capped at 750 ms, enhancement time at 300 ms, enhancement passes at 3, observer callbacks per route at 12, registered releases at 12, and registered actions at 40;
- startup remains capped at 45 requests and 500,000 script bytes without weakening Lighthouse assertions;
- only `gringottsBudgetVault.latest` may contain authoritative transaction copies, and v134 never reads or writes it;
- workbook labels, tests, generated output, and ownership mapping remain capped at 43 sheets;
- existing report and payload schemas remain unchanged;
- empty-vault protection, backup-first broad writes, immutable close history, guarded import and restore, and stable v105 rescue remain unchanged.
