# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, completed real household Workflow Review files, Decision Gate records, receipts, close-history records, import profiles, or screenshots containing financial data.

## v134 focus

The v134 matrix verifies:

- one authoritative browser-compatible current-release manifest and versionless production shells;
- package, lockfile, shell, active entry, roadmap, runtime, and shared test expectations remain consistent;
- strict TypeScript and browser-compatible contracts for sixteen retained local outputs;
- every catalog entry has a unique ID, owner, format, extension, MIME type, filename policy, privacy mode, success label, failure behavior, cancellation behavior, and no-retry declaration;
- deterministic filenames preserve established prefixes, historical release ownership, and extensions;
- the workbook ownership chain totals exactly 43 sheets as 32+1+2+2+2+2+2;
- aggregate-only, metadata-only, configuration-only, diagnostics-only, and workflow-only payloads reject forbidden household-detail keys;
- the injected local executor creates one explicit download, reports `dispatched` only after click, removes the anchor, and revokes the object URL;
- an already-aborted request returns `cancelled` before creating an anchor or object URL;
- a dispatch failure throws after one attempt without retry, partial output, fallback format, or silent substitution;
- Workflow Review and Decision Gate retain their established record kinds, release ownership, privacy declarations, and payload schemas;
- both migrated surfaces leave browser storage and observer ownership unchanged;
- v134 catalog and executor modules remain absent from normal startup and load only with an already-lazy export surface;
- the legacy workbook, backup, restore, profile, receipt, account-cleanup, and close-trend implementations remain present and compatible;
- v133 longevity drills remain lazy, synthetic-only, and retained under the v134 host release;
- one live observer remains owned by v126 and no service worker is registered;
- six primary destinations, six Tools sections, and the 43-sheet workbook cap remain unchanged;
- Lighthouse remains capped at 45 startup requests and 500,000 startup script bytes;
- the authoritative vault, guarded import, separate Full Vault Restore, backup-first broad writes, immutable close history, and stable v105 rescue remain intact.

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

The browser-free v134 suite directly exercises catalog completeness, filename and MIME stability, workbook ownership, privacy rejection, download dispatch, cancellation, cleanup, failure propagation, no retry, and source-level local-only restrictions.

The browser v134 suite creates real Playwright downloads from Workflow Review and Decision Gate, reads the resulting JSON files, validates their established schemas, confirms the shared modules were absent at startup and loaded once on demand, and compares browser storage and observer state before and after export.

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts, relax Lighthouse budgets, weaken release consistency, report success before download dispatch, substitute another output after failure, or bypass cross-browser gates to conceal lifecycle, observer, startup-size, metadata-drift, privacy, authority-boundary, or readiness defects. Correct the source contract, loading boundary, payload fixture, executor behavior, or test synchronization instead.
