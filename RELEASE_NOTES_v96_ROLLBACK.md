# Gringotts Budget Vault v96 rollback / v94 recovery

The live shell was first rolled back from v96 to v95 after v96 failed to load on the user's device. The v95 rollback still did not recover the page, so the live shell has now been rolled back further to the last user-confirmed good runtime: v94 Import Helper II + Due Date Fix.

Current live shell:

- `index.html` loads `src/runtime-v94.js?v=94recovery1` only.
- `app.html` loads `src/runtime-v94.js?v=94recovery1` only.
- `rescue.html` is a standalone recovery page with inline JavaScript only and no main runtime dependency.
- v95 Rules III and v96 Calendar ICS remain in the repo for reference, but they are not in the live load path.

Reason:

The v96 overlay approach was too fragile because it dynamically loaded and patched v95 after boot. The attempted v95 rollback also did not restore loading on the user's device. Future Calendar ICS and Rules work should be rebuilt as a full clean runtime copied from a confirmed-good runtime, not as stacked overlays or post-load bridges.

Preserve:

- Last confirmed-good v94 runtime.
- No service worker.
- No legacy bridge stack.
- No PWA install prompt.
- Active vault remains `gringottsBudgetVault.latest`.
- Never overwrite populated vault data with empty state.
- Never auto-save empty state to `gringottsBudgetVault.latest`.

Recovery test:

1. Open `/?recovery=94`.
2. Open `/app.html?recovery=94`.
3. Open `/rescue.html`.
4. Confirm the app header shows v94 Import Helper II + Due Date Fix.
5. Confirm the dashboard still shows the populated local vault, expected best-known count: 776 transactions.
6. Use the rescue page to download the best vault JSON before any repair/apply/bulk operation.

Next release guidance:

- Do not move forward to feature work until the user confirms v94 loads again.
- Continue from the confirmed-good v94 runtime, not v95/v96.
- Create future releases by copying the confirmed-good full runtime into a new full runtime file.
- Keep Executive Summary II on the roadmap: current month, last month, comparison, year-to-date totals, eating-out spend, category with greatest increase, and category with greatest decrease.
- Keep Calendar ICS on the roadmap, but rebuild it as a clean full runtime release, not an overlay.
- Put Rules III / Rules IV later in the roadmap after stable rebuild and release gates.
- Keep Export Center, Debug II, and PWA Rebuild Review on the roadmap.
