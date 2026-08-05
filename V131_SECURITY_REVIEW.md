# v131 Security Review — Observed Needs Decision Gate

## Scope

This review covers the v131 Decision Gate model, local file intake, route-lazy UI, retained v130 runtime-evidence contract, local decision-record export, production bootstrap, and associated tests and documentation.

## Security conclusion

v131 does not expand the household-finance attack surface. It adds a manual, session-only governance workflow that reads one explicitly selected privacy-filtered review file and the published in-memory runtime snapshot. It introduces no backend, remote endpoint, provider token, persistent store, service worker, financial schema, automatic financial action, or additional observer.

## Assets protected

- authoritative browser-local vault and transaction rows;
- account, balance, merchant, report, credential, and portable-vault data;
- guarded import and separate restore boundaries;
- immutable close history and backup-first broad writes;
- runtime ownership, performance ceilings, and route stability;
- user intent around product-scope decisions.

## Trust boundaries

### Local workflow-review file

The file is untrusted input. v131:

- requires JSON selected through an explicit local file action;
- limits the file to 1 MB;
- validates review kind, version, inventory version, and privacy declarations;
- rejects duplicate and unknown workflow IDs;
- revalidates every structured observation;
- recomputes the summary and rejects inconsistent claims;
- relies on the inherited v129 note sanitizer to reject likely sensitive financial or contact details;
- keeps the accepted bundle in module memory only.

The file is never uploaded or written into the authoritative vault.

### Runtime snapshot

The gate consumes only `window.GringottsV130.snapshot()` and the published v130 evaluator. It does not reach into the vault or inherited financial models. A missing, malformed, unhealthy, or incomplete runtime snapshot blocks the decision gate instead of weakening the requirement.

### Decision rationale

Rationale is limited to 320 normalized characters and rejects likely:

- currency amounts;
- long numeric identifiers;
- email addresses;
- account, routing, card, or transaction identifiers;
- named card-network indicators;
- merchant or balance fields.

Rationale remains in memory until an explicit local copy or download.

## Authority controls

The gate is closed by default. It performs no automatic disposition.

- incomplete review evidence cannot authorize maintenance or a proposal;
- unhealthy runtime evidence blocks all dispositions;
- maintenance-only requires recorded friction or consolidation evidence and rationale;
- candidate-proposal requires an unmet-need or unclear-outcome signal and rationale;
- candidate-proposal explicitly permits writing one later proposal only;
- no state approves code, changes a roadmap automatically, opens an issue, performs a write, or changes financial data.

## Data-flow review

### Reads

- user-selected local workflow-review JSON;
- v130 in-memory runtime snapshot and evaluator output;
- static workflow labels.

### Writes

- module-memory review, disposition, rationale, and derived result;
- explicit local Blob download;
- explicit clipboard write when the user requests it;
- DOM rendering and accessibility announcements.

### Prohibited and absent

- `fetch`, XHR, WebSocket, beacon, analytics, or remote logging;
- localStorage, sessionStorage, IndexedDB, cookies, Cache API, or service-worker storage;
- vault, transaction, balance, account, merchant, report, credential, or portable-vault access;
- automatic export or background synchronization.

## Runtime and supply-chain review

- the active v131 boot statically imports v128 only;
- v129 and v131 integrations load after Tools opens;
- Decision Gate UI and contracts load only after Decision Gate opens;
- v126 remains the sole coordinator, dispatcher, and live observer owner;
- registered actions remain subject to the existing cap of 40;
- startup remains subject to 45 requests and 500,000 script bytes;
- dependencies remain pinned and unchanged;
- no new third-party runtime library is introduced.

## Export review

Decision records contain only:

- release and timestamp metadata;
- explicit disposition and sanitized rationale;
- aggregate workflow identifiers by evidence category;
- complete/inventory counts and runtime pass status;
- privacy and no-automatic-approval declarations.

They exclude raw observations, financial rows, accounts, balances, merchants, credentials, and portable-vault bytes.

## Residual risks and mitigations

### User imports a fabricated workflow review

The application can validate structure and internal consistency, not whether a person observed the workflow honestly. The UI labels the process as manual evidence and never treats the result as automatic approval.

### Clipboard or downloaded record is shared externally

Copy and download are explicit user actions. Records are sanitized and contain no financial data by contract, but users remain responsible for external sharing.

### Browser extension or compromised device reads page memory

This risk already exists for any local browser application. v131 minimizes exposure by not reading the authoritative vault and clearing gate state on reload.

### Runtime evidence has not yet been measured on the current route

The Decision Gate invokes the published v130 evaluator against the current snapshot input. Missing or failing evidence blocks the gate.

## Required validation

- strict TypeScript and Node contract tests;
- parser and static syntax checks;
- cross-browser and responsive Playwright;
- route settlement and single-observer assertions;
- axe, keyboard, visual, and Lighthouse gates;
- public-repository secret/privacy scans;
- dependency review, npm audit, supply-chain checks, and CodeQL;
- exact-head Cloudflare preview;
- zero unresolved review threads.

## Approval statement

v131 is acceptable for promotion only after the exact final head passes every protected gate. This review does not authorize any future financial capability; it covers only the decision-gate release described above.