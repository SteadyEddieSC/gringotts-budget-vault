# Gringotts Budget Vault v103 — Reports & Month Navigator

## Release purpose

v103 restores the most useful reporting ideas from the older Gringotts HTML tool without restoring its service worker, PWA cache, external SheetJS CDN, stacked compatibility scripts, embedded bank packs, or destructive storage controls.

## Shipped

### Shared month navigator

- Previous-month and next-month arrows on Dashboard and Reports.
- Click/tap month control using the browser's native month/year picker.
- Latest button returns to the newest transaction month in the best-populated readable vault.
- The selected report month is shared by the dashboard, executive summary, meeting pack, Family Tracker, and Vault Workbook.
- Empty months are allowed for viewing and reporting but never trigger an empty vault save.

### Executive and family reports

- Dashboard executive-summary paragraph.
- Selected-month income, household spending, transfers, net, pending count, and review warnings.
- Prior-month and year-to-date comparisons.
- Spending by category, top merchants, and owner/account split.
- Family meeting-pack preview with questions, wins, risks, and actions.
- Markdown downloads and browser Print / Save PDF workflow.

### Family Tracker XLSX

One simple Transactions sheet with DATE, TYPE, CATEGORY, AMOUNT, and DESCRIPTION. Transfers are labeled separately from expenses. The report is intentionally simple and spouse-friendly.

### Vault Workbook XLSX

A curated 12-sheet workbook:

1. Executive Summary
2. Transactions
3. Monthly Totals
4. Category Summary
5. Merchant Summary
6. Account Owner Summary
7. Recurring Charges
8. Bills Paydays
9. Calendar Events
10. Rules
11. Review Queue
12. Vault Metadata

### Local XLSX generation

- XLSX files are built entirely in the browser with a bundled OOXML and uncompressed ZIP writer.
- No SheetJS CDN or other external report library is loaded.
- No transaction data is transmitted for report generation.

## Reporting policy

- Income, household spending, and transfers are reported separately.
- Transfers are excluded from household spending.
- Pending rows remain visible and are marked provisional.
- Uncategorized or explicitly unreviewed rows produce report-quality warnings.
- Selected-month coverage and the best-vault source key are included in report context.

## Preserved v102 safety behavior

- Best-populated readable vault selection.
- `gringottsBudgetVault.latest` restore destination.
- Backup-first restore warning.
- Valid populated transaction-array requirement.
- Malformed and zero-transaction JSON rejection.
- Preview, acknowledgment, explicit confirmation, and read-back verification.
- No automatic empty-vault save.
- No service-worker registration, PWA shell, offline cache, fetch, XHR, WebSocket, or transaction upload.
- Rules remain preview/review only for transaction rows.

## Validation completed before release

- JavaScript syntax checks passed for the entry runtime and every helper module.
- Module smoke test loaded the 959-transaction restore vault and selected July 2026.
- Family and Vault XLSX files were generated locally.
- ZIP integrity test passed.
- The 12-sheet Vault Workbook was opened successfully with openpyxl.
- Static scan found no `serviceWorker.register`, `fetch(`, `XMLHttpRequest`, or `WebSocket` calls.

## Browser test checklist

1. Confirm the header reports v103.
2. Confirm Dashboard shows previous, next, native month picker, and Latest controls.
3. Move backward and forward across months, including an empty month.
4. Confirm dashboard totals and Executive Summary change with the month.
5. Open Reports and confirm it retains the same selected month.
6. Download Family Tracker XLSX and confirm its five columns.
7. Download Vault Workbook XLSX and confirm all 12 sheets open.
8. Download Executive Summary Markdown.
9. Download Family Meeting Pack Markdown.
10. Test Print / Save PDF.
11. Confirm Full Backup still downloads the populated best vault.
12. Confirm Import / Restore still blocks malformed and empty JSON.
