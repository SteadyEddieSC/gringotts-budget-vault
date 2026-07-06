(function(){
  function releaseInfo(){return {version:'v75',name:'Release Sync + Offline Shell Hardening',storageKey:'gringottsBudgetVault.v75',modules:['v64-data-guard','v65-vault-safety','v66-cashflow','v67-debt','v68-promo-briefing','v69-executive-dashboard','v70-monthly-executive','v71-executive-polish','v73-executive-drilldown','v74-executive-actions','v75-release-sync']};}
  async function cacheStatus(){
    const names='caches' in window?await caches.keys():[];
    const gringotts=names.filter(n=>n.toLowerCase().includes('gringotts'));
    const regs='serviceWorker' in navigator?await navigator.serviceWorker.getRegistrations():[];
    return {cacheNames:gringotts,serviceWorkers:regs.length,controller:!!navigator.serviceWorker?.controller};
  }
  async function renderStatus(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v75'; GBV.STORAGE_KEY='gringottsBudgetVault.v75';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v75 Release Sync + Offline Shell';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v75';
    const info=releaseInfo();
    const health=document.getElementById('healthSummary');
    if(health){
      try{const status=await cacheStatus(); const current=health.textContent||''; health.textContent=`Release: ${info.version} ${info.name}\nCached Gringotts shells: ${status.cacheNames.join(', ')||'none visible yet'}\nService workers: ${status.serviceWorkers}\nController active: ${status.controller?'yes':'no'}\nLoaded modules: ${info.modules.length}\n\n${current}`;}
      catch(e){health.textContent=`Release: ${info.version} ${info.name}\nCache status unavailable.\n\n${health.textContent||''}`;}
    }
    const safety=document.getElementById('safetySummary');
    if(safety&&!safety.dataset.v75Stamped){safety.dataset.v75Stamped='1'; safety.textContent=`Release sync active: ${info.version}. Use Download best vault backup before clearing app cache.\n\n${safety.textContent||''}`;}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(renderStatus,250); setTimeout(renderStatus,1200);});
  window.GringottsReleaseSync={releaseInfo,cacheStatus,renderStatus};
})();
