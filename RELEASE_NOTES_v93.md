# Gringotts Budget Vault v93

Restore Editing Workflows.

## Changes

- Keeps the clean runtime architecture: no service worker, no legacy release bridges, no PWA install prompt.
- Restores editable planning data in the clean runtime:
  - Manual cash-flow bills: add/delete.
  - Payday markers: add/delete.
  - Debt planner entries: add/delete.
  - Extra monthly payoff amount: edit/save.
  - Promo APR entries: add/delete with promo end date and APR fields.
  - Family meeting decisions: add/delete.
  - Family meeting actions: add, done/undo, delete.
  - Copy/download meeting pack Markdown.
- Continues writing only to small feature keys, not new full transaction-vault copies.
- Updates Roadmap to exactly the next 10 releases: v94 through v103.
- Updates restoration tracker: restored items are listed separately from still-queued items.

## Test

1. Open `/?clean=93` or `/app.html?clean=93`.
2. Confirm header shows v93 Restore Editing Workflows.
3. Confirm Dashboard still shows 776 transactions.
4. Open Planning.
5. Add and delete a test bill.
6. Add and delete a test payday.
7. Add and delete a test debt or promo item.
8. Add a meeting decision/action; test done/undo; copy the meeting pack.
9. Open Diagnostics and confirm runtime self tests still pass.
10. Open Roadmap and confirm v94 through v103 plus restored/queued trackers.
