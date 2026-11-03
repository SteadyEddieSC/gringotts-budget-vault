# SYNC-ARCH-001 Actual client checkpoint

Status: partial synthetic-only execution evidence for issue #56. No real household data, bank connection, password, or paid service was used.

## Observed clients

- Client A: Actual Budget v26.10.0 in the local in-app browser at `http://127.0.0.1:5007/`.
- Client B: a separate Chrome Incognito browser context connected to the same local Actual server. Its budget view showed the same six `SYNTHETIC` account balances and `Server online`; it also showed 159 uncategorized transactions.
- Both views included the same account balances recorded in `BENCHMARK_001_ARCHITECTURE_NOTES.md`.

## Different-record sync probe

- Client A saved a November 2026 Food category budget target of `$600.00` using Actual's budget cell editor. A then showed Food budgeted `$600.00`, balance `$600.00`, and November `To Budget` falling from `$43,950.00` to `$43,350.00`.
- The first immediate read of Client B still showed Food budgeted `$0.00` and November `To Budget` `$43,950.00`, while its sidebar reported `Server online`.
- After reopening Client B's November budget, the owner reported that Food showed `$600.00`; the agent then inspected the separate Incognito client's visible accessibility tree and observed Food budgeted `$600.00`, balance `$600.00`, November `To Budget` `$43,350.00`, and `Server online`. This supports eventual cross-client convergence after reopening; the first read was stale. No sync reset, revert, or second budget creation was attempted.

## Remaining #56 proof

The online different-record state transfer is observed in both Client B and the agent's follow-up UI inspection after reopening. Different-record offline edits, same-record stale edits, replay idempotency, interrupted sync, independent server-backed backup/restore, narrow/PWA review, and spouse workflow remain open. The earlier issue #54 evidence for local API export/restore and local browser/mobile layout does not substitute for these server-backed multi-client proofs.

## Recheck — 2026-11-01

- A separate in-app browser context opened the existing server-backed budget at `http://127.0.0.1:5007/budget` and displayed the same six synthetic accounts, Food `$600.00` for November, `To Budget` `$43,350.00`, and `Server online`. No additional mutation was saved. This corroborates online readback only.
- Actual v26.11.0 became the latest official release at 2026-11-01 21:54 America/New_York. The app/server pair used in this checkpoint remains v26.10.0; this checkpoint must be rerun on v26.11.0 before being treated as current-release evidence.
- The separate desktop Actual window currently shows `No server` and a different local budget state. Do not count it as Client B or as part of this shared-budget test.
- Same-record stale edits, offline edits, replay, interrupted sync, independent server-backed backup/restore, narrow/PWA, and second-adult workflow remain unproven. Next: refresh the local pair to v26.11.0, repeat online convergence, then run the offline and stale same-record probes against the synthetic budget.

## Isolated current-release refresh — 2026-11-01

- Installed the official `@actual-app/sync-server@26.11.0` into a new side-by-side directory. CLI reported `v26.11.0`; its migration completed and it listens only on `127.0.0.1:5008`.
- The v26.11.0 UI reports both App and Server at `v26.11.0`. It is pointed at a copy of the existing synthetic server dataset; the existing v26.10.0 service and files at port 5007 were left running and untouched.
- The isolated copied dataset is behind the configured server password. No password was entered or stored, and no data was changed. Owner sign-in is the immediate prerequisite to repeat the UI convergence probe and continue #56.
- No new #56 behavioral proof is claimed from this setup. Offline edits, same-record conflict behavior, replay idempotency, interrupted sync, backup/restore, narrow/PWA, and second-adult acceptance remain open.

## Recheck after owner sign-in — 2026-11-02

