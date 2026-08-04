# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, or screenshots containing financial data.

## v130 focus

The v130 matrix verifies:

- strict TypeScript performance contracts preserve the existing route, enhancement, observer, action, request, script-byte, destination, and workbook ceilings;
- malformed, negative, or non-finite measurements are rejected;
- Workflow Review route, field, and action handling are owned by the v126 coordinator and dispatcher;
- the active production boot skips the v129 wrapper while retaining a v129 compatibility entry;
- repeated Workflow Review, Roadmap, Diagnostics, and primary-route transitions settle without continued route cycles, enhancement passes, or observer callbacks;
- performance history is memory-only, bounded to 12 samples, and cleared by reload;
- performance evidence does not inspect financial data or write browser storage;
- one live observer remains owned by v126 and no service worker is registered;
- Lighthouse remains capped at 45 requests and 500,000 script bytes;
- the workbook contains exactly 43 sheets;
- v105 rescue, guarded import, separate Full Vault Restore, backup-first broad writes, and immutable close history remain intact.

## Local commands

```bash
npm ci --ignore-scripts
npm run typecheck
npm run test:parser
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, exact-head Cloudflare preview, and production smoke after merge.

Do not extend timeouts to conceal route-lifecycle, observer, action-ownership, mutation-settlement, or readiness defects. Inspect the exact-head artifact and correct the ownership or idempotence failure instead.
