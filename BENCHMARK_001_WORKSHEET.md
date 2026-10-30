# BENCHMARK-001 Evidence Worksheet

Status: execution worksheet for #54. This file is a structure for **synthetic-only** evidence collection; it is not a completed benchmark and does not select a product direction.

## Frozen benchmark inputs

- Gringotts baseline at worksheet creation: `126561b333f094b6275c207baedda59fc9a0cc74`.
- Synthetic fixture generator: `scripts/benchmark-001-generate.mjs`.
- Official Actual baseline prepared for execution: `v26.10.0` (reconfirm current official release and license immediately before the hands-on run; record any change below).
- No real household transaction, balance, account, income, debt, goal, screenshot, export, credential, or provider connection may be used.
- Incremental spend: `$0`.

### Execution identity

| Field | Gringotts | Actual |
| --- | --- | --- |
| Exact version / commit | `126561b333f094b6275c207baedda59fc9a0cc74` | `TBD at execution` |
| Source / distribution | This repository | Official Actual release only |
| License rechecked | N/A | `TBD` |
| Host / browser / app version | `TBD` | `TBD` |
| Fixture generator commit | `TBD` | Same fixture commit |
| Fixture manifest/hash | `TBD` | Same fixture manifest/hash |
| Start state | Fresh synthetic benchmark state | Fresh synthetic benchmark state |

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
| 1 | Create/open household budget | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 1 | Create/open household budget | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 2 | Create accounts | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 2 | Create accounts | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 3 | Import synthetic transactions | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 3 | Import synthetic transactions | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 4 | Resolve duplicate/import issues | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 4 | Resolve duplicate/import issues | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 5 | Categorize/review transactions | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 5 | Categorize/review transactions | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 6 | Create/review recurring bills or schedules | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 6 | Create/review recurring bills or schedules | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 7 | Correct mistaken categorization and inspect impact | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 7 | Correct mistaken categorization and inspect impact | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 8 | Create monthly budget/plan | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 8 | Create monthly budget/plan | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 9 | Represent annual/irregular expenses or sinking funds | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 9 | Represent annual/irregular expenses or sinking funds | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 10 | Inspect next-payday / next-30-day obligations | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 10 | Inspect next-payday / next-30-day obligations | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 11 | Determine whether available cash is committed | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 11 | Determine whether available cash is committed | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 12 | Handle recurring subscription price increase | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 12 | Handle recurring subscription price increase | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 13 | Evaluate hypothetical large purchase | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 13 | Evaluate hypothetical large purchase | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 14 | Model temporary income reduction | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 14 | Model temporary income reduction | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 15 | Evaluate extra debt payoff vs reserve/goal | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 15 | Evaluate extra debt payoff vs reserve/goal | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 16 | Compare baseline vs scenario without ledger mutation | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 16 | Compare baseline vs scenario without ledger mutation | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 17 | Month-end review/close | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 17 | Month-end review/close | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 18 | Explain material month-over-month changes | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 18 | Explain material month-over-month changes | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 19 | Review net-worth direction | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 19 | Review net-worth direction | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 20 | Export/backup full dataset | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 20 | Export/backup full dataset | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 21 | Restore/recover into fresh state | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 21 | Restore/recover into fresh state | Actual |  |  |  |  |  |  |  |  |  |  |  |
| 22 | Use at phone-size / narrow viewport | Gringotts |  |  |  |  |  |  |  |  |  |  |  |
| 22 | Use at phone-size / narrow viewport | Actual |  |  |  |  |  |  |  |  |  |  |  |

## Gringotts differentiator checks

Do not mark these as differentiators until the benchmark proves that Actual does not provide an equally clear native path.

| Candidate differentiator | Gringotts evidence | Actual closest path | Meaningfully unique? | Keep / delegate / remove rationale |
| --- | --- | --- | --- | --- |
| Explainable available-to-commit after obligations/reserve |  |  |  |  |
| Material attention / decision queue |  |  |  |  |
| Non-mutating household scenario comparison |  |  |  |  |
| Recurring-cost drift / decision tracking |  |  |  |  |
| Guided Household Plan |  |  |  |  |
| Close history / driver explainability |  |  |  |  |
| Deterministic full-vault backup/restore |  |  |  |  |
| Household goals/debt context |  |  |  |  |

## Sync / two-adult follow-up evidence

These observations feed #56 and must remain separate from the 22-job ledger/product benchmark.

| Proof | Result | Evidence / notes |
| --- | --- | --- |
| Client A creates/imports synthetic household and syncs |  |  |
| Client B starts empty and receives same state |  |  |
| A changes one record; B receives it |  |  |
| B edits a different record offline and converges after reconnect |  |  |
| A and B edit same stale record; conflict is visible/deterministic |  |  |
| Duplicate mutation/replay is idempotent |  |  |
| Interrupted sync resumes safely |  |  |
| Independent backup restores to a fresh client |  |  |
| Narrow/PWA workflow remains usable |  |  |
| Optional desktop client sees same authority without file shuttling |  |  |

## Migration / integration feasibility

### If Actual becomes authoritative

Record:
- Gringotts data that exports cleanly: `TBD`.
- Gringotts-only state needing preservation: `TBD`.
- Mapping gaps / unsupported fields: `TBD`.
- Tested rollback path: `TBD`.
- Spreadsheet-exit quality: `TBD`.

### If Gringotts becomes an Actual companion

Record:
- exact supported `@actual-app/api` version/path: `TBD`.
- API vs export/import boundary preference: `TBD`.
- server/runtime requirement: `TBD`.
- update/version coupling: `TBD`.
- backup complexity: `TBD`.
- additional security/privacy boundary: `TBD`.

## Decision gate

Do not choose from scores alone. Complete the qualitative matrix, differentiator checks, migration/integration notes, recovery proof, and secondary-adult/narrow-screen evidence first.

Final recommendation must be exactly one of:

- `GRINGOTTS_STANDALONE`
- `ACTUAL_COMPANION`
- `MIGRATE_TO_ACTUAL`
- `OTHER`

### Recommendation

`TBD — benchmark not yet executed`

### Evidence-backed rationale

`TBD`

### Rejected alternatives

`TBD`

### Next bounded issue

`TBD`
