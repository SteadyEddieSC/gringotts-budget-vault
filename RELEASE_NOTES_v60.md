# Gringotts Budget Vault v60

## Focus

Differential Pull Studio.

## Changes

- Added a new Diff Pull tab for previewing a new full-history JSON pull before merging.
- Added incoming row comparison against the current local vault.
- Buckets incoming rows into new rows, exact duplicates, changed same-ID rows, possible duplicates, and current rows missing from incoming.
- Added Import new rows only.
- Added Merge all incoming rows.
- Updated app shell, state key, manifest, and service worker cache to v60.
- Preserves the local-first privacy model: GitHub and Cloudflare host the app code only, not the household data.

## Testing notes

Static code was pushed through GitHub. Cloudflare Pages should deploy from `main` automatically. After deployment, use the app's Check app update button or reload the installed PWA to pick up v60.
