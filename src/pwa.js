(function(){
  const GBV=window.GBV;
  async function register(){if(!('serviceWorker' in navigator)) return; try{const reg=await navigator.serviceWorker.register('/service-worker.js'); window.GBV.swRegistration=reg; reg.addEventListener('updatefound',()=>GBV.store.toast('PWA update found. Download a backup, then reload.'));}catch(e){console.warn('service worker registration failed',e);}}
  function installPrompt(){window.addEventListener('beforeinstallprompt',e=>{e.preventDefault(); GBV.deferredInstallPrompt=e; const btn=document.getElementById('installBtn'); if(btn) btn.hidden=false;}); const btn=document.getElementById('installBtn'); if(btn) btn.onclick=async()=>{if(!GBV.deferredInstallPrompt) return; GBV.deferredInstallPrompt.prompt(); await GBV.deferredInstallPrompt.userChoice; GBV.deferredInstallPrompt=null; btn.hidden=true;};}
  async function checkUpdate(){try{if(GBV.swRegistration){await GBV.swRegistration.update(); GBV.store.toast('Checked for app update');}else{GBV.store.toast('Service worker not ready yet');}}catch(e){GBV.store.toast('Update check failed');}}
  GBV.pwa={register,installPrompt,checkUpdate};
})();
