(function(){
  const GBV=window.GBV;
  async function register(){if(!('serviceWorker' in navigator)) return; try{const reg=await navigator.serviceWorker.register('/service-worker.js'); window.GBV.swRegistration=reg; reg.addEventListener('updatefound',()=>GBV.store.toast('PWA update found. Download a backup, then reload.'));}catch(e){console.warn('service worker registration failed',e);}}
  function installPrompt(){window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); GBV.deferredInstallPrompt=e; const btn=document.getElementById('installBtn'); if(btn) btn.hidden=false;}); const btn=document.getElementById('installBtn'); if(btn) btn.onclick=async()=>{if(!GBV.deferredInstallPrompt) return; GBV.deferredInstallPrompt.prompt(); await GBV.deferredInstallPrompt.userChoice; GBV.deferredInstallPrompt=null; btn.hidden=true;};}
  async function checkUpdate(){try{if(GBV.swRegistration){await GBV.swRegistration.update(); GBV.store.toast('Checked for app update. Close and reopen if an update was found.');}else if('serviceWorker' in navigator){await register(); GBV.store.toast('Service worker registered; check again after reload.');}else{GBV.store.toast('Service worker not supported');}}catch(e){GBV.store.toast('Update check failed');}}
  async function appCacheStatus(){const cachesList='caches' in window?await caches.keys():[]; const regs='serviceWorker' in navigator?await navigator.serviceWorker.getRegistrations():[]; return {caches:cachesList,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};}
  function loadV85(){if(window.GringottsV85||document.querySelector('script[src="src/v85-tools-selftest.js"]'))return; const s=document.createElement('script'); s.defer=true; s.src='src/v85-tools-selftest.js'; document.body.appendChild(s);}
  document.addEventListener('DOMContentLoaded',()=>setTimeout(loadV85,2100));
  GBV.pwa={register,installPrompt,checkUpdate,appCacheStatus,loadV85};
})();
