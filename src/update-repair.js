(function(){
  const GBV=window.GBV;
  function vaultKeys(){return Object.keys(localStorage).filter(k=>k.startsWith('gringottsBudgetVault.')).sort().reverse();}
  function findVault(){
    for(const key of vaultKeys()){
      try{const raw=localStorage.getItem(key); const obj=JSON.parse(raw); if(obj&&Array.isArray(obj.transactions)) return {key,raw,obj};}catch(e){}
    }
    return null;
  }
  function statusText(){
    const vault=findVault();
    const sw=GBV.swRegistration?'registered':'not registered in this page yet';
    const lines=[`App version: ${GBV.VERSION}`,`Storage key: ${GBV.STORAGE_KEY}`,`Service worker: ${sw}`];
    if(vault){lines.push(`Local vault key: ${vault.key}`);lines.push(`Transactions preserved: ${(vault.obj.transactions||[]).length}`);lines.push(`Rules preserved: ${(vault.obj.rules||[]).length}`);lines.push(`Last saved: ${vault.obj.lastSavedAt||'unknown'}`);}else{lines.push('Local vault: not found in this browser profile');}
    return lines.join('\n');
  }
  function render(){const el=document.getElementById('repairSummary'); if(el) el.textContent=statusText();}
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
  function backup(){const vault=findVault(); if(!vault){GBV.store.toast('No local vault found to back up'); render(); return;} GBV.store.download(`Gringotts_update_repair_backup_${vault.obj.version||GBV.VERSION}_${stamp()}.json`,JSON.stringify(vault.obj,null,2)); GBV.store.toast('Repair backup downloaded'); render();}
  async function clearAppCache(){
    const before=findVault();
    let swCount=0, cacheCount=0;
    if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations(); swCount=regs.length; for(const reg of regs){await reg.unregister();}}
    if('caches' in window){const keys=await caches.keys(); for(const key of keys){if(key.toLowerCase().includes('gringotts')){await caches.delete(key); cacheCount++;}}}
    const after=findVault();
    GBV.state.meta=GBV.state.meta||{};
    GBV.state.meta.lastUpdateRepair={at:new Date().toISOString(),serviceWorkersUnregistered:swCount,cachesDeleted:cacheCount,beforeTransactions:before?.obj?.transactions?.length||0,afterTransactions:after?.obj?.transactions?.length||0,preserved:!!after};
    GBV.store.save(false);
    render();
    GBV.store.toast(`App cache reset. Vault rows preserved: ${after?.obj?.transactions?.length||0}`);
    return GBV.state.meta.lastUpdateRepair;
  }
  async function repairAndReload(){await clearAppCache(); location.href='/?repairReload='+Date.now();}
  function bind(){
    const inspect=document.getElementById('inspectVaultBtn'); if(inspect) inspect.onclick=()=>{render(); GBV.store.toast('Vault status refreshed');};
    const backupBtn=document.getElementById('downloadBeforeRepairBtn'); if(backupBtn) backupBtn.onclick=backup;
    const clearBtn=document.getElementById('clearAppCacheBtn'); if(clearBtn) clearBtn.onclick=()=>clearAppCache().catch(e=>GBV.store.toast('Repair failed: '+(e.message||e)));
    const reloadBtn=document.getElementById('repairReloadBtn'); if(reloadBtn) reloadBtn.onclick=()=>repairAndReload().catch(e=>GBV.store.toast('Repair failed: '+(e.message||e)));
    render();
  }
  document.addEventListener('DOMContentLoaded',bind);
  GBV.repair={vaultKeys,findVault,statusText,render,backup,clearAppCache,repairAndReload};
})();
