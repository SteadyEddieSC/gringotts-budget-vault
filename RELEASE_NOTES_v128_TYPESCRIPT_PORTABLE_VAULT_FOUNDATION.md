# v128 — TypeScript & Portable Vault Foundation

## Summary

v128 begins the post-feature-growth architecture transition without rewriting Gringotts or changing its static Cloudflare deployment. It adds strict TypeScript contracts and a provider-neutral portable-vault package core while keeping household financial data on the current device.

## TypeScript foundation

- pins TypeScript 5.9.2 in the lockfile;
- runs strict, no-emit typechecking in the protected parser preflight;
- defines typed contracts for JSON-safe data, transactions, the authoritative vault, manifests, integrity records, backup receipts, and future storage adapters;
- keeps deployed output as ordinary static HTML, CSS, and JavaScript;
- introduces no framework, server, second runtime, or build-time dependency in the browser.

## Portable vault foundation

The provider-neutral `.gringotts` foundation includes:

- format and schema version 1;
- exact source release and creation timestamp;
- authoritative destination key `gringottsBudgetVault.latest`;
- transaction count;
- deterministic sorted-key JSON canonicalization;
- SHA-256 payload integrity;
- explicit device-local privacy metadata;
- stable provider-neutral filenames.

The package core can create, serialize, parse, and validate a populated vault. It rejects:

- empty transaction arrays;
- unsupported format or schema versions;
- non-authoritative destination keys;
- count mismatches;
- malformed JSON values;
- integrity mismatches and modified payloads.

## Deliberate boundary

v128 is an integrity and architecture foundation, not the final backup experience.

It does not add:

- encryption or passphrase handling;
- Open, Save As, Backup, or Restore UI for `.gringotts` files;
- Google Drive, OneDrive, Dropbox, iCloud, WebDAV, or other provider connections;
- OAuth tokens or persistent cloud sessions;
- background upload, automatic sync, conflict resolution, or newest-copy-wins behavior;
- Pages Functions, Workers, KV, D1, R2, analytics, remote parsing, or another backend.

Those capabilities require later, separately reviewed releases after the package contract is proven.

## Preserved product boundaries

- v126 remains the only live route coordinator and action dispatcher.
- v127 remains the retained UX policy and presentation owner.
- The application retains six primary destinations.
- The Vault Workbook remains capped at 43 sheets.
- Existing v126-owned export filenames remain unchanged.
- `gringottsBudgetVault.latest` remains the only authoritative transaction-copy domain.
- Guarded import, separate Full Vault Restore, immutable close history, empty-vault protection, and stable v105 rescue remain unchanged.

## Validation

Promotion requires the exact final head to pass:

- strict TypeScript typechecking;
- browser-free package round-trip, canonicalization, corruption, schema, empty-vault, and authority-boundary contracts;
- Chromium, Firefox, desktop WebKit, Android Chromium, iPad WebKit, and iPhone WebKit;
- keyboard, visual, axe, and Lighthouse gates with the existing 45-request ceiling;
- public-repository security and full-history privacy scanning;
- dependency review, npm audit, supply-chain checks, and CodeQL;
- exact-head Cloudflare preview and unresolved-thread verification.
