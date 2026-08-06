# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, completed real household Workflow Review files, Decision Gate records, receipts, close-history records, import profiles, or screenshots containing financial data.

## v135 focus

The v135 matrix verifies:

- one authoritative browser-compatible current-release manifest and versionless production shells;
- package, lockfile, shell, active entry, roadmap, runtime, documentation, and shared test expectations remain consistent;
- strict TypeScript and browser-compatible contracts for six governed resilience profiles;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit are all covered;
- keyboard-only completion across desktop engines;
- touch completion across Android, iPad, and iPhone projects;
- reduced-motion behavior across every supported project;
- representative controls retain at least 44-pixel targets and root overflow remains within two pixels;
- a deterministic fictional 1,200-transaction vault is reproducible and remains under a hard 2,000-transaction test cap;
- large-vault Activity, Reports, Tools, and guarded Full Vault Restore flows remain bounded;
- measurements are finite and non-negative and incomplete evidence fails explicitly;
- no unexpected storage write, remote request, observer, duplicate dispatch, persistent cache, service worker, or device-specific fork is permitted;
- v130 route-ready and enhancement ceilings remain 750 ms and 300 ms on every profile;
- legitimate v130 runtime failure remains blocking evidence rather than being bypassed by a device test;
- v126 base-route replay is capped at two attempts, records recovery evidence, and remains fail-closed;
- v135 contracts remain absent from normal startup;
- v134 export contracts remain lazy, retained, privacy-filtered, cleanup-safe, and no-retry;
- v133 longevity drills remain lazy and synthetic-only;
- one live observer remains owned by v126 and no service worker is registered;
- six primary destinations, six Tools sections, and the 43-sheet workbook cap remain unchanged;
- Lighthouse remains capped at 45 startup requests and 500,000 startup script bytes;
- the authoritative vault, guarded import, separate Full Vault Restore, backup-first broad writes, immutable close history, Workflow Review, Decision Gate, and stable v105 rescue remain intact.

## Local commands

```bash
npm ci --ignore-scripts
npm run release:check
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

`npm run release:check` prints a JSON consistency report. On failure, it identifies the exact file, field, expected value, and actual value. Do not bypass this gate by adding files to the allowlist unless the file is intentionally release-specific and separately protected.

The browser-free v135 suite directly exercises profile completeness, inherited v130 timing ceilings, deterministic fixture generation, fixture caps, finite measurements, explicit failures, device-fork and persistent-cache prohibitions, local-only source behavior, and bounded route replay.

The browser v135 suite exercises keyboard navigation, touch navigation, reduced motion, target sizes, overflow, large-vault workflows, visible safety messaging, focus, storage stability, remote-request deltas, observer ownership, duplicate dispatch, and official v130 evaluation.

Retained browser suites continue to exercise v133 longevity drills and v134 Workflow Review and Decision Gate downloads, including established payload kinds, schemas, privacy declarations, cancellation, cleanup, failure behavior, startup absence, on-demand loading, browser-storage stability, and observer non-regression.

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, axe accessibility, visual contracts, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts, relax Lighthouse or v130 budgets, weaken release consistency, add a device-specific production path, hide a runtime-blocked outcome, retry indefinitely, or bypass cross-browser gates. Correct the source contract, loading boundary, fixture, route lifecycle, or test synchronization instead.
