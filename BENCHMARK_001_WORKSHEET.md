# BENCHMARK-001 Evidence Worksheet

Status: execution worksheet for #54. This file is a structure for **synthetic-only** evidence collection; it is not a completed benchmark and does not select a product direction.

## Frozen benchmark inputs

- Gringotts baseline at worksheet creation: `126561b333f094b6275c207baedda59fc9a0cc74`.
- Synthetic fixture generator: `scripts/benchmark-001-generate.mjs`.
- Official Actual baseline originally prepared: `v26.10.0`. The official latest release was rechecked before current-version execution and is `v26.11.0` under the MIT license.
- No real household transaction, balance, account, income, debt, goal, screenshot, export, credential, or provider connection may be used.
- Incremental spend: `$0`.

### Execution identity

| Field | Gringotts | Actual |
| --- | --- | --- |
| Exact version / commit | `v134.0.0`; app source `126561b333f094b6275c207baedda59fc9a0cc74` | Official Actual `v26.11.0`; server and app UI both report `v26.11.0` |
| Source / distribution | This repository | Official Actual release / `@actual-app/sync-server@26.11.0` |
| License rechecked | N/A | MIT, official release |
| Host / browser / app version | Windows; Chromium-based isolated browser profile; Gringotts UI `v134` | Windows; Chromium-based in-app browser (exact build not recorded); Actual app/server `v26.11.0` at loopback `127.0.0.1:5008` |
| Fixture generator commit | `4926dd106598b46a7ce101f032ce7fb8370e8d08` | Same fixture commit |
| Fixture manifest/hash | `bea0cbd3fb410a1b9c067f7f4e2e4f597f35a54523fca1fe099bfde5c9f2d536` | Same fixture manifest/hash |
| Start state | Empty Gringotts vault restored from the synthetic 183-row JSON fixture; verified destination key `gringottsBudgetVault.latest` | Prepared copy of prior synthetic server dataset: 183 ledger rows, 159 uncategorized, inherited November Food target `$600`; not fresh-from-empty |

## Scoring rubric

For every workflow, preserve the observations first and assign a 1–5 summary score only afterward.

- **Completion:** `native`, `workaround`, or `unavailable`.
- **Interaction effort:** approximate repeatable clicks/steps; note unavoidable context switches.
- **Cognitive load:** `low`, `medium`, or `high`, with a one-line reason.
- **Authoritative-state clarity:** can a normal household user tell which state is real/current?
- **Confidence:** how easy is it to inspect or explain the result/calculation?
- **Duplicate entry:** `none`, `some`, or `material`.
- **Recovery/reversibility:** what happens after a mistake, failed import, or changed decision?
- **Narrow/mobile:** `good`, `usable`, `poor`, or `not supported`.
- **Layer classification:** `commodity ledger`, `household command layer`, `both`, or `neither`.
- **Summary score:** 1–5 only after the qualitative fields are complete.

## Workflow evidence matrix

Complete each row independently for both products using the same synthetic fixture. Evidence references must contain synthetic data only.

