# BENCHMARK-001 Spreadsheet Exit Fixture

Synthetic-only migration fixture for issue #56.

This fixture models the low-dependency exit path from a household workbook: export the transaction-bearing worksheet as CSV, then pass it through Gringotts' existing guarded import pipeline. The fixture intentionally contains one stable-ID duplicate and two new rows so the proof exercises mapping, duplicate reconciliation, pre-import backup, missing-only insertion, readback verification, replay behavior, and rollback.

Other workbook semantics such as plans, goals, recurring schedules, formulas, and notes are **not** silently flattened into transaction rows. They remain explicit migration-gap items in the benchmark. VBA/macros are intentionally retired rather than executed or migrated.

Direct `.xlsx` ingestion is not required for this bounded proof because the repository has no spreadsheet-parser dependency and issue #56 explicitly permits an exported-CSV path. A future direct-XLSX parser should be justified only if it materially preserves household meaning or reduces one-time migration burden without bypassing the guarded writer.
