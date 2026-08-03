# v129 Security Review — Household Workflow Evidence Review

## Security objective

Add useful workflow evidence without creating telemetry, collecting household financial data, or expanding the live trust boundary. Cloudflare continues to serve static application assets only.

## Threat boundary

Workflow Review must not become a hidden analytics or support-data channel. The release therefore prohibits:

- automatic click, route, timing, usage, abandonment, or error-history collection;
- browser fingerprinting or performance beacons;
- vault, transaction, balance, account, merchant, report, provider-token, or portable-package inspection;
- browser persistence, cookies, service workers, background sync, or remote storage;
- upload or proxying through Cloudflare or another Gringotts-controlled endpoint.

## Review-state model

Review state exists in a module-memory `Map` for the current tab only. Reloading the page creates a new module instance and clears the review. No migration, recovery, or synchronization contract is needed because the state is intentionally ephemeral.

This design means an incomplete review can be lost on reload. That is deliberate: persistence would create another data store and require schema, migration, cap, recovery, and privacy contracts. The user must explicitly download a local review bundle to retain the result.

## Data minimization

The inventory contains workflow metadata only. Structured observations contain:

- workflow identifier;
- usage;
- friction;
- outcome;
- observed signal;
- disposition;
- optional workflow-only note.

The optional note is limited to 240 characters and rejects likely:

- currency amounts;
- four-or-more digit identifiers;
- email addresses;
- account, routing, card, or transaction numbers;
- card-network names;
- merchant or balance labels followed by detail.

This is a defense-in-depth filter, not a general data-loss-prevention system. The UI also warns the user not to enter private financial or contact information.

## Export boundary

The JSON bundle is created only after explicit user action. It declares:

- manual review only;
- automatic telemetry disabled;
- financial data not included;
- persistent storage not used;
- remote transmission disabled.

The bundle is downloaded through a browser Blob URL. Copy Summary uses the user-invoked clipboard API. Neither action sends data to a network endpoint.

## Runtime and performance

- v126 remains the only route coordinator and owner of the live enhancement observer.
- v126 remains the specialist action dispatcher.
- v127 remains the interaction and accessibility policy.
- v128 remains the typed portable-vault foundation.
- v129 registers event handlers but creates no second runtime owner or observer.
- the model is lazy-loaded only when Workflow Review is opened;
- v106 and v107 styles are consolidated into one request so the v129 bootstrap keeps the existing startup request ceiling.

## Decision boundaries

The summary identifies evidence candidates only. It does not remove, hide, merge, demote, or approve a workflow automatically. A recorded `remove` or `consolidate` disposition is an observation requiring later human review.

## Residual risks

- A user could still enter sensitive prose that does not match the bounded rejection patterns.
- A downloaded review bundle is an ordinary local JSON file and is not encrypted.
- Clipboard contents are controlled by the operating system after the user copies them.
- Ephemeral review state can be lost before export.
- Structured review remains subjective and does not prove frequency through telemetry.

These risks are preferable to silently collecting household activity. Future persistence or collaboration would require a separate threat model and release.

## Decision

v129 is acceptable for promotion only after exact-head tests prove that the workspace does not read the vault, write browser storage, issue network writes, persist across reload, or export prohibited data fields, and after all inherited browser, accessibility, performance, privacy, supply-chain, and CodeQL gates pass.
