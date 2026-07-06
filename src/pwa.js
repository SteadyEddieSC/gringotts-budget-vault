(function(){
  const GBV=window.GBV;
  function add(src,flag){if(window[flag]||document.querySelector('script[src="'+src+'"]'))return;const s=document.createElement('script');s.defer=true;s.src=src;document.body.appendChild(s);}
  function loadV85(){add('src/v85-tools-selftest.js','GringottsV85');}
  function loadV86(){add('src/v86-roadmap-sync.js','GringottsRoadmapSync');}
  async function register(){}
  function installPrompt(){}
  async function checkUpdate(){loadV86();GBV.store?.toast?.('Checked app shell bridge. Reopen if needed.');}
  async function appCacheStatus(){const c='caches'in window?await caches.keys():[];return {caches:c,serviceWorkers:0,controller:false};}
  document.addEventListener('DOMContentLoaded',()=>{setTimeout(loadV85,1800);setTimeout(loadV86,2200);});
  GBV.pwa={register,installPrompt,checkUpdate,appCacheStatus,loadV85,loadV86};
})();
