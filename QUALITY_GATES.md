# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v135 required gates

- locked dependency installation before parser validation;
- exact release-consistency diagnostics before browser installation;
- strict TypeScript no-emit checking for retained typed contracts and v135 resilience contracts;
- parser and static syntax for inherited runtime modules, the authoritative release manifest, compatibility entries, diagnostics, shared helpers, retained v133/v134 modules, and v135 modules;
- browser-free profile, fixture, evidence, local-only, and bounded replay contracts;
- deterministic 1,200-transaction fixture generation with a hard 2,000-transaction cap;
- keyboard-only completion in Chromium, Firefox, and desktop WebKit;
- touch completion in Android Chromium, iPad WebKit, and iPhone WebKit;
- reduced-motion verification across all six supported projects;
- large-vault Activity, Reports, Tools, and guarded Full Vault Restore evidence on governed low-resource projects;
- target-size, overflow, visible-focus, safety-message, storage, request, observer, and duplicate-dispatch checks;
- legitimate v130 route-ready or enhancement failure remains blocking evidence;
- retained v133 longevity and v134 export/download compatibility;
- unchanged legacy workbook, backup, restore, import, account-cleanup, close-history, reporting, Workflow Review, and Decision Gate behavior;
- repeated primary-route and Tools settlement without detached targets or mutation feedback loops;
- keyboard, visual, and axe accessibility contracts;
- Lighthouse ceilings of no more than 45 startup requests and 500,000 startup script bytes;
- public-repository security and full-history privacy/secret scanning;
- dependency review and high/critical npm audit;
- supply-chain checks and CodeQL;
- exact-head Cloudflare preview;
- unresolved review-thread check.

## Resilience assertions

- the authoritative catalog contains exactly six unique profiles;
- all six supported Playwright projects are covered;
- the reduced-motion profile spans every supported project;
- the large-vault profile is explicitly low-resource and uses exactly 1,200 synthetic transactions;
- generated IDs, dates, accounts, owners, merchants, categories, and amounts are deterministic and fictional;
- fixture generation rejects zero, fractional, negative, and over-cap counts;
- every measurement is finite and non-negative;
- every expected workflow must complete;
- route-ready remains at or below 750 ms and enhancement work at or below 300 ms;
- visible controls retain at least 44-pixel targets;
- root horizontal overflow remains at or below two pixels;
- no unexpected storage write, remote request, observer, duplicate dispatch, persistent cache, service worker, or device-specific branch is accepted;
- required safety messaging and visible focus remain present;
- a measured timing failure is reported and remains subject to the official v130 evaluator;
- v135 resilience modules are absent from normal startup.

## Route-replay assertions

- v126 remains the only primary-route lifecycle owner;
- the base renderer receives one normal attempt and at most one recovery attempt;
- the live route button is re-queried for each attempt;
- the attempt count and second-attempt recovery count are observable on the existing v126 registry;
- two misses enter the existing recovery shell;
- the replay path adds no storage, network, observer, cache, service-worker, timer loop, data mutation, or financial authority;
- no unbounded retry or hidden success is permitted.

## Retained export-contract assertions

- the v134 catalog still contains exactly sixteen retained local outputs and sixteen unique IDs;
- every output retains its owner, format, extension, MIME type, filename policy, privacy mode, startup-path status, success label, failure behavior, cancellation behavior, and `retryBehavior:'none'`;
- deterministic filenames and the 43-sheet ownership map remain unchanged;
- constrained privacy modes continue rejecting forbidden household-detail fields;
- cancellation before dispatch creates no anchor, object URL, download, or success outcome;
- success is available only after dispatch;
- object URLs are revoked and temporary anchors removed;
- dispatch failure throws without retry, fallback, partial output, upload, persistence, or substitution;
- Workflow Review and Decision Gate retain their established record builders and schemas;
- v134 modules remain absent from startup and load only with retained lazy export surfaces.

## Release consistency assertions

- `src/release-manifest.js` is the authoritative current-release source for version, number, package version, name, boot path, boot specifier, runtime label, asset tokens, protected budgets, primary destinations, and workbook sheets;
- `index.html` and `app.html` use a versionless title and load only the manifest-declared entry;
- package metadata, lockfile, shells, roadmap, runtime registries, shared helpers, and release documents match v135;
- `src/boot-v135.js` is a manifest-only compatibility re-export and is not loaded by production shells;
- v133 drills and v134 exports remain lazy retained capabilities;
- neither v134 export modules nor the v135 resilience module is imported by the current manifest;
- the compact v135 registry publishes only fixed readiness counts and lazy-load status;
- protected tests derive current identity from `tests/helpers/release.js`;
- newly scattered current-release literals fail release consistency with the exact file and mismatch;
- release-consistency output is uploaded with parser failure diagnostics.

## Preserved architecture and safety assertions

- v126 remains the only coordinator, specialist action dispatcher, and live `MutationObserver` owner;
- v127 remains the retained interaction, focus, action-language, table-region, dialog, responsive, touch-target, and reduced-motion policy;
- v128 remains the typed portable-vault and integrity foundation;
- v129 Workflow Review remains manual, session-only, privacy-filtered, and route-lazy;
- v130 runtime evidence remains bounded, memory-only, authoritative, and route-lazy;
- v131 Decision Gate remains closed by default, manual-only, privacy-filtered, and route-lazy;
- v132 remains the authoritative release-manifest and consistency infrastructure;
- v133 remains lazy and synthetic-only;
- v134 remains lazy and export-only;
- v135 adds no household-finance capability, store, telemetry, analytics, endpoint, cloud adapter, backend, service worker, cache layer, automatic action, financial schema, report destination, workbook sheet, second runtime, observer, primary destination, Tools section, or device-specific application fork;
- route-ready, enhancement, pass, callback, release, and action limits remain unchanged;
- startup remains capped at 45 requests and 500,000 script bytes without a waiver;
- only `gringottsBudgetVault.latest` may contain authoritative transaction copies;
- workbook ownership remains capped at 43 sheets;
- report and payload schemas remain unchanged;
- empty-vault protection, backup-first broad writes, immutable close history, guarded import and restore, and stable v105 rescue remain unchanged.
