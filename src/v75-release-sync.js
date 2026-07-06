(function(){
  function releaseInfo(){return {version:'v76',name:'Core Version Sync + Health Cleanup',storageKey:'gringottsBudgetVault.v76',modules:['core-state-v76','health-cleanup','v64-data-guard','v65-vault-safety','v66-cashflow','v67-debt','v68-promo-briefing','v69-executive-dashboard','v70-monthly-executive','v71-executive-polish','v73-executive-drilldown','v74-executive-actions','v76-release-sync']};}
  async function cacheStatus(){
    const names='caches' in window?await caches.keys():[];
    const gringotts=names.filter(n=>n.toLowerCase().includes('gringotts'));
    const regs='serviceWorker' in navigator?await navigator.serviceWorker.getRegistrations():[];
    return {cacheNames:gringotts,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};
  }
  function releaseBlock(info,status){
    return `Release: ${info.version} ${info.name}\nCore storage key: ${info.storageKey}\nCached Gringotts shells: ${status?.cacheNames?.join(', ')||'none visible yet'}\nService workers: ${status?.serviceWorkers??'unknown'}\nController active: ${status?.controller?'yes':'no'}\nLoaded modules tracked: ${info.modules.length}`;
  }
  async function renderStatus(){
    const GBV=window.GBV; const info=releaseInfo();
    if(GBV){GBV.VERSION=info.version; GBV.STORAGE_KEY=info.storageKey;}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v76 Core Version Sync + Health Cleanup';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v76';
    const health=document.getElementById('healthSummary');
    if(health){
      let status=null; try{status=await cacheStatus();}catch(e){}
      const base=(health.dataset.healthBase==='1'||health.textContent.includes('Version:'))?health.textContent.split('\n\nHealth details:\n').pop().replace(/^Release:[\s\S]*?Checked:/,'Checked:'):health.textContent;
      const healthBase=(health.textContent.includes('Version:')?health.textContent.replace(/^Release:[\s\S]*?\n\n/,''):base)||'';
      health.textContent=`${releaseBlock(info,status)}\n\n${healthBase}`.trim();
    }
    const safety=document.getElementById('safetySummary');
    if(safety&&!safety.dataset.v76Stamped){safety.dataset.v76Stamped='1'; safety.textContent=`Release sync active: ${info.version}. Download best vault backup before clearing app cache.\n\n${safety.textContent||''}`;}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(renderStatus,300); setTimeout(renderStatus,1300);});
  window.GringottsReleaseSync={releaseInfo,cacheStatus,renderStatus};
})();
