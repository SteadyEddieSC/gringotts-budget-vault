(function(){
  const GBV=window.GBV;
  function add(src,flag){if(window[flag]||document.querySelector('script[src="'+src+'"]'))return;const s=document.createElement('script');s.defer=true;s.src=src;document.body.appendChild(s);}
  function loadV85(){add('src/v85-tools-selftest.js','GringottsV85');}
  function loadV86(){add('src/v86-roadmap-sync.js','GringottsRoadmapSync');}
  function loadV87(){add('src/v87-debug-console.js','GringottsDebug');}
  async function unregisterAll(){let regs=[];try{if('serviceWorker'in navigator){regs=await navigator.serviceWorker.getRegistrations();for(const r of regs){try{await r.unregister();}catch(e){}}}}catch(e){}return regs.length;}
  async function register(){await unregisterAll();loadV87();}
  function installPrompt(){const btn=document.getElementById('installBtn');if(btn)btn.hidden=true;}
  async function checkUpdate(){const n=await unregisterAll();loadV85();loadV86();loadV87();GBV.store?.toast?.('Disabled service worker registrations: '+n+'. Reopen once.');}
  async function appCacheStatus(){const c='caches'in window?await caches.keys():[];const regs='serviceWorker'in navigator?await navigator.serviceWorker.getRegistrations():[];return {caches:c,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};}
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(loadV85,1400);setTimeout(loadV86,1800);setTimeout(loadV87,2200);setTimeout(unregisterAll,2600);});
  GBV.pwa={register,installPrompt,checkUpdate,appCacheStatus,loadV85,loadV86,loadV87,unregisterAll};
})();
