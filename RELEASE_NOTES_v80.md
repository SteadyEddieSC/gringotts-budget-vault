# Gringotts Budget Vault v80

## Focus

Family Budget Meeting Pack.

## Changes

- Adds a Family Budget Meeting Pack panel to the Briefing tab.
- Builds a quick meeting prep view using the executive summary, Cash Flow II planning snapshot, and Promo APR/debt signals.
- Adds decision tracking.
- Adds household action items with owner and done/undo controls.
- Adds Copy meeting pack and Download meeting pack Markdown export.
- Stores meeting notes in a small separate key: `gringottsFamilyMeetingPack.v1`.
- Keeps quota-safe storage intact; this release does not create another full transaction-vault copy.
- Release Sync dynamically loads v79 Cash Flow II and v80 Family Meeting Pack.

## Test

1. Update to v80.
2. Open Briefing.
3. Confirm Family Budget Meeting Pack appears.
4. Add a test decision and action item.
5. Mark the action done/undo.
6. Copy or download the meeting pack.
7. Confirm Repair still shows the populated `latest` vault with the expected transaction count.
