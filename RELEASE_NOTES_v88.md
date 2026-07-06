# Gringotts Budget Vault v88

Service Worker Removal + Debug Stabilization.

The debug report showed CacheStorage was empty but a service worker registration was still active and controlling the page. v88 changes the service worker to self-unregister and changes the PWA bootstrap so it no longer registers a service worker. It also loads the debug bridge directly.

Test: open debug.html, confirm serviceWorkers eventually becomes 0 after reopening, then open the app. Vault data remains in localStorage and is not cleared.
