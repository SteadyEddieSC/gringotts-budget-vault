# v126 Security Review

## Change boundary

v126 is a runtime-ownership and reliability release. It does not add transaction parsing, a financial institution connection, a remote service, a service worker, a new storage domain, or an automatic financial action.

## Trusted data boundary

- Household transaction data remains browser-local.
- `gringottsBudgetVault.latest` remains the authoritative full-vault destination and the only inventoried domain that may contain transaction copies.
- Specialist planning, receipt, profile, cleanup, recurring, scenario, and report stores remain metadata-only or aggregate-only under their existing caps.
- Immutable close snapshots remain historical evidence and are not silently recomputed.

## Coordinator and dispatcher review

- The coordinator observes the existing `#main` route container only.
- It runs a fixed, locally registered enhancer list and performs no dynamic code download.
- Enhancement passes are bounded.
- Failure state is visible and retry is explicit.
- The dispatcher supports only `click`, `change`, and `input` capture actions.
- Handler names are unique and ordered by explicit numeric priority.
- Current v126 downloads outrank inherited release download handlers, preventing duplicate current-release exports.
- Historical listeners that call `stopImmediatePropagation` retain equivalent dispatcher stop behavior.

## Legacy adapter review

During controlled activation only, v126 temporarily:

- redirects historical document-level specialist listeners into the dispatcher;
- replaces historical observer construction with a no-op observer shim;
- restores the original document listener function and global `MutationObserver` immediately after activation.

The adapter does not alter storage, fetch remote content, or intercept unrelated event types.

## Recovery review

- Route-enhancement failure does not clear or overwrite storage.
- The base rendered route remains present.
- The user can retry enhancement explicitly.
- Stable v105 rescue remains available.
- Full Vault Restore and bank import retain their existing independent acknowledgement, backup, rollback, and read-back controls.

## Negative assertions

v126 contains no `fetch`, `XMLHttpRequest`, `sendBeacon`, or `WebSocket` runtime use; no credential collection; no analytics; no remote parser; no service worker registration; no automatic transaction, payment, transfer, account, debt, goal, scenario, recurring-decision, close, or merchant action.
