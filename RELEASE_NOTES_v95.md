# Gringotts Budget Vault v95

Rules III.

## Changes

- Keeps the clean runtime architecture: no service worker, no legacy release bridges, no PWA install prompt.
- Restores rule authoring inside the clean runtime under Tools.
- Rule workflow:
  - Create a rule with name, match text, optional account filter, target category, and target owner.
  - Preview matching transactions before applying.
  - Save rules to the active local vault.
  - Apply saved rules or apply a draft rule.
  - Delete rules.
- Applying a rule updates only `gringottsBudgetVault.latest`; it does not create versioned full-vault copies.
- Rule application stamps matching transactions with category/owner changes plus rule metadata.
- Diagnostics now checks Rules III and reports the saved rule count.
- Roadmap now lists exactly the next 10 releases: v96 through v105.

## Test

1. Open `/?clean=95` or `/app.html?clean=95`.
2. Confirm header shows v95 Rules III.
3. Confirm Dashboard still shows 776 transactions.
4. Download a backup before applying a rule.
5. Open Tools.
6. Create a test rule with match text, category, and owner.
7. Tap Preview rule and confirm sample matches look right.
8. Save the rule.
9. Apply the saved rule only if the preview looks correct.
10. Confirm Ledger search/category reflects the change.
11. Delete the test rule if needed.
12. Open Diagnostics and confirm runtime self-tests pass.
13. Open Roadmap and confirm v96 through v105.
