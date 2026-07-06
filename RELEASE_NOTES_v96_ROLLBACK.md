# Gringotts Budget Vault v96 rollback

The live shell was rolled back to the stable v95 runtime after v96 failed to load on the user's device.

Current live shell:

- `index.html` loads `src/runtime-v95.js?v=95rollback1` only.
- `app.html` loads `src/runtime-v95.js?v=95rollback1` only.
- v96 Calendar ICS and roadmap overlay remain in the repo for reference, but are not in the live load path.

Reason:

The v96 overlay approach was too fragile. Future Calendar ICS work should be rebuilt as a full clean runtime release, not a post-load overlay.

Preserve:

- v95 Rules III stable runtime.
- No service worker.
- No legacy bridge stack.
- No PWA install prompt.
- Active vault remains `gringottsBudgetVault.latest`.

Next release guidance:

- Create a full `runtime-v96b` or `runtime-v97` clean runtime by copying stable v95 and adding Calendar ICS directly.
- Keep Executive Summary II on the roadmap.
- Do not use the overlay pattern again for core boot features.
