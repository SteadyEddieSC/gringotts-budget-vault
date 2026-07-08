# Gringotts Budget Vault v107 — Review Queue & Performance

## Release purpose

v107 addresses the two live usability findings from v106.2 while delivering Review Queue II:

- the phone month selector consumed too much vertical space;
- moving between menus felt slow because the entire application shell and the full vault were repeatedly rebuilt and reparsed.

## Compact phone month control

The month navigator now uses a compact selected-month control instead of the oversized full-width mobile picker layout.

It retains:

- Previous month;
- native month/year picker;
- Next month;
- Latest;
- selected-month transaction count.

The native input remains available as an invisible direct-touch target over the selected month, so current mobile browsers can still open their native month/year interface.

## Navigation and rendering performance

The runtime now keeps the header and primary navigation mounted while only the main content area changes.

Performance changes include:

- persistent application shell;
- primary navigation listeners attached once;
- main-content-only rendering;
- requestAnimationFrame coalescing so rapid actions do not trigger redundant renders;
- ledger search debounce;
- render-token protection against stale asynchronous page updates;
- last render time included in exported diagnostics.

## Parsed-vault cache

The prior core reparsed every `gringottsBudgetVault.*` localStorage value whenever a page requested transactions, metrics, categories, merchants, or reports. A page could therefore parse the same large vault many times during one render.

v107 adds:

- a shared parsed-vault cache;
- explicit cache invalidation after vault writes;
- automatic invalidation when the shared `save()` helper writes a vault key;
- verified invalidation after Review Queue transaction updates.

This changes runtime performance only; it does not change vault selection or transaction interpretation.

## Activity → Review Queue

Activity now contains:

1. Transactions
2. Review Queue
3. Rules

The Review Queue is scoped to the currently selected month and includes rows that are:

- explicitly not reviewed;
- categorized as Other or Uncategorized;
- missing a useful category;
- marked `review_required` by a source.

## Mobile-first transaction review

The review workspace provides:

- one transaction at a time;
- Previous and Next controls;
- merchant, date, flow, and amount context;
- a plain-language explanation of why the row is queued;
- category, owner, account, and notes fields;
- category/account/owner suggestions from existing vault values;
- first-match rule suggestions;
- Save Progress;
- Save & Mark Reviewed.

A transaction cannot be marked reviewed while its category is blank, Other, or Uncategorized.

## Backup-first editing

Review editing starts locked.

Selecting **Enable Safe Editing**:

- downloads a complete JSON backup of the current best-populated vault;
- attempts to store a local recovery snapshot under `gringottsReviewRecovery.v1`;
- ties the editing session to the current vault key;
- does not enable edits if no populated vault is available.

Each save:

- clones the populated vault;
- edits only the selected transaction row;
- blocks an empty prepared vault;
- writes to the currently selected best-vault key;
- verifies the stored transaction count;
- invalidates the parsed-vault cache only after verification.

## Guarded batch action

The batch action marks only queued rows that already have a specific category as reviewed.

It does not change:

- category;
- amount;
- merchant;
- transaction date;
- transaction order.

It requires safe editing to be enabled and a separate confirmation dialog.

## Preserved capabilities

- v106.2 boot-safe startup and exact error display;
- stable v105 rescue page;
- consolidated six-destination navigation;
- budgets and recurring intelligence;
- calendar and cash-flow planning;
- preferred annual household tracker;
- expanded 17-sheet Vault Workbook;
- guarded JSON restore;
- local-only processing;
- no service worker or offline cache;
- no automatic empty-vault save.

## Validation completed

- New v107 core, review, view, runtime, boot, and CSS files passed JavaScript syntax checks before publication.
- The v107 runtime imports `reportsView` through the corrected v106.2 export path.
- The Review Queue imports the new `invalidateVaultCache` core export.
- Both production shells load `styles/v107.css` and `src/boot-v107.js?v=107boot1`.
- The boot loader imports `runtime-v107-review-performance.js?v=107reviewperf1`.
- Production retains the stable v105 rescue path.

## Browser test checklist

1. Confirm the header shows v107.
2. On phone, confirm the month control is one compact row rather than the previous large selector block.
3. Test Previous, selected month picker, Next, and Latest.
4. Move repeatedly among Dashboard, Money, Calendar, Reports, Activity, and Tools and compare responsiveness with v106.2.
5. Confirm the Menu button still works on phone and tablet.
6. Open Activity and switch among Transactions, Review Queue, and Rules.
7. Confirm Review Queue shows the selected month and a queue position.
8. Select Previous and Next without enabling editing.
9. Select Enable Safe Editing and confirm a JSON backup downloads.
10. Use a rule suggestion where one is available.
11. Save Progress and confirm the row remains queued.
12. Save & Mark Reviewed with a specific category and confirm the row leaves the queue.
13. Confirm Other or Uncategorized cannot be marked reviewed.
14. Test the categorized-only batch action and review its confirmation text.
15. Confirm Dashboard totals and Reports reflect saved category changes.
16. Confirm the annual tracker and 17-sheet Vault Workbook still download.
17. Confirm Import/Restore and Exports & Backup still work.
18. Check phone portrait, phone landscape, tablet, laptop, and desktop layouts.