| # | Job | Product | Completion | Steps | Cognitive load | State clarity | Confidence | Duplicate entry | Recovery / reversibility | Narrow/mobile | Layer | Score | Evidence / notes |
| ---: | --- | --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- | ---: | --- |
| 1 | Create/open household budget | Gringotts | native | 1–2 | Low | Browser-local vault state is explicit | High for local state | none | Full-vault backup/restore path; no server dependency | good | both | TBD | Current app opens a local vault directly; fresh-profile benchmark restore is separately proven. |
| 1 | Create/open household budget | Actual | native | 1–2 | Low | Files list and selected budget are explicit | High | none | Export/import can create a separate budget copy | not assessed | commodity ledger | TBD | v26.11 Files list showed the server-backed `My Finances` budget and imported `New budget` copy. |
| 2 | Create accounts | Gringotts | workaround | 2 via import mapping | Medium | Accounts are transaction labels rather than first-class setup objects | High for labels | some mapping entry | Pre-import backup and restore protect writes | good | commodity ledger | TBD | Import supports a destination account label or mapped/masked account value; no separate first-class account-create flow was located. |
| 2 | Create accounts | Actual | native | 2–3 per account | Medium for six-account fixture | First-class account list/balances | High | none | Native account lifecycle; benchmark state retained balances | not assessed | commodity ledger | TBD | Six synthetic accounts were created for the matched import and their balances were verified. |
| 3 | Import synthetic transactions | Gringotts | native | ~6 guarded steps | Medium | Preview, mapping, duplicate review, backup, acknowledgement, and verified result are explicit | High | none after review | Mandatory pre-import backup; full-vault restore; failed writes auto-restore prior value | good | commodity ledger | TBD | Guarded CSV/JSON/OFX-family import is covered by current Playwright; BENCHMARK-001 spreadsheet fixture inserted 2 missing rows and skipped 1 exact duplicate with no network writes. |
| 3 | Import synthetic transactions | Actual | native | repeated account-scoped import | Medium | Account balances and imported rows are visible; category setup is separate | High for ledger import | not assessed in UI re-import | Local/server export and import restore are available | not assessed | commodity ledger | TBD | Current fixture has 177 synthetic imported transactions plus six opening-balance rows across six accounts; 159 rows remained uncategorized in the prepared dataset. |
| 4 | Resolve duplicate/import issues | Gringotts | native | 3–5 | Medium | Exact/fuzzy/new buckets and selected disposition are explicit | High | none in replay proof | Backup-first; explicit full-vault restore; no-change receipt | good | commodity ledger | TBD | Spreadsheet fixture replay changed from 2 inserted/1 skipped to 0 inserted/3 skipped with final row count unchanged; existing tests also cover fuzzy review. |
| 4 | Resolve duplicate/import issues | Actual | native | 2 API calls in bounded proof | Low for API; household UI effort not measured | `added`/`updated` result and final count are explicit | High for fixed `imported_id` replay | none for tested replay | Replay produced no second row | not applicable to API proof | commodity ledger | TBD | Offline `@actual-app/api@26.11.0` proof: first `importTransactions` added 1; exact replay added 0; final count stayed 1. No server credentials were supplied, so this is not network-sync replay evidence. |
| 5 | Categorize/review transactions | Gringotts | native | 3–4 | Low | Review Queue exposes current row/category and result | High | none | Backup-first verified edit | good | commodity ledger | TBD | Fresh `review-goals.spec.js` run proved native category correction through Review Queue with verified backup-first write. |
| 5 | Categorize/review transactions | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 6 | Create/review recurring bills or schedules | Gringotts | native | 3–5 | Low | Bills/paydays planning metadata is separate from ledger evidence | High | none | Editable local planning state; does not mutate transactions | good | household command layer | TBD | Fresh month-close/forecast tests created monthly bill and biweekly payday entries and projected them without network writes. |
| 6 | Create/review recurring bills or schedules | Actual | native | ~4 | Low | Schedule appears as first-class state | High | none | Native edit/delete path | not assessed | commodity ledger | TBD | Current-version benchmark retained an observed synthetic StreamBox schedule; broader schedule UX still needs matched scoring. |
| 7 | Correct mistaken categorization and inspect impact | Gringotts | native | 3–4 | Low | Before/after row and category are visible | High | none | Backup-first verified edit; downloaded backup available | good | commodity ledger | TBD | Fresh Review Queue regression changed a synthetic row to Groceries and verified the persisted transaction. |
| 7 | Correct mistaken categorization and inspect impact | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 8 | Create monthly budget/plan | Gringotts | native | 3 | Low | Saved category targets are visibly separate planning state | High | none | Budget target can be edited/removed without vault mutation | good | household command layer | TBD | BENCHMARK-001 regression saved a `$625` Groceries monthly target, verified `gringottsBudgets.v1`, preserved the vault byte-for-byte, and produced no network writes. |
| 8 | Create monthly budget/plan | Actual | native | 2–3 | Low | Month/category target and To Budget change are visible | High | none | Target can be overwritten; backup export available | not assessed | commodity ledger | TBD | Current v26.11 two-client proof repeatedly used November Food `$600` as a controlled budget target and observed To Budget `$43,350`. |
| 9 | Represent annual/irregular expenses or sinking funds | Gringotts | native | 3–5 | Low | Goal target/current/contribution state is explicit | High | none | Goal/contribution metadata is separate from ledger | usable | household command layer | TBD | Fresh `review-goals.spec.js` run created a synthetic goal, recorded a contribution, and saved an explicit health snapshot. |
| 9 | Represent annual/irregular expenses or sinking funds | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 10 | Inspect next-payday / next-30-day obligations | Gringotts | native | 2 after planning setup | Low | Forecast shows dated bills/paydays, ending cash, buffer pressure, and lowest point | High | none | Planning settings are editable and separate from ledger | good | household command layer | TBD | Fresh forecast test created monthly bill + biweekly payday and stored a 60-day horizon; UI also supports 30-day horizon. |
| 10 | Inspect next-payday / next-30-day obligations | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 11 | Determine whether available cash is committed | Gringotts | workaround | 2 after planning setup | Medium | Forecast exposes starting cash, obligations, minimum buffer, ending cash, and pressure days, but not one canonical `available to commit` value | Medium-high | none | Planning metadata only; reversible | good | household command layer | TBD | Current forecast can answer the question by inspection, but the explicit simplified `available to commit` product outcome remains unproven. |
| 11 | Determine whether available cash is committed | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 12 | Handle recurring subscription price increase | Gringotts | native | 2–4 | Low | Prior/latest amount and delta are explicit; manual decision state is separate | High | none | Decision metadata never changes ledger | good | household command layer | TBD | Fresh recurring-cost tests detected synthetic 12→14 and 100→118 changes, excluded pending/one-time noise, and saved decision metadata without changing the vault. |
| 12 | Handle recurring subscription price increase | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 13 | Evaluate hypothetical large purchase | Gringotts | native | 3–5 | Low | Baseline/scenario table is side-by-side and explicitly hypothetical | High | none | Preview is in-memory; saved assumptions do not mutate financial stores | good | household command layer | TBD | Fresh scenario test applied a synthetic one-time expense to the preview and confirmed there is no Apply Scenario action. |
| 13 | Evaluate hypothetical large purchase | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 14 | Model temporary income reduction | Gringotts | native | 3–5 | Low | Monthly income delta is an explicit scenario assumption | High | none | Scenario metadata is separate from vault/forecast/debt/goals | good | household command layer | TBD | Scenario model/test covers bounded monthly income delta and confirms financial stores remain unchanged. |
| 14 | Model temporary income reduction | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 15 | Evaluate extra debt payoff vs reserve/goal | Gringotts | native | 4–6 | Medium | Debt balance, extra payment, goal target/current/contribution, and scenario deltas are explicit | High | none | Debt/goal/scenario stores are separate from transaction vault | good | household command layer | TBD | Fresh debt and scenario tests cover extra debt payment plus extra goal contribution without applying ledger transactions. |
| 15 | Evaluate extra debt payoff vs reserve/goal | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 16 | Compare baseline vs scenario without ledger mutation | Gringotts | native | 2–5 | Low | Side-by-side baseline/scenario rows and no-apply warning are explicit | High | none | In-memory preview; optional bounded assumptions store only | good | household command layer | TBD | Fresh scenario tests verified vault, forecast, debt, goals, and recurring stores are unchanged by saved scenario metadata. |
| 16 | Compare baseline vs scenario without ledger mutation | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 17 | Month-end review/close | Gringotts | native | reconcile accounts + explicit close | Medium | Pending/unreviewed blockers, reconciliation state, close revision, and reopen state are explicit | High | none | Reopen records a new event; transaction vault remains unchanged | good | household command layer | TBD | Fresh month-close regression reconciled, closed, and reopened July with vault count unchanged and no network writes. |
| 17 | Month-end review/close | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 18 | Explain material month-over-month changes | Gringotts | native | 1–2 after close history exists | Low | Close trend and driver surfaces identify aggregate changes | High | none | Read-only aggregate history; review-month changes do not mutate vault | good | household command layer | TBD | Fresh close-history tests explain transfer-neutral aggregate drivers, exclude pending noise, and keep phone layout contained. |
| 18 | Explain material month-over-month changes | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 19 | Review net-worth direction | Gringotts | unavailable | — | — | No explicit net-worth direction surface located in current v134 runtime/tests | — | — | — | — | neither | TBD | Current reporting covers goals, forecast, debt, scenarios, spending, and close trends; repository search found no explicit net-worth surface. |
| 19 | Review net-worth direction | Actual | native | 1–2 | Low | Net worth and movement are first-class report values | High | none | Read-only report | not assessed | commodity ledger | TBD | Current benchmark observed net worth `$3,291.75` with `+$505.90` movement on the synthetic dataset. |
| 20 | Export/backup full dataset | Gringotts | workaround | 1 for authoritative vault; additional exports for planning stores | Medium | Transaction-vault backup is explicit, but product state spans multiple stores | High for vault backup | none | JSON restore is proven; auxiliary stores need separate preservation contract | good | both | TBD | v128 portable/full-vault path protects the authoritative transaction vault. #56 storage inventory shows goals, forecast, debt, scenarios, recurring decisions, close history, and other metadata are separate domains. |
| 20 | Export/backup full dataset | Actual | native | 2 | Low | Local ZIP is explicit and self-contained for the budget file | High | none | Import creates a separate restored budget copy | not assessed | commodity ledger | TBD | v26.11 Settings → Export data produced a 174,867-byte ZIP containing `db.sqlite` and `metadata.json`, SHA-256 `9a771cc1…58ac`. |
| 21 | Restore/recover into fresh state | Gringotts | native | preview + acknowledge + confirm | Low | Transaction count, date range, source, and destination are previewed before write | High for authoritative vault | none | Explicit restore with verification; backup-first guidance | good | both | TBD | Fresh benchmark regression restored the generated 183-row vault into an empty isolated browser profile. Spreadsheet-exit test also restores its 12-row pre-import backup after a guarded import. |
| 21 | Restore/recover into fresh state | Actual | native | Import exact local ZIP into fresh isolated v26.11 server; fresh second client downloads restored file | Low | Restored file and expected budget/accounts are explicit on a newly provisioned server | High | none observed | Exact archive remains independently reusable; fresh client can download restored server file | good | commodity ledger | TBD | Exact v26.11 export (`174,867` bytes; SHA-256 `9a771cc1541c33ca3efe128f11ef2da4526389a045bb19f90ac905253ef658ac`) restored onto a new empty v26.11 server at `127.0.0.1:5010`. A fresh second 390×844 client then downloaded `My Finances` and matched six synthetic accounts, all-account `$3,291.75`, on-budget `$19,241.75`, Food `$600`, General `$0`, and To Budget `$43,350`. |
| 22 | Use at phone-size / narrow viewport | Gringotts | native | same workflow | Low | Controls remain visible without horizontal document overflow | High | none | Same local state/recovery paths | good | both | TBD | Fresh 390×844 checks cover spreadsheet mapping, monthly budgets, scenarios, recurring decisions, close trends, and reporting surfaces. |
| 22 | Use at phone-size / narrow viewport | Actual | native | same core workflow | Low | Bottom navigation, budget state, account state, and online/offline status remain explicit at 390px | High | none | Downloaded local PWA copy survives a forced offline reload | good | commodity ledger | TBD | Fresh v26.11 second client at 390×844 rendered budget and all six accounts with `scrollWidth === clientWidth === 390`; `/site.webmanifest` and a service worker were present. After forcing the browser offline and reloading, the same November budget remained usable with no reload error or console error. |

