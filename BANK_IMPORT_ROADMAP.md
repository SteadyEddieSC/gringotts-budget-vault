# Bank Export Import Roadmap

v125 does not modify the authoritative v115 parser, mapping, duplicate review, guarded writer, metadata-only receipt, receipt audit, batch lineage, account-cleanup planning, or separate Full Vault Restore.

## Preserved import contract

- browser-only CSV, delimited text, OFX, QFX, QBO, and Gringotts JSON processing;
- no PDF/OCR or remote parser in normal import;
- explicit date, amount, sign, mapping, and duplicate decisions;
- populated pre-import backup before broad writes;
- missing-only insertion;
- raw-value rollback and read-back verification;
- metadata-only receipts and lineage;
- Full Vault Restore targets exactly `gringottsBudgetVault.latest` and blocks empty transaction arrays.

## v125 relationship

Close History & Trend Explainability reads aggregate close snapshots and currently posted rows. It does not write transactions, import receipts, profiles, mappings, account labels, or restore data. Close-trend exports contain aggregates only.

## Next import-related work

No new bank format is planned for v126. Runtime consolidation must first centralize import/restore action ownership, route readiness, loading/failure states, storage schema documentation, and recovery behavior. Additional formats require representative synthetic fixtures and separate review.
