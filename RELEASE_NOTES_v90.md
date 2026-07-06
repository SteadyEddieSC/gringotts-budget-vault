# Gringotts Budget Vault v90

Clean Runtime Shell.

This release replaces the root app shell with a clean runtime that loads only `src/runtime-v90.js`. It does not load the legacy release bridges, old self-test panels, PWA bootstrap, or service-worker registration code.

Key points:

- Reads the best local vault, preferring populated localStorage keys.
- Uses `gringottsBudgetVault.latest` as the restore/write target.
- Does not create versioned full-vault copies.
- Does not register a service worker.
- Unregisters existing service workers on boot if the browser still has any.
- Provides Dashboard, Ledger, Cash Flow summary, Import/Restore, Diagnostics, Roadmap, Backup, and Debug report.
- Roadmap is exactly the next 10 releases, v91 through v100.

Test:

1. Open `/?clean=90` or `/app.html?clean=90`.
2. Confirm v90 Clean Runtime Shell appears.
3. Confirm 776 active transactions.
4. Open Diagnostics and confirm service workers 0, controller no, and no Gringotts caches.
5. Confirm Roadmap lists v91 through v100.
