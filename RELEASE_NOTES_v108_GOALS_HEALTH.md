# Gringotts Budget Vault v108 — Goals & Vault Health

## Release purpose

v108 adds goals, sinking funds, and an explainable Vault Health score while correcting the two remaining v107 interface findings:

- the selected-month toolbar remained too large on desktop;
- Review Queue category, owner, and account controls behaved like type-in fields instead of normal dropdowns.

The v107 persistent-shell and parsed-vault performance improvements remain in place.

## Desktop and mobile month toolbar

The selected-month control is now forced into a compact flex toolbar instead of inheriting the older full-width grid behavior.

Desktop displays:

- Previous;
- a fixed-width selected month;
- Next;
- Latest;
- transaction count.

The toolbar uses only the width its controls require. It no longer stretches the month field across the entire Dashboard or Reports page.

On phone and tablet:

- the same controls remain compact;
- the selected month flexes to use available space;
- transaction count moves to its own line when needed;
- the native month/year picker remains directly tappable.

## Normal Review Queue dropdowns

Review Queue now uses native `<select>` controls for:

- Category;
- Owner;
- Account.

Options are built from existing values in the current vault, with the current value preserved even when it is uncommon. Owner and account also support an explicit unassigned/blank choice.

Rule suggestions continue to work. When a suggestion is not already in the category list, the runtime adds it as a selectable option before choosing it.

## Money → Goals & Health

The existing Money destination now has three secondary sections:

1. Budget & Recurring
2. Bills & Paydays
3. Goals & Health

No new permanent top-level destination was added.

## Goals and sinking funds

Goal records are stored separately under `gringottsGoals.v1` and do not alter transaction history.

Each active goal supports:

- name;
- goal type;
- target amount;
- current funded or payoff amount;
- planned monthly contribution;
- target date;
- notes;
- manual contribution updates;
- editing;
- archiving;
- confirmed permanent deletion.

Goal progress displays funded amount, remaining amount, percentage complete, and a progress bar.

## Vault Health

Vault Health is an explainable household-data readiness score, not a credit score or financial rating.

The score begins at 100 and shows each deduction. Current factors include:

- no populated readable vault;
- no selected-month transactions;
- selected-month Review Queue count;
- pending transactions;
- missing category budgets;
- over-budget categories;
- unresolved recurring candidates;
- recurring amount-change alerts;
- no active goal or sinking fund.

The page presents:

- score;
- status label: Strong, Healthy, Needs attention, or At risk;
- each deduction and point value;
- specific recommended next actions;
- selected-month facts supporting the score.

## Health history

Health history is not written automatically when the page opens.

Selecting **Save Snapshot** stores an explicit local snapshot under `gringottsVaultHealthHistory.v1`, including:

- capture time;
- selected month;
- score and status;
- vault transaction count;
- selected-month transaction count;
- Review Queue count;
- pending count;
- active-goal count.

The latest 60 snapshots are retained locally and the most recent 12 are shown in the interface.

## Expanded Vault Workbook

The deeper workbook expands from 17 to 20 sheets by adding:

1. Goals
2. Vault Health
3. Health History

The spouse-facing annual tracker remains a separate preferred report and is unchanged.

## Preserved capabilities

- fast persistent-shell navigation;
- parsed-vault cache with verified invalidation;
- Activity → Review Queue;
- backup-first transaction editing;
- category budgets and recurring intelligence;
- Calendar and cash-flow planning;
- preferred annual household tracker;
- guarded JSON restore;
- boot-safe startup and exact error display;
- stable v105 rescue page;
- no service worker or offline cache;
- no automatic empty-vault save.

## Architecture and privacy

- Transaction data remains browser-local.
- Goal data remains in a separate browser-local settings key.
- Health snapshots are explicit user actions.
- Workbook creation remains local.
- No transaction, goal, or health data is uploaded.

## Validation completed

- Both production shells load `styles/v108.css` and `src/boot-v108.js?v=108boot1`.
- The boot loader imports `runtime-v108-goals-health.js?v=108goalshealth1` and retains the stable rescue link.
- The runtime imports all v108 view, goal, health, review, report, restore, calendar, and budget functions from named exports.
- The desktop month toolbar uses an explicit flex override with max-content width.
- Review Queue uses native select elements rather than datalist text inputs.
- The goal engine writes only separate goal and health-history settings keys.
- Health snapshots are saved only through the Save Snapshot action.
- The deeper workbook exporter is bound to the 20-sheet v108 export.
- The roadmap was advanced to v109 Import Memory & Duplicate Guard.

## Browser test checklist

1. Confirm the header shows v108.
2. On desktop, confirm the month toolbar occupies only a compact area instead of spanning the page.
3. Test Previous, selected month picker, Next, and Latest on desktop and phone.
4. Confirm menu navigation remains as fast as v107.
5. Open Activity → Review Queue.
6. Confirm Category, Owner, and Account open as normal dropdowns.
7. Confirm Save Progress and Save & Mark Reviewed still work.
8. Open Money and switch among all three secondary sections.
9. Add a goal with a target amount.
10. Add a contribution and confirm funded, remaining, percentage, and progress update.
11. Edit the goal.
12. Archive a goal.
13. Test permanent deletion only with a disposable test goal.
14. Review Vault Health deductions and recommended actions.
15. Select Save Snapshot and confirm a history row appears.
16. Change month and confirm the health score uses the selected month.
17. Download the deeper Vault Workbook and confirm it contains 20 sheets.
18. Confirm the preferred annual tracker still fills and downloads.
19. Confirm backup, Import/Restore, Calendar, Reports, Activity, and Tools remain functional.
20. Check phone portrait, phone landscape, tablet, laptop, and desktop layouts.