## Gringotts differentiator checks

Do not mark these as differentiators until the benchmark proves that Actual does not provide an equally clear native path.

| Candidate differentiator | Gringotts evidence | Actual closest path | Meaningfully unique? | Keep / delegate / remove rationale |
| --- | --- | --- | --- | --- |
| Explainable available-to-commit after obligations/reserve | Forecast exposes starting cash, bills/paydays, minimum buffer, pressure days, low point, and ending cash; no single canonical value yet | No matched Actual path executed yet | Not yet | Keep as a product outcome only if a simpler explicit value can be proven; current Gringotts path is still a calculation-by-inspection workaround. |
| Material attention / decision queue | Review Queue, Guided Plan, recurring decisions, forecast pressure, and close blockers are deterministic/manual-decision surfaces | Actual has uncategorized transaction and schedule/report surfaces; matched decision-queue UX not executed | Pending | Keep under test; do not claim uniqueness until matched Actual workflow is completed. |
| Non-mutating household scenario comparison | Fresh tests prove side-by-side hypothetical cash/debt/goal scenarios with no Apply action and no financial-store mutation | No equivalent matched Actual scenario workflow executed | Likely, pending matched Actual test | Strong Gringotts command-layer candidate; preserve unless Actual provides equally clear reversible what-if workflow. |
| Recurring-cost drift / decision tracking | Fresh tests prove amount-drift detection plus manual decision metadata with no vault mutation | Actual schedules are proven; explicit price-drift decision workflow not yet tested | Likely, pending matched Actual test | Keep under comparison; delegate raw schedule/ledger mechanics if Actual becomes authoritative. |
| Guided Household Plan | Fresh tests feed recurring decisions and saved scenarios into one manual discussion/follow-up surface | Actual budget/schedule/report capabilities are separate in current evidence | Likely, pending matched Actual test | Strong command-layer candidate; avoid duplicating commodity ledger features underneath it. |
| Close history / driver explainability | Fresh tests prove immutable aggregate close/reopen events, trends, and material drivers | Actual reports/net-worth views are proven; matched close-history explanation workflow not executed | Likely, pending matched Actual test | Keep if household review clarity remains materially better than generic reports. |
| Deterministic full-vault backup/restore | Authoritative transaction vault backup/restore is proven; auxiliary domains are not bundled into one full-product package | Actual ZIP export + Client C restore are proven on v26.11 | No | Delegate/avoid differentiation claim. Actual currently has the cleaner single-budget backup package. |
| Household goals/debt context | Fresh tests prove goal contributions/health plus debt-plan and scenario context without ledger mutation | No matched Actual goals/debt decision-support path executed | Pending | Keep under test as command-layer context; do not claim uniqueness yet. |

