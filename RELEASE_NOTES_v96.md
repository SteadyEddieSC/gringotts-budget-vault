# Gringotts Budget Vault v96

Calendar ICS + Executive Summary Roadmap.

## Changes

- Keeps the clean runtime architecture: no service worker, no PWA install prompt.
- Adds Calendar ICS export under Tools.
- ICS export pulls from local planning data:
  - Cash-flow bills with due dates.
  - Older bill records with due day fallback.
  - Payday markers.
  - Promo APR end dates.
- Adds Download ICS and Copy ICS text actions.
- Updates the roadmap to exactly the next 10 releases: v97 through v106.
- Captures the requested Executive Summary II restoration on the roadmap:
  - Paragraph-style current month summary.
  - Prior month comparison.
  - Year-to-date totals.
  - Eating-out spend.
  - Greatest category increase.
  - Greatest category decrease.

## Note

v96 intentionally builds on the stable v95 clean runtime and applies a current-version overlay. It does not restore the old legacy service-worker/release-bridge stack.

## Test

1. Open `/?clean=96` or `/app.html?clean=96`.
2. Confirm header shows v96 Calendar ICS + Executive Summary Roadmap.
3. Confirm Dashboard still shows 776 transactions.
4. Open Tools.
5. Confirm Calendar ICS panel appears.
6. Add a bill/payday/promo date in Planning if needed, then download the ICS.
7. Open Roadmap and confirm Executive Summary II is queued.
8. Open Diagnostics and confirm service worker checks remain clean.