- Client A in the isolated in-app browser is now authenticated to the copied synthetic dataset on `127.0.0.1:5008`; UI reports App and Server `v26.11.0` and Server online. The owner entered the existing password directly in the browser. The password is not recorded.
- This is a prepared-copy refresh, not a fresh-from-empty import. It contains six synthetic accounts, 183 ledger rows (177 fixture transactions plus six opening-balance rows), 159 uncategorized rows, and the inherited November Food budget target of `$600.00`. No value was changed during this recheck.
- A separate Chrome profile can reach the same server but shows the sign-in form. Client B has not authenticated, so current-release convergence has not yet been rechecked. Owner action required: open `http://127.0.0.1:5008/login` in the Chrome Actual sync probe tab, enter the existing server password in the local form, and select **Sign in**. Stop if prompted to create/change credentials. Do not send the password in chat.
- No current-release two-client mutation was attempted. Offline edit, same-record conflict, replay idempotency, interrupted sync, independent server-backed backup/restore, narrow/PWA, and second-adult acceptance remain unproven.

## Two-client v26.11.0 probes — 2026-11-02

- Clients: Client A was a fresh in-app browser context and Client B was a separate Chrome profile, both authenticated to the isolated loopback server at `127.0.0.1:5008`. Both showed the same six synthetic accounts, server online, November Food `$600.00`, November `To Budget` `$43,350.00`, and General `$0.00` before the probes.
- Online different-record convergence: Client A changed Food from `$600.00` to `$601.00`. Client B remained at `$600.00` until its page was reloaded; after reload, B showed Food `$601.00` and `To Budget` `$43,349.00`. A then restored Food to `$600.00`; after B reloaded, B showed `$600.00` and `$43,350.00`. No account or transaction was changed.
- Offline availability and edit: only the isolated v26.11.0 server on port 5008 was stopped; the separate v26.10.0 server on port 5007 was untouched. After reload, Client B visibly reported `Server offline` while retaining the synthetic account balances and budget. B changed General from `$0.00` to `$7.00` while offline. After the server restarted and B reloaded, it reported online and retained the `$7.00` edit. Client A then reloaded and showed General `$7.00`, demonstrating offline save and eventual cross-client convergence after reconnect/reopen. General was restored to `$0.00`; both clients were later verified at the original `$600.00` Food / `$0.00` General baseline.
- Same-record stale edits: with both clients visibly offline and starting from Food `$600.00`, A changed Food to `$610.00`; B independently changed the same stale Food field to `$620.00`. The server restarted; A reconnected first and showed `$610.00`, then B reconnected and showed `$620.00`. No conflict prompt or visible conflict indicator appeared. In this sequence, the later B edit prevailed; this is an observed overwrite, not proof of a universal or deterministic conflict policy. B restored Food to `$600.00`; after A reloaded, A showed `$600.00`, and B also showed the restored baseline.
- These probes require a page reload for the other client to display the latest state; immediate live convergence was not observed. The values were synthetic budget targets, not transactions or account balances.
- Remaining #56 proof: duplicate mutation/replay idempotency, interrupted-sync recovery, independent server-backed backup restore into a fresh client, narrow/PWA usability, and second-adult acceptance remain open. The test used two browser contexts under the same server owner and does not establish separate household identities or spouse workflow.

## Current-release backup export checkpoint — 2026-11-02

- Client B used Actual Settings → General → Data → Export data on the restored synthetic budget. The browser downloaded `C:\Users\eddie\Downloads\2026-11-02-My Finances.zip` locally (174,867 bytes); archive inspection found `db.sqlite` and `metadata.json`. SHA-256: `9a771cc1541c33ca3efe128f11ef2da4526389a045bb19f90ac905253ef658ac`.
- The archive was not uploaded. It remained local for the import below.

## Current-release backup restore checkpoint — 2026-11-02