## Sync / two-adult follow-up evidence

These observations feed #56 and must remain separate from the 22-job ledger/product benchmark.

| Proof | Result | Evidence / notes |
| --- | --- | --- |
| Client A creates/imports synthetic household and syncs | Observed on a newly provisioned v26.11 server: a fresh client imported the exact synthetic v26.11 backup and the server then exposed `My Finances` to a subsequent fresh client | This is a backup-import bootstrap rather than rebuilding the fixture from raw CSV, but it proves the imported household becomes server-downloadable without using the prior server dataset. |
| Client B starts empty and receives same state | Observed on the newly provisioned v26.11 server: a fresh second 390×844 browser context saw `My Finances` as available for download, downloaded it, and matched the expected six synthetic accounts and November budget values | Uses the same temporary synthetic server owner, so it proves a second-client household workflow but not separate named household identities. |
| A changes one record; B receives it | Observed after reload: Food `$600` → `$601` on A; B showed `$601` and To Budget `$43,349` after reload. Restoring `$600` also converged after reload | Live update without reload was not observed; see `SYNC_ARCH_001_ACTUAL_CLIENT_CHECKPOINT.md` |
| B edits a different record offline and converges after reconnect | Observed: while server was down, B changed General `$0` → `$7`; after restart/reload, A showed `$7`. Both restored to General `$0` and original baseline | Supports a single synthetic offline-save/reconnect sequence; no replay or interruption guarantee |
| A and B edit same stale record; conflict is visible/deterministic | No visible conflict prompt: both edited stale Food `$600` offline (A `$610`, B `$620`); A reconnected first, B second, and B `$620` prevailed | One observed later-write overwrite; not sufficient to establish universal or deterministic conflict behavior |
| Duplicate mutation/replay is idempotent | Partial, import replay only: Gringotts spreadsheet fixture replay inserted 0 on second pass; offline Actual v26.11 API replay with fixed `imported_id` added 1 then 0 and final count stayed 1 | Does not prove network-sync mutation replay/idempotency; Actual API proof used no server credentials and its finish-upload step was unauthorized as expected. |
| Interrupted sync resumes safely |  |  |
| Independent backup restores to a fresh client | Observed on an independently started empty v26.11 server at `127.0.0.1:5010`: the exact `9a771cc1…58ac` export restored successfully, then a fresh second client downloaded the restored server file | Expected six synthetic accounts, all-account `$3,291.75`, on-budget `$19,241.75`, Food `$600`, General `$0`, and To Budget `$43,350` were visible. This supersedes the earlier same-server Client C limitation. See `SYNC_ARCH_001_ACTUAL_CLIENT_CHECKPOINT.md`. |
| Narrow/PWA workflow remains usable | Observed on current v26.11: 390×844 budget and accounts views had no horizontal document overflow; the app exposed `/site.webmanifest` plus a registered service worker; after the downloaded budget was forced offline and the page reloaded, the same November budget remained usable | No reload error or console error was observed. This proves current-release narrow PWA/offline behavior for the synthetic household, not human spouse acceptance. |
| Optional desktop client sees same authority without file shuttling |  |  |

