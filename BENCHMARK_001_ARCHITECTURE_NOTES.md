# BENCHMARK-001 architecture notes (interim)

Status: interim source and documentation evidence for issue #54. This is not the 22-job workflow scorecard or a final product recommendation. No finance data, server password, bank connection, or paid service was used.

## Actual Budget evidence checked on 2026-11-01

- The installed desktop client reported **v26.10.0**. A separate local browser server reported client/server **v26.10.0** and stopped at its first-run password creation screen. No password was entered.
- The offline desktop client supports accounts, budgets, reports, schedules, file import/export, and local work. Its `No server` mode does not provide browser/PWA access, cross-device sync, or the server-backed API. See [Actual installation options](https://actualbudget.org/docs/install/).
- With a configured server, Actual keeps a local working copy and syncs it to the selected server; its official documentation describes offline operation and multi-device use. End-to-end encryption is optional, has a separate password, and has a password-loss recovery cost. The server administrator can access sync tokens, and local device data is not encrypted by Actual itself. See [syncing across devices](https://actualbudget.org/docs/getting-started/sync/).
- The local server's first-run password screen is a real setup prerequisite for the server-backed proof. This benchmark did not cross that secret boundary.
- Actual's official API is a Node package, not a REST service. The documented browser build is experimental and requires cross-origin isolation. The Node client connects with the server URL and password. See [Using the API](https://actualbudget.org/docs/api/).
- Actual's user directory and per-budget user access require an OpenID Provider. This adds identity-provider setup and ongoing operations if separate household identities are required. See [Managing multi-user support](https://actualbudget.org/docs/config/multi-user/).
- Actual supports CSV and other financial-file imports through the account UI. The synthetic checking CSV opened in the import preview with 75 rows and the expected Date, Payee, Notes, Category, and Amount fields. It was not imported, so no duplicate/review result is claimed. See [importing transactions](https://actualbudget.org/docs/transactions/importing/).
- Actual supports user-initiated data export and desktop backup. The independent backup and fresh-client restore jobs remain untested. See [backing up Actual](https://actualbudget.org/docs/backup-restore/backup/).

## Gringotts evidence available so far

- The live local v134 app reports a local vault and a blank current dataset. Its restore preview accepted the 183-row synthetic fixture, but the first-run UI could not produce a current populated backup; its required acknowledgment and disabled confirmation prevent using the supported restore path from an empty destination.
- The v134 release contract describes local exports and explicitly records no network or persistent-store addition in the export executor. The app's current local-data model therefore does not itself provide cross-device sync.
- The deterministic fixture has 177 canonical transactions across six accounts, six Actual CSVs, Gringotts CSV and restore representations, expected outcomes, and a hash manifest. Manifest SHA-256: `bea0cbd3fb410a1b9c067f7f4e2e4f597f35a54523fca1fe099bfde5c9f2d536`.

## Decision limits

This evidence supports treating Actual's server-backed client as the serious cloud/offline baseline for #56, subject to the server-password boundary and a real two-client test. It does not establish household usability, conflict handling, replay behavior, interrupted-sync recovery, or spreadsheet exit quality. It also does not justify building Gringotts sync. Final architecture/product scoring remains dependent on completing #54's matched 22-job execution.
