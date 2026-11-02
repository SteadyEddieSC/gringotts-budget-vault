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

All test edits remain in the synthetic `My Finances` budget. No secrets are recorded.