## Migration / integration feasibility

### If Actual becomes authoritative

Record:
- Gringotts data that exports cleanly: authoritative transaction vault JSON, transaction-oriented CSV/delimited output, and the current 43-sheet local workbook/report exports are proven. The guarded importer also accepts CSV/delimited/OFX-family/Gringotts JSON inputs.
- Gringotts-only state needing preservation: category budgets, goals, forecast settings, debt plan, scenario comparisons, Guided Plan metadata, recurring decisions, close history, import/profile/audit metadata, and other classified stores from the #56 storage inventory. These are not all contained in the authoritative transaction-vault JSON.
- Mapping gaps / unsupported fields: a transaction-sheet CSV cannot preserve workbook formulas/macros, monthly-plan semantics, goals, recurring schedules/decisions, forecast/debt/scenario state, close history, or other non-ledger stores. Macro/VBA behavior is intentionally retired rather than executed or migrated.
- Tested rollback path: spreadsheet-exit import requires a populated pre-import JSON backup; a fresh regression then restored that exact backup through the existing full-vault preview/acknowledge/confirm flow and returned the authoritative vault from 14 rows to the original 12. Failed writes also auto-restore the pre-write value. No new runtime feature was added because v134 remains feature-frozen.
- Spreadsheet-exit quality: bounded CSV-sheet path proven with explicit mapping, one exact duplicate + two new rows, mandatory pre-import backup, missing-only write/readback, replay as verified no-change, explicit full-vault rollback, no network writes, and 390px containment. Direct `.xlsx` ingestion is deferred because no spreadsheet-parser dependency is present and CSV preserves the tested transaction semantics; add XLSX only if it materially preserves otherwise-lost household meaning.

