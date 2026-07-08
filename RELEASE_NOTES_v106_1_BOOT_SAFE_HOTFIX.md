# Gringotts Budget Vault v106.1 — Boot-Safe Hotfix

## Problem corrected

The v106 production HTML and CSS loaded, but the JavaScript module graph could fail before the runtime rendered the application shell. Because the production body contained no visible fallback content, that failure appeared as a completely blank dark page.

The Brave/remote-DevTools messages reported with the failure were not the root cause:

- the `:9224/favicon.ico` 404 belongs to the local DevTools endpoint;
- Autofill protocol errors are DevTools/Chromium capability messages;
- the autofocus message does not prevent the Gringotts app from rendering.

## Production correction

Both production entry pages now:

- identify as v106.1;
- render a visible loading panel before JavaScript starts;
- load one boot module as the single HTML module entry;
- dynamically import the v106 runtime;
- catch module-loading failures;
- catch later window errors and unhandled promise rejections;
- reattach the diagnostic panel even when a failure occurs after the runtime replaced the original body;
- display the exact technical error instead of returning to a silent black screen;
- provide Retry v106.1 and stable v105 rescue actions.

## Stable rescue page

Added `rescue-v105.html` as a separate emergency entry that loads the last user-confirmed stable v105 runtime.

The rescue page:

- uses the same origin and browser-local storage;
- does not clear, migrate, or overwrite the vault merely by opening;
- has its own boot/error panel;
- is separate from the main v106.1 runtime rather than stacking compatibility runtimes in the primary app.

## Data safety

No transaction JSON, localStorage value, backup, rule, budget, recurring preference, bill, or payday was deleted or reset by this hotfix.

## What to test

1. Open the main v106.1 URL.
2. Confirm that the app opens or shows a readable Gringotts error panel rather than a blank page.
3. If the error panel appears, capture the Technical detail text.
4. Use Retry v106.1 once.
5. Use Open stable v105 rescue and confirm the existing browser-local vault appears.
6. Confirm the v106.1 header version after a successful boot.
7. Continue the original v106 navigation, calendar, responsive-layout, reports, backup, and restore checklist after the app opens.
