# BENCHMARK-001 synthetic household fixture

This directory is reserved for the deterministic Gringotts-vs-Actual benchmark owned by issue #54.

The fixture source is `scripts/benchmark-001-generate.mjs`. It creates the same fully synthetic six-month household workload every time:

- two synthetic adults;
- six accounts: checking, savings, two credit cards, an auto-loan-like liability, and cash;
- May through October 2026 transaction history;
- regular payroll, housing, utilities, groceries, fuel, subscriptions, discretionary spending, debt payments, and transfers;
- a subscription price drift from $17.99 to $21.99 beginning in August;
- three irregular expenses;
- an emergency-reserve goal, annual-expense sinking-fund goal, and credit-card payoff goal;
- hypothetical $4,800 purchase and 25% two-month income-reduction scenarios.

No names, account numbers, credentials, tokens, bank exports, or household financial records from a real person are present.

## Generate benchmark files

From the repository root:

```bash
npm run benchmark:fixture
```

The default output directory is `tests/fixtures/benchmark-001/generated/`. You may also invoke `node scripts/benchmark-001-generate.mjs <output-directory>` when a separate disposable evidence directory is useful.

The generator writes:

- `scenario.json` — canonical scenario metadata plus all transactions;
- `expected-outcomes.json` — deterministic facts derived from the canonical scenario for cross-product verification;
- `gringotts-all-accounts.csv` — one all-account file using Gringotts' retained signed-amount convention;
- six `actual-*.csv` files — one file per account using Actual's positive-inflow / negative-outflow convention;
- `manifest.json` — sorted artifact inventory with UTF-8 byte lengths and SHA-256 hashes for the nine benchmark input/evidence artifacts above.

`manifest.json` intentionally does not hash itself. The CLI result prints a separate SHA-256 for the manifest so a benchmark run can record one compact identity for the complete generated pack.

The product-specific CSVs and expected outcomes are generated from the same canonical in-memory scenario. Do not hand-edit one product's data or expected facts to make a benchmark result look better. If the fixture semantics need to change, change the generator, rerun the integrity tests, and treat the new fixture as a new exact benchmark candidate.

Actual's current official import documentation is the execution reference: <https://actualbudget.org/docs/transactions/importing/>. Its CSV flow supports field mapping, date-format selection, amount flipping/splitting, and account-scoped import. During the benchmark, map Date, Payee, Notes, Category, Amount, and Imported ID as applicable and record every import/configuration step in the scorecard. Gringotts should use its normal bank-import path without special benchmark-only runtime behavior.

## Integrity contract

`tests-node/benchmark-001-fixture.test.mjs` verifies:

- deterministic repeat generation;
- exactly 177 transactions across six months and all six accounts;
- explicit `SYNTHETIC` markers on accounts/payees and benchmark notes on every transaction;
- stable account ownership for the synthetic education/card transactions;
- expected subscription price drift and irregular-expense evidence;
- deterministic expected outcomes for counts, reserve gap, irregular expenses, large-purchase impact, and temporary income loss;
- consistent sign conversion between Actual and Gringotts exports;
- deterministic emitted files and manifest identity across independent runs;
- every manifest byte length and SHA-256 against the corresponding generated artifact.

The generator is test-only benchmark infrastructure. It must not be imported by the production boot/runtime, mutate `gringottsBudgetVault.latest`, add telemetry/network access, connect a bank/provider, import real financial data, or weaken any v134 quality/security gate.
