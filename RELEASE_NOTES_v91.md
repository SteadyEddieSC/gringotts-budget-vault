# Gringotts Budget Vault v91

Clean Runtime Patch.

Fixes the v90 Diagnostics tab bug caused by shadowing the browser CacheStorage API. Restores more of the old app structure in the clean runtime: Rules, Debt, Briefing, Safety, Import/Restore, Diagnostics, Roadmap, Dashboard, Ledger, and Cash Flow summary.

Still no service worker and no legacy release bridges.

Test: open `/?clean=91` or `/app.html?clean=91`, confirm v91 appears, open Diagnostics, confirm it renders, and confirm best/active vault still show 776 transactions.
