## Summary

Describe the user-visible change and the affected release or infrastructure area.

## Privacy and data safety

- [ ] No real transaction, backup, screenshot, account, routing, medical, employment, or benefits data is included.
- [ ] Test data is fictional and stored only under approved test fixtures.
- [ ] The change does not add a transaction-upload path.
- [ ] The change does not register a service worker or offline cache.
- [ ] Empty-vault overwrite and backup-first safeguards remain intact.

## Validation

- [ ] Playwright desktop checks pass.
- [ ] Playwright responsive checks pass.
- [ ] Full-history privacy scan passes.
- [ ] Gitleaks passes.
- [ ] CodeQL completes without a release-blocking finding.
- [ ] Manual checks not covered by automation are listed below.

## Manual checks

List only checks that cannot be automated for this change.
