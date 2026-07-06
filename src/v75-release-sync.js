(function(){
  function releaseInfo(){return {version:'v77',name:'Quota-Safe Storage + Version Authority',storageKey:'gringottsBudgetVault.v77',modules:['core-state-v77','quota-safe-storage','health-metadata-only','repair-metadata-only','data-guard-no-version-override','executive-drilldown','executive-actions']};}
  async function cacheStatus(){
    const names='caches' in window?await caches.keys():[];
    const gringotts=names.filter(n=>n.toLowerCase().includes('gringotts'));
    const regs='serviceWorker' in navigator?await navigator.serviceWorker.getRegistrations():[];
    return {cacheNames:gringotts,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};
  }
  function releaseBlock(info,status){
    return `Release: ${info.version} ${info.name}\nCore storage key: ${info.storageKey}\nActive storage key: ${window.GBV?.store?.loadedKey?.()||'unknown'}\nCached Gringotts shells: ${status?.cacheNames?.join(', ')||'none visible yet'}\nService workers: ${status?.serviceWorkers??'unknown'}\nController active: ${status?.controller?'yes':'no'}\nLoaded modules tracked: ${info.modules.length}`;
  }
  async function renderStatus(){
    const GBV=window.GBV; const info=releaseInfo();
    if(GBV){GBV.VERSION=info.version; GBV.STORAGE_KEY=info.storageKey;}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v77 Quota-Safe Storage';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v77';
    const health=document.getElementById('healthSummary');
    if(health){
      let status=null; try{status=await cacheStatus();}catch(e){}
      let base=health.textContent||'';
      if(base.startsWith('Release:')){const idx=base.lastIndexOf('\n\nVersion:'); base=idx>=0?base.slice(idx+2):'';}
      health.textContent=`${releaseBlock(info,status)}\n\n${base}`.trim();
    }
    if(window.GringottsDataGuard?.draw) window.GringottsDataGuard.draw();
    if(window.GBV?.repair?.render) window.GBV.repair.render();
    const safety=document.getElementById('safetySummary');
    if(safety&&!safety.dataset.v77Stamped){safety.dataset.v77Stamped='1'; safety.textContent=`Release sync active: ${info.version}. Quota-safe mode writes metadata separately and avoids creating another full version copy.\n\n${safety.textContent||''}`;}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(renderStatus,300); setTimeout(renderStatus,1300); setTimeout(renderStatus,2400);});
  window.GringottsReleaseSync={releaseInfo,cacheStatus,renderStatus};
})();
