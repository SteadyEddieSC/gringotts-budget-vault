# Gringotts Budget Vault v59

## Focus

Modular Cloudflare Pages release.

## Changes

- Broke the app into static repo-friendly files under `src/`, `styles/`, and `icons/`.
- Added Cloudflare Pages checklist directly in the app.
- Added local-first JSON transaction pack import.
- Added mobile review wizard, rule creation, dashboard, ledger search, and local backup export.
- Replaced binary icons with SVG icons so future releases can be pushed by the GitHub connector.
- Added service worker cache `gringotts-budget-vault-v59`.
- Keeps personal exports and backups out of the repo.

## Notes

This is a modular seed release for Cloudflare/GitHub deployment. It intentionally prioritizes maintainability and connector-friendly future updates over carrying forward every experimental v58 panel.
