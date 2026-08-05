# v132 — Release & Test Infrastructure Simplification

## Summary

v132 is a maintenance-only release that centralizes current-release identity and moves metadata-drift detection into the parser stage. It adds no household-finance capability and changes no financial data model, import, restore, report, workbook, or decision authority.

## Authoritative release manifest

`src/release-manifest.js` now owns:

- current version and numeric release;
- package version and release name;
- active boot path and boot specifier;
- runtime label and cache-bust identity;
- specialist asset tokens;
- feature-freeze state;
- six primary destinations and six Tools sections;
- the 43-sheet workbook cap;
- protected runtime, action, observer, request, script, and session-sample budgets;
- roadmap status derivation.

The manifest validates its internal relationships before the active release starts.

## Versionless shells

`index.html` and `app.html` no longer duplicate the current version in their document title or loading copy. Both load the manifest-declared v132 boot. The active boot applies the final document title, visible release version, runtime build version, release name, runtime label, and cache-bust value.

This prevents a shell title or loading message from becoming stale when the release advances.

## Shared test expectations

`tests/helpers/release.js` derives the current:

- version;
- release number and name;
- package version;
- document title;
- boot specifier and resource pattern;
- roadmap current, shipped, and directional counts.

Historical release assertions remain literal where they protect v127–v131 behavior. Current-release assertions use the shared helper.

## Exact release consistency diagnostics

`scripts/release-consistency.mjs` runs before browser installation and verifies:

- manifest validity;
- package and lockfile versions;
- versionless HTML shells and exact boot specifier;
- active boot manifest ownership;
- shared test-helper ownership;
- current roadmap documentation and source entry;
- current runtime readiness expectations;
- absence of newly scattered literal current-release assertions.

A failure prints structured JSON with the exact file, field, expected value, and actual value. The report is uploaded with parser failure diagnostics.

## Runtime ownership and loading

The production shells load `src/boot-v132.js?v=132release1`.

The active entry statically imports v128 and the small release manifest only. It retains existing lazy boundaries:

- v129 Workflow Review integration loads after Tools opens;
- v131 Decision Gate integration loads after Tools opens;
- the Decision Gate UI and contracts load only when Decision Gate opens;
- v130 Diagnostics and performance evaluation remain lazy.

The v132 boot reasserts manifest metadata after retained integrations run so historical compatibility code cannot leave stale current-release labels.

v126 remains the only route coordinator, specialist action dispatcher, and live `MutationObserver` owner.

## Preserved boundaries

v132 adds no:

- transaction, account, budget, forecasting, debt, recurring-cost, calendar, report, workbook, import, restore, or cloud capability;
- persistent store, migration, telemetry, analytics, beacon, provider adapter, Pages Function, Worker, backend, or service worker;
- primary destination, report sheet, financial export schema, automatic export, or financial action;
- second runtime or additional observer.

`gringottsBudgetVault.latest`, guarded import, separate Full Vault Restore, empty-vault protection, backup-first broad writes, immutable close history, stable v105 rescue, six primary destinations, and the 43-sheet workbook cap remain unchanged.

## Validation requirement

Promotion requires the exact final head to pass release consistency, strict TypeScript, browser-free contracts, Chromium/Firefox/WebKit desktop, Android Chromium, iPad/iPhone WebKit, repeated-route settlement, keyboard, visual, axe, Lighthouse, public-repository security, supply-chain, CodeQL, exact-head Cloudflare preview, and unresolved-thread verification.

## Next direction

v133 remains **Local Data Longevity Drills**. It should exercise synthetic long-lived data through upgrade, corruption, rollback, orphan, stale-schema, and capacity scenarios without destructive automatic cleanup.