- Client C used a separate Chrome Incognito profile, signed into the isolated v26.11.0 loopback server at `127.0.0.1:5008`, and imported the local `2026-11-02-My Finances.zip` archive through Actual's **Import file → Actual** flow. Actual created a separate file named `New budget`; the original `My Finances` remained in the Files list. No overwrite prompt was recalled, and both files remained present afterward.
- The selected restored `New budget` displayed `App: v26.11.0 | Server: v26.11.0`, `Server online`, six `SYNTHETIC` accounts, all-account total `$3,291.75`, on-budget total `$19,241.75`, November Food `$600.00`, General `$0.00`, and November `To Budget` `$43,350.00`. This is a successful Actual archive import/restore into a separate file from a fresh Incognito browser profile, with expected synthetic state visible.
- Evidence is the user's 2026-11-02 screenshots of the Files list (original `My Finances` plus imported `New budget`) and the selected restored November budget/account view. No actual household data or provider connection was used; the ZIP stayed local.
- This proves restoring the backup to a separate file/profile on the same isolated local server. It does not prove recovery onto a separately provisioned server or household identity. Duplicate mutation/replay idempotency, interrupted-sync recovery, narrow/PWA usability, and second-adult acceptance remain open.


## Offline current-release import replay checkpoint — 2026-11-02

- A separate credential-free `@actual-app/api@26.11.0` proof used a fresh local data directory with **no serverURL, password, session token, or real data**.
- One synthetic transaction with fixed `imported_id` `BENCHMARK-001-replay-001` was imported twice through `importTransactions(..., { dryRun:false, reimportDeleted:false })`. The first call added one row with no errors. The exact replay added zero rows and zero updates; the final account transaction count stayed exactly one and the existing match was reported ignored.
- The API's finish-import cloud upload was unauthorized because no server credentials were configured. That did not affect the local reconciliation result and was not bypassed.
- Scope: this proves offline/current-version **transaction-import idempotency for fixed imported IDs**. It does **not** prove network-sync mutation replay, interrupted-sync recovery, or multi-client conflict semantics. Those remain separate #56 gates.

### Adjacent spreadsheet-exit checkpoint

- Gringotts now has a freeze-safe synthetic spreadsheet-exit regression using the existing CSV mapping/import and full-vault restore flows only; no v134 product feature was added.
- The proof covers mapping, exact duplicate suppression, populated pre-import backup, missing-only write/readback, exact replay as no-change, explicit rollback by restoring the downloaded pre-import backup, no network writes, and 390×844 containment.
- Direct `.xlsx` parsing remains intentionally deferred unless it preserves household meaning that exported CSV cannot carry. VBA/macros are retired rather than executed.

All test edits remain in the synthetic `My Finances` budget. No secrets are recorded.

## Independent-server restore + narrow/PWA checkpoint — 2026-11-02

- Started a second isolated `@actual-app/sync-server@26.11.0` from an empty temporary data directory at `127.0.0.1:5010`. The existing v26.11 benchmark server on port 5008 and its credentials/data were not read, changed, stopped, or reused. The new server used only a temporary synthetic benchmark password; the credential is not recorded here.
- A fresh 390×844 browser client reported `App: v26.11.0 | Server: v26.11.0`, `/site.webmanifest`, and a registered service worker. The bootstrap/login surfaces had `scrollWidth === clientWidth === 390` and no console errors.
- The first fresh client imported the exact current-release synthetic backup `2026-11-02-My Finances.zip` (`174,867` bytes; SHA-256 `9a771cc1541c33ca3efe128f11ef2da4526389a045bb19f90ac905253ef658ac`) through Actual's **Import my budget → Actual** path. The restored November view showed 159 uncategorized transactions, Food `$600.00`, General `$0.00`, and `To Budget` `$43,350.00` with no horizontal document overflow.
- A separate fresh second browser context then signed into only the synthetic port-5010 server, saw `My Finances` as **Available for download**, downloaded it, and matched six `SYNTHETIC` accounts: Checking `$11,330.11`, Savings `$11,000.00`, Card Alpha `$75.14`, Card Beta `-$3,787.50`, Cash `$624.00`, and Auto Loan `-$15,950.00`; all-account total `$3,291.75`, on-budget total `$19,241.75`. Budget and Accounts views both remained exactly 390px wide.
- With the second client's downloaded file open, the browser was forced offline and reloaded. Reload completed without error, the same November budget remained usable, `navigator.onLine` was false, the service worker remained registered, and no console/page error was observed. This is live current-release PWA/offline evidence, not documentation-only inference.
- Scope: this closes the prior same-server-only backup limitation, proves a fresh second client can receive the restored household from an independently started current-release server, and provides current-release narrow/PWA offline-read evidence. It does **not** prove interrupted-sync recovery, a universal same-record conflict rule, separate named household identities, or human spouse acceptance. Those remain separate #56 gates.


