# v128 Security Review — TypeScript & Portable Vault Foundation

## Security objective

Establish typed data and portable-package contracts without expanding the live trust boundary. Cloudflare continues to serve static application assets only. The v128 package core operates in memory and has no network, browser-storage, cloud-provider, encryption-key, or OAuth implementation.

## Data boundary

Protected financial data includes vault contents, transaction rows, reports, backups, future encryption material, and future provider tokens.

v128 requires that:

- those values are not sent to Gringotts, Cloudflare, or another remote endpoint;
- `gringottsBudgetVault.latest` remains the only authoritative transaction-copy storage key;
- package creation does not write browser storage;
- validation does not import, restore, migrate, or replace data;
- external-provider adapters remain interfaces only and are disabled in the live release.

## Integrity model

Portable packages use deterministic sorted-key JSON canonicalization and SHA-256 over the canonical vault payload. Validation verifies the declared transaction count and digest before returning a valid package.

SHA-256 integrity detects accidental or deliberate modification. It does not provide confidentiality or authentication of the person who created the file. The manifest therefore declares `encryption: none-foundation-only`, and the live release reports `encryptionReady: false`.

No user should treat an unencrypted v128 foundation package as suitable for cloud storage. Encryption and passphrase UX require a later threat review and release.

## Rejection boundaries

The package core rejects:

- empty transaction arrays;
- non-authoritative destination keys;
- malformed or non-JSON-safe values;
- non-finite numbers and undefined values;
- unsupported package or schema versions;
- invalid timestamps or release identifiers;
- count mismatches;
- malformed integrity metadata;
- payload digest mismatches;
- privacy manifests that claim network or cloud storage.

## Runtime and deployment

- v126 remains the only route coordinator and owner of the enhancement `MutationObserver`.
- v126 remains the specialist action dispatcher.
- v127 interaction and accessibility behavior is retained inside the consolidated v128 bootstrap.
- v128 adds no service worker, persistent cache, Pages Function, Worker, KV, D1, R2, server, second runtime, or additional observer.
- The production shells load one v128 bootstrap in place of the v127 bootstrap so the 45-request ceiling is not increased.

## Supply-chain change

TypeScript 5.9.2 is pinned exactly in `package-lock.json` and used only for strict no-emit validation. Runtime users do not download the TypeScript compiler from Cloudflare.

Dependency Review, high/critical npm audit, CodeQL, pinned GitHub Actions, and full-history privacy/secret scanning remain required.

## Future adapter constraints

A future cloud or device-file adapter must be separately reviewed and must:

- operate only after explicit user action;
- encrypt before external upload;
- never proxy vault bytes or OAuth tokens through Cloudflare;
- use least-privilege provider permissions;
- verify the saved copy;
- avoid silent sync and newest-copy-wins replacement;
- compare local and selected copies before restore;
- preserve a populated current-vault backup before replacement;
- remain optional and lazy-loaded.

## Residual risks

- A local `.gringotts` foundation package is readable because encryption is intentionally not implemented yet.
- SHA-256 proves payload consistency, not who created the package.
- Browser-origin storage remains subject to browser clearing, device loss, and user profile loss.
- TypeScript improves development-time correctness but does not replace runtime validation.
- Long-lived schema migration, encrypted file UX, direct device-file saving, and cloud adapters remain unfinished by design.

## Decision

v128 is acceptable for promotion only as a non-user-facing portability foundation after all exact-head protected gates pass. It must not be represented as encrypted cloud backup or automatic recovery functionality.
