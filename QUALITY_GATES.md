# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v133 required gates

- locked dependency installation before parser validation;
- exact release-consistency diagnostics before browser installation;
- strict TypeScript no-emit checking for retained typed contracts and the v133 drill engine;
- parser and static syntax for inherited runtime modules, the authoritative release manifest, compatibility entries, release diagnostics, shared helpers, and longevity modules;
- browser-free contracts for the six longevity scenarios, deterministic reports, portable-package corruption rejection, rollback preservation, orphan handling, stale-schema closure, capacity bounds, and local-only source behavior;
- Chromium, Firefox, and desktop WebKit;
- Android Chromium, iPad WebKit, and iPhone WebKit;
- repeated Workflow Review, Decision Gate, Roadmap, Diagnostics, and primary-route settlement without detached targets or mutation feedback loops;
- explicit browser proof that the longevity module stays outside startup, loads only after a synthetic drill request, leaves browser storage unchanged, and adds no observer;
- keyboard and visual contracts;
- axe accessibility for desktop and mobile retained household and infrastructure surfaces;
- Lighthouse ceilings of no more than 45 startup requests and 500,000 startup script bytes;
- public-repository security and full-history privacy/secret scanning;
- dependency review and high/critical npm audit;
- supply-chain checks and CodeQL;
- exact-head Cloudflare preview;
- unresolved review-thread check.

## Longevity-drill assertions

- the drill engine supports exactly `upgrade`, `corruption`, `rollback`, `orphan`, `stale-schema`, and `capacity`;
- committed and generated inputs are visibly synthetic and deterministic;
- a supported schema upgrade round-trips canonical data without migration or mutation;
- a corrupted portable package must be rejected by retained integrity validation before any restore or write;
- rollback requires an explicit populated synthetic backup and failed verification result, reproduces the backup exactly, leaves the backup unchanged, and preserves the failed candidate;
- orphan identifiers are reported deterministically with zero deletion and zero rewrite;
- unsupported schemas remain `manual-review` and perform no automatic migration;
- capacity bounds constrain the automated harness only, never declare a production-data limit, and never authorize cleanup, truncation, compaction, deletion, or reset;
- every drill report declares no authoritative-vault read or write, no automatic migration, repair, cleanup, or rollback, no destructive action, no network requirement, and no new persistent store;
- the engine source contains no browser-storage, network, service-worker, observer, or destructive storage implementation.

## Release consistency assertions

- `src/release-manifest.js` is the authoritative current-release source for version, number, package version, name, boot path, boot specifier, runtime label, asset tokens, protected budgets, primary destinations, and workbook sheets;
- `index.html` and `app.html` use a versionless `<title>Gringotts Budget Vault</title>` and load only the manifest-declared active entry;
- the active entry sets the final document title, visible version, runtime build version, release name, runtime label, and cache-bust metadata from the manifest;
- `package.json`, `package-lock.json`, the active shell specifier, `ROADMAP.md`, the runtime snapshot, and shared test expectations match the manifest;
- the v133 compatibility boot remains a manifest-only re-export and is not loaded by either production shell;
- the v133 drill implementation is dynamically imported only after explicit invocation;
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
- v133 adds no household-finance capability, persistent store, real-data migration, telemetry, analytics, endpoint, cloud adapter, service worker, backend, automatic export, financial schema, report sheet, second runtime, additional observer, primary destination, or Tools section;
- route-ready time remains capped at 750 ms, enhancement time at 300 ms, enhancement passes at 3, observer callbacks per route at 12, registered releases at 12, and registered actions at 40;
- startup remains capped at 45 requests and 500,000 script bytes without weakening Lighthouse assertions;
- only `gringottsBudgetVault.latest` may contain authoritative transaction copies, and the drill engine never reads or writes it;
- workbook labels, tests, and generated output remain capped at 43 sheets;
- existing financial export schemas and v126-owned filenames remain unchanged;
- empty-vault protection, backup-first broad writes, immutable close history, guarded import and restore, and stable v105 rescue remain unchanged.
