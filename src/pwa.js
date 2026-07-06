(function(){
  const GBV=window.GBV;
  function add(src,flag){if(window[flag]||document.querySelector('script[src="'+src+'"]'))return;const s=document.createElement('script');s.defer=true;s.src=src;document.body.appendChild(s);}
  function loadV87(){add('src/v87-debug-console.js','GringottsDebug');}
  function loadV89(){add('src/v89-runtime-stabilizer.js','GringottsRuntimeStabilizer');}
  async function unregisterAll(){let regs=[];try{if('serviceWorker'in navigator){regs=await navigator.serviceWorker.getRegistrations();for(const r of regs){try{await r.unregister();}catch(e){}}}}catch(e){}return regs.length;}
  async function register(){await unregisterAll();loadV87();loadV89();}
  function installPrompt(){const btn=document.getElementById('installBtn');if(btn)btn.hidden=true;}
  async function checkUpdate(){const n=await unregisterAll();loadV87();loadV89();GBV.store?.toast?.('Runtime refreshed. Service workers disabled: '+n);}
  async function appCacheStatus(){const c='caches'in window?await caches.keys():[];const regs='serviceWorker'in navigator?await navigator.serviceWorker.getRegistrations():[];return {caches:c,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};}
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(loadV87,900);setTimeout(loadV89,1200);setTimeout(unregisterAll,1800);});
  GBV.pwa={register,installPrompt,checkUpdate,appCacheStatus,loadV87,loadV89,unregisterAll};
})();