## Deterministic interrupted full-sync checkpoint — 2026-11-02

- Started a fresh disposable `@actual-app/sync-server@26.11.0` on loopback with an empty temporary data directory and a synthetic-only temporary password. The standing port-5008 benchmark server and its credentials/data were not read, changed, stopped, or reused.
- A one-shot loopback proxy was placed between a fresh `@actual-app/api@26.11.0` client and the disposable server. It relayed the initial `/sync/sync` handshake (`124` request bytes, upstream HTTP `200`) normally.
- On the next `/sync/sync`, the client sent the imported synthetic household as a `275,528`-byte request containing `2,043` sync messages. The proxy fully forwarded that request, buffered the complete upstream HTTP `200` response (`1,061` bytes), and only then dropped the downstream response so the client experienced a deterministic commit-before-ack network failure.
- The client reported `network-failure` for that sync. Its immediate explicit retry succeeded. The subsequent sync requests completed normally.
- Server-side inspection of the new group database found exactly `2,043` rows in `messages_binary`, exactly `2,043` distinct message timestamps, and one Merkle row. Two separately successful non-faulted synthetic imports on the same disposable server also contained exactly `2,043` messages, so the interrupted path neither lost nor duplicated server message rows.
- The server account database retained the new file/group row and the local user-files area retained both the file blob and group database after recovery.
- A separate API-only `downloadBudget(syncId)` check was inconclusive (`not found`) despite those server-side file/blob/group records. The already-proven fresh-browser second-client download on the independent port-5010 server remains the cross-client recovery evidence; this checkpoint claims protocol interruption recovery/server message integrity, not fresh-client API discovery behavior.
- Scope: this closes required sync test #7 for one current-release initial full-sync commit-before-ack failure mode. It does **not** convert the earlier same-record `$610`/`$620` observation into a universal conflict rule, and it does not prove duplicate replay for every mutation type. The fixed-`imported_id` transaction-import replay proof remains the narrower idempotency evidence for test #6.
- Incremental spend: `$0`. Data: synthetic only. No real financial data, bank/provider connection, owner credential, or repository secret was used.


## Deterministic duplicate full-sync replay checkpoint — 2026-11-02

- Reused only the disposable synthetic v26.11 server created for the interrupted-sync proof; the standing port-5008 benchmark server remained untouched. A new one-shot loopback proxy relayed a fresh client's initial 124-byte `/sync/sync` handshake normally.
- On the next full-sync call, the proxy forwarded the **exact same** `275,528`-byte request body and original in-memory request headers upstream twice in sequence. The request represented the same `2,043` sync messages both times; neither request body nor authentication header was persisted or logged.
- First upstream replay result: HTTP `200`, `1,061` response bytes. Second upstream replay result: HTTP `200`, `276,465` response bytes. The client completed sync normally and a following sync reported zero outbound messages.
- Server-side inspection of the resulting group database found exactly `2,043` rows in `messages_binary`, exactly `2,043` distinct timestamps, and one Merkle row. The exact duplicate replay therefore did not create a second copy of the 2,043-message batch.
- Scope: this closes required sync test #6 for exact network replay of the tested current-release full-sync batch. It complements the fixed-`imported_id` transaction-import replay proof. It does **not** establish idempotency for every possible mutation envelope or replace the separately bounded same-record conflict observation.
- Incremental spend: `$0`. Data: synthetic only. Proxy logs contain only sizes/statuses and no session token, password, request body, or financial row content.
