# Testing Gringotts Budget Vault

All automated data is synthetic. Do not commit real bank exports, vault backups, planning metadata, filled workbooks, generated household reports, or screenshots containing financial data.

## v125 focus

The v125 matrix verifies:

- closed-month totals come from immutable close snapshots;
- open months use posted rows and exclude pending rows;
- income, recurring expense, variable expense, transfers, and operating net remain distinct;
- aggregate drivers are ranked without causation claims;
- close revisions and reopen events remain visible;
- snapshot/current coverage mismatch lowers confidence without rewriting history;
- JSON and workbook output remain aggregate-only;
- Guided Plan, Reports, Family Meeting Markdown, and Guided Plan Markdown include trend context;
- the workbook contains exactly 43 sheets;
- route enhancement, download ownership, observers, and rendering remain idempotent;
- v105 rescue, guarded import, and separate Full Vault Restore remain intact.

## Local commands

```bash
npm run test:parser
npm ci --ignore-scripts
npx playwright install chromium
npm run test:preflight
npm run test:quality
```

The protected matrix additionally runs desktop Firefox and WebKit, Android Chromium, iPad WebKit, iPhone WebKit, Lighthouse, privacy and secret scans, dependency review, npm audit, supply-chain checks, CodeQL, Cloudflare preview, and production smoke.

Do not extend timeouts to conceal route-lifecycle, observer, action-ownership, or readiness defects.
