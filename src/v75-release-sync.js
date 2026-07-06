(function(){
  function releaseInfo(){return {version:'v79',name:'Cash Flow II + Manual Planning',storageKey:'gringottsBudgetVault.v79',modules:['core-state-v79','quota-safe-storage','cashflow-ii','manual-bills','payday-markers','debt-planner-ii','promo-apr-targets','executive-actions']};}
  function ensureScript(src){return new Promise(resolve=>{if(document.querySelector(`script[src="${src}"]`)) return resolve(); const s=document.createElement('script'); s.defer=true; s.src=src; s.onload=resolve; s.onerror=resolve; document.body.appendChild(s);});}
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
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v79 Cash Flow II';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v79';
    if(!window.GringottsCashflowII) await ensureScript('src/v79-cashflow-ii.js');
    if(window.GringottsCashflowII?.render) window.GringottsCashflowII.render();
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
    if(safety&&!safety.dataset.v79Stamped){safety.dataset.v79Stamped='1'; safety.textContent=`Release sync active: ${info.version}. Quota-safe mode remains active; Cash Flow II uses a small manual-planning key.\n\n${safety.textContent||''}`;}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(renderStatus,300); setTimeout(renderStatus,1300); setTimeout(renderStatus,2400);});
  window.GringottsReleaseSync={releaseInfo,cacheStatus,renderStatus,ensureScript};
})();