### If Gringotts becomes an Actual companion

Record:
- exact supported `@actual-app/api` version/path: official `@actual-app/api@26.11.0` was installed only under untracked local benchmark tooling; a credential-free offline replay proof used `importTransactions` with a fixed synthetic `imported_id`.
- API vs export/import boundary preference: keep explicit export/import as the lowest-coupling baseline. A Node API companion is technically supported but should be justified only if #54 proves it is simpler than standalone Gringotts; the browser API remains experimental.
- server/runtime requirement: Node API embeds Actual's engine locally and may connect to a sync server; the browser API uses Worker + SQLite/WASM + IndexedDB and cross-origin isolation. A synchronized household still needs an Actual server reachable by both devices.
- update/version coupling: pin and revalidate the Actual API/client/server release together. The benchmark already had to refresh v26.10.0 evidence to v26.11.0 before scoring, demonstrating real version-coupling cost.
- backup complexity: an Actual-companion design creates at least two state/recovery concerns—Actual's authoritative budget and Gringotts-only decision metadata—unless Gringotts becomes read-only/derived. Actual's own ZIP export/restore is simpler than duplicating the ledger.
- additional security/privacy boundary: server authentication/session handling and any companion credential boundary must remain outside repository/browser-local decision metadata. No password/token was read, stored, or committed during the benchmark; offline API proof deliberately omitted server credentials.

## Decision gate

Do not choose from scores alone. Complete the qualitative matrix, differentiator checks, migration/integration notes, recovery proof, and secondary-adult/narrow-screen evidence first.

Final recommendation must be exactly one of:

- `GRINGOTTS_STANDALONE`
- `ACTUAL_COMPANION`
- `MIGRATE_TO_ACTUAL`
- `OTHER`

### Recommendation

`TBD — matched benchmark still incomplete; no final #54 product direction is justified yet.`

### Evidence-backed rationale

Current evidence is asymmetric but increasingly clear: Actual v26.11 is stronger on first-class commodity ledger/account/sync/backup mechanics, while Gringotts has fresh deterministic evidence for household command-layer workflows such as scenarios, recurring-cost decisions, close/driver explainability, guided planning, and explicit local import safety. Custom Gringotts cloud sync remains unjustified unless the remaining matched jobs show those command-layer advantages outweigh the storage/sync engineering burden. Scores remain deferred until the remaining Actual rows, interrupted-sync recovery, and any remaining second-adult acceptance are matched fairly.

### Rejected alternatives

None rejected yet. `MIGRATE_TO_ACTUAL`, `ACTUAL_COMPANION`, and `GRINGOTTS_STANDALONE` remain live #54 outcomes; #56 continues to treat `ACTUAL_SYNCED_HOUSEHOLD` as the architecture-to-beat rather than an accepted final decision.

### Next bounded issue

Finish the remaining matched Actual workflow rows plus interrupted-sync recovery and any remaining second-adult acceptance before selecting a final #54/#56 recommendation. Do not start custom Gringotts sync from this worksheet.
