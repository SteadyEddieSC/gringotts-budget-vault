# Gringotts Budget Vault v86

Roadmap Sync and Shell Recovery.

This release adds a runtime roadmap bridge that forces the visible roadmap to show the next ten planned releases. It also keeps the emergency service worker reset in place so the app stops serving stale cached shell files.

Test: download backup, use Repair and reload, reopen, open Roadmap, confirm v87 through v96 are listed, then open Health and confirm v86 appears.
