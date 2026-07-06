(function(){
  const GBV=window.GBV;
  function vaultRows(){return Object.keys(localStorage).filter(k=>k.startsWith('gringottsBudgetVault.')&&k!=='gringottsBudgetVault.meta').map(key=>{try{const raw=localStorage.getItem(key); const obj=JSON.parse(raw); return {key,raw,obj,tx:Array.isArray(obj?.transactions)?obj.transactions.length:0,rules:Array.isArray(obj?.rules)?obj.rules.length:0,last:Date.parse(obj?.lastSavedAt||obj?.latestSavedAt||obj?.createdAt||0)||0};}catch(e){return null;}}).filter(Boolean).sort((a,b)=>b.tx-a.tx||b.last-a.last||a.key.localeCompare(b.key));}
  function vaultKeys(){return vaultRows().map(v=>v.key);}
  function findVault(){return vaultRows()[0]||null;}
  function statusText(){
    const vault=findVault();
    const sw=GBV.swRegistration?'registered':'not registered in this page yet';
    const lines=[`App version: ${GBV.VERSION}`,`Storage key: ${GBV.STORAGE_KEY}`,`Active vault key: ${GBV.store?.loadedKey?.()||vault?.key||'unknown'}`,`Service worker: ${sw}`];
    if(vault){lines.push(`Best local vault key: ${vault.key}`);lines.push(`Transactions preserved: ${vault.tx}`);lines.push(`Rules preserved: ${vault.rules}`);lines.push(`Last saved: ${vault.obj.lastSavedAt||'unknown'}`);}else{lines.push('Local vault: not found in this browser profile');}
    return lines.join('\n');
  }
  function render(){const el=document.getElementById('repairSummary'); if(el) el.textContent=statusText(); if(window.GringottsDataGuard?.draw) window.GringottsDataGuard.draw();}
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
  function backup(){const vault=findVault(); if(!vault){GBV.store.toast('No local vault found to back up'); render(); return;} GBV.store.download(`Gringotts_update_repair_backup_${GBV.VERSION}_${vault.tx}_rows_${stamp()}.json`,JSON.stringify(vault.obj,null,2)); GBV.store.toast('Repair backup downloaded'); render();}
  async function clearAppCache(){
    const before=findVault();
    let swCount=0, cacheCount=0;
    if('serviceWorker' in navigator){const regs=await navigator.serviceWorker.getRegistrations(); swCount=regs.length; for(const reg of regs){await reg.unregister();}}
    if('caches' in window){const keys=await caches.keys(); for(const key of keys){if(key.toLowerCase().includes('gringotts')){await caches.delete(key); cacheCount++;}}}
    const after=findVault();
    GBV.state.meta=GBV.state.meta||{};
    GBV.state.meta.lastUpdateRepair={at:new Date().toISOString(),serviceWorkersUnregistered:swCount,cachesDeleted:cacheCount,beforeTransactions:before?.tx||0,afterTransactions:after?.tx||0,preserved:!!after};
    if(GBV.store.saveMeta) GBV.store.saveMeta(false);
    render();
    GBV.store.toast(`App cache reset. Vault rows preserved: ${after?.tx||0}`);
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
