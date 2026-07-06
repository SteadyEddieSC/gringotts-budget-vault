const CACHE_NAME='gringotts-budget-vault-v75';
const APP_SHELL=['/','/index.html','/styles/main.css','/src/state.js','/src/storage.js','/src/importer.js','/src/rules.js','/src/reports.js','/src/ui.js','/src/differential.js','/src/health.js','/src/update-repair.js','/src/v64-data-guard.js','/src/v65-vault-safety.js','/src/v66-cashflow.js','/src/v67-debt.js','/src/v68-promo-briefing.js','/src/v69-executive-dashboard.js','/src/v70-monthly-executive.js','/src/v71-executive-polish.js','/src/v72-dashboard-month-picker.js','/src/v73-executive-drilldown.js','/src/v74-executive-actions.js','/src/v75-release-sync.js','/src/pwa.js','/src/app.js','/src/app-v61.js','/manifest.webmanifest','/icons/icon.svg','/icons/maskable-icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('gringotts-budget-vault-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const req=event.request;
  if(req.mode==='navigate'||(req.headers.get('accept')||'').includes('text/html')){
    event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put('/index.html',copy)); return response;}).catch(()=>caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(response=>{const copy=response.clone(); if(new URL(req.url).origin===location.origin){caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));} return response;})));
});
