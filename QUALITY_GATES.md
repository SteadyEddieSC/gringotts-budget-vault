# Quality Gates

A release is promotable only when the exact final head passes every required gate.

## v132 required gates

- locked dependency installation before parser validation;
- exact release-consistency diagnostics before browser installation;
- strict TypeScript no-emit checking for retained typed contracts;
- parser and static syntax for inherited runtime modules, the authoritative release manifest, the startup-light v132 boot, the consistency diagnostic, and shared release test helpers;
- browser-free release-manifest, versionless-shell, roadmap-status, local-only, and historical-release separation contracts;
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

## Release consistency assertions

- `src/release-manifest.js` is the authoritative current-release source for version, number, package version, name, boot path, boot specifier, runtime label, asset tokens, protected budgets, primary destinations, and workbook sheets;
- `index.html` and `app.html` use a versionless `<title>Gringotts Budget Vault</title>` and load only the manifest-declared active boot;
- the active boot sets the final document title, visible version, runtime build version, release name, runtime label, and cache-bust metadata from the manifest;
- `package.json`, `package-lock.json`, the active shell boot specifier, `ROADMAP.md`, the runtime snapshot, and shared test expectations match the manifest;
- protected tests use `tests/helpers/release.js` for the current version, title, package version, boot resource, and roadmap status counts;
- newly scattered literal current-release assertions fail `npm run release:check` with the exact file and mismatch;
- release-consistency output is uploaded with parser failure diagnostics.

## Preserved architecture and safety assertions

- v126 remains the only coordinator for rendered-route readiness, the only specialist action dispatcher, and the only live `MutationObserver` owner;
- v127 remains the retained interaction, focus, action-language, table-region, dialog, and responsive presentation policy;
- v128 remains the typed portable-vault foundation and adds no encryption or cloud adapter in v132;
- v129 Workflow Review remains manual, session-only, privacy-filtered, and route-lazy;
- v130 runtime evidence remains bounded, memory-only, and route-lazy;
- v131 Decision Gate remains closed by default, manual-only, privacy-filtered, and route-lazy;
- v132 adds no household-finance capability, persistent store, migration, telemetry, analytics, endpoint, cloud adapter, service worker, backend, automatic export, financial schema, report sheet, second runtime, or additional observer;
- route-ready time remains capped at 750 ms, enhancement time at 300 ms, enhancement passes at 3, observer callbacks per route at 12, registered releases at 12, and registered actions at 40;
- startup remains capped at 45 requests and 500,000 script bytes without weakening Lighthouse assertions;
- only `gringottsBudgetVault.latest` may contain authoritative transaction copies;
- workbook labels, tests, and generated output remain capped at 43 sheets;
- existing financial export schemas and v126-owned filenames remain unchanged;
- empty-vault protection, backup-first broad writes, immutable close history, guarded import and restore, and stable v105 rescue remain unchanged.