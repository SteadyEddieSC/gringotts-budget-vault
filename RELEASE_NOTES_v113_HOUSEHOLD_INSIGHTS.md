# v113 — Household Insights IV

## Release purpose

v113 adds explainable, read-only household financial insights without adding a new top-level destination or changing transaction data.

The release is built on the verified v112 accessibility and quality gates and preserves the existing v111 reporting runtime underneath a single v113 boot entry.

## Activity → Insights

A fourth Activity subsection now provides:

- unusual-spending signals;
- recurring-cost review opportunities;
- household decision prompts;
- visible comparison periods and methods;
- expandable source-transaction evidence;
- explicit confirmation that no automatic writes or remote processing occurred.

The six primary destinations remain Dashboard, Money, Calendar, Reports, Activity, and Tools.

## Explainable unusual-spending review

### Merchant amount spikes

A current posted expense is compared with the median of earlier charges from the same normalized merchant during the preceding 180 days.

A signal requires:

- at least two earlier charges;
- a current amount of at least $25;
- an increase of at least $20;
- a current amount at least 1.5 times the earlier median.

The signal shows the current amount, baseline amount, factor, baseline-row count, method, and source transaction.

### Category increases

Selected-period category spending is compared with the immediately preceding period of equal length.

A signal requires:

- a non-zero comparison-period baseline;
- an increase of at least $50;
- selected-period spending at least 1.35 times the baseline.

### Large first-seen merchants

A merchant with no earlier normalized-merchant charge in the 180-day history window can be flagged when its amount exceeds the larger of:

- $100; or
- 1.75 times the median posted expense in the selected period.

This is presented as a review prompt, not a fraud determination.

### Pending transactions

Pending rows are counted and displayed as provisional, but they are excluded from merchant and category comparisons.

## Recurring-cost opportunities

The existing local recurring-pattern model now feeds explainable review summaries:

- latest versus previous amount changes;
- approximate annualized increases for monthly patterns;
- approximate annual footprint based on historical average;
- unresolved candidate patterns that should be confirmed or excluded;
- a household decision question for each item.

Annual figures are simple discussion aids, not promised savings or forecasts.

## Reports and downloads

The Reports Center now includes a seventh printable Household Insights page.

Insight questions and higher-attention signals also feed the family meeting brief.

The Vault Workbook expands from 28 to 30 sheets:

1. Household Insights;
2. Recurring Opportunities.

v113 also corrects release names on locally generated:

- Vault Workbook XLSX;
- family meeting Markdown;
- full-vault backups;
- calendar ICS files;
- rules-review JSON;
- diagnostics JSON.

The underlying report and backup generators remain local and unchanged; a small capture-phase v113 export layer supplies the correct filenames and two additional workbook sheets without copying the application runtime.

## Privacy and write boundaries

Viewing or generating insights does not:

- change transaction rows;
- change categories;
- change budgets;
- change rules;
- change recurring statuses;
- change account or owner assignments;
- create a new browser-storage key;
- upload transactions or insight results;
- call a remote parser, analytics endpoint, or AI service.

## Accessibility and responsive behavior

The Insights activity surface and printable report are included in:

- axe accessibility scans;
- keyboard tab semantics;
- keyboard-accessible scroll regions;
- desktop Chromium, Firefox, and WebKit regression tests;
- iPad, Android-phone, and iPhone/WebKit responsive tests;
- privacy-safe report layout contracts;
- Lighthouse quality budgets.

## Synthetic test coverage

The test suite constructs fictional rows for:

- a merchant spike;
- a category increase;
- a large first-seen merchant;
- a recurring amount increase;
- a large pending transaction that must not become an anomaly signal.

Tests verify:

- visible methods and source evidence;
- no localStorage changes from viewing insights;
- no network writes;
- Activity and Reports integration;
- 30-sheet v113 workbook naming;
- v113 meeting-pack naming;
- seven print pages;
- viewport containment across configured devices.

## Future bank imports

`BANK_IMPORT_ROADMAP.md` and `ROADMAP.md` reserve v115 for Bank Export Import & Mapping.

Planned first-class formats are CSV/delimited files, OFX, QFX, and QBO. The future implementation requires format and schema detection, explicit mapping preview, amount-sign validation, duplicate review, backup-first writes, confirmation, and read-back verification.

## Preserved safeguards

v113 preserves:

- `gringottsBudgetVault.latest` as the restore destination;
- best-populated-readable-vault selection;
- preview, acknowledgement, confirmation, and read-back restore verification;
- backup-first verified broad transaction writes;
- v109 duplicate and overlap review;
- v110 month close, forecast, and debt planning;
- v111 custom-range and prior-year reporting;
- v112 accessibility and quality gates;
- `rescue-v105.html`;
- no service worker, PWA cache, bridge runtime, stacked runtime, or transaction upload.
