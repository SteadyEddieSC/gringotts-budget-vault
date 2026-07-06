# Gringotts Budget Vault v92

Navigation Cleanup + Restoration Roadmap.

## Changes

- Keeps the clean runtime architecture: no service worker, no legacy release bridges, no PWA install prompt.
- Reduces mobile top navigation to six primary tabs: Dashboard, Ledger, Planning, Tools, Diagnostics, and Roadmap.
- Groups formerly separate sections into useful lanes:
  - Planning: Cash Flow, Debt/Promo, Briefing/Family Meeting, restore queue.
  - Tools: Safety backup, Import/Restore, Rules inventory, Import Helper/Calendar Prep status, Vault inventory.
- Keeps Diagnostics version-aware and confirms service workers/caches remain gone.
- Updates Roadmap to exactly the next 10 releases: v93 through v102.
- Adds a Lost Functionality Tracker so restored features are visible and planned instead of disappearing silently.

## Test

1. Open `/?clean=92` or `/app.html?clean=92`.
2. Confirm header shows v92 Navigation Cleanup + Restoration Roadmap.
3. Confirm Dashboard still shows 776 transactions.
4. Confirm the top nav has six primary tabs.
5. Open Planning and Tools and confirm summaries appear.
6. Open Diagnostics and confirm runtime self tests pass.
7. Open Roadmap and confirm v93 through v102 plus the Lost Functionality Tracker.
