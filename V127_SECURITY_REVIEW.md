# v127 Security Review — UX Polish & Simplification

## Change boundary

v127 adds a presentation and interaction-policy layer over the existing v126 runtime. It does not replace or duplicate the route coordinator, action dispatcher, transaction runtime, import pipeline, reporting engine, or storage model.

## Data handling

- no new localStorage or sessionStorage key;
- no new storage write;
- no transaction copies;
- no vault, metadata, close-history, profile, receipt, plan, decision, scenario, or report-setting mutation;
- no remote request API, analytics, telemetry, credential collection, institution connection, or external financial action.

## Runtime ownership

- v126 remains the only route coordinator;
- v126 remains the only owner of the enhancement `MutationObserver`;
- v126 remains the specialist action and current-download dispatcher;
- v127 uses route lifecycle events and capture listeners for presentation metadata only;
- v127 explicitly reports that it adds no observer or storage write.

## DOM and accessibility behavior

- action classification derives from visible labels and stable attributes;
- navigation tabs are excluded from action classification;
- native table semantics are preserved; a containing scroll wrapper receives `role="region"` when available;
- dialogs are labeled from existing visible headings;
- focus is moved only after deliberate route navigation and only when focus has not moved to another control;
- dialog focus returns only to a still-connected opener;
- roadmap content is static repository-authored text and is inserted with DOM text APIs rather than HTML interpolation.

## Recovery and destructive boundaries

- destructive classification is advisory presentation metadata and does not bypass, add, or replace existing confirmation logic;
- critical recovery actions and stable v105 rescue remain visible;
- no all-storage reset or automatic cleanup is introduced;
- `gringottsBudgetVault.latest` remains authoritative and non-resettable;
- empty-vault overwrite protection and backup-first transaction writes remain unchanged.

## Supply chain and deployment

- no dependency was added or updated;
- all GitHub Actions remain pinned to full commit SHAs;
- Cloudflare Pages remains a static deployment;
- no service worker, worker runtime, CDN dependency, or remote parser was added.

## Promotion decision

v127 is promotable only after the exact final head passes the protected parser, browser, responsive, accessibility, Lighthouse, security, supply-chain, CodeQL, preview deployment, and unresolved-thread gates.
