(function(){
  function readAllVaults(){
    return Object.keys(localStorage).filter(k=>k.indexOf('gringottsBudgetVault.')===0&&k!=='gringottsBudgetVault.meta').map(key=>{
      try{const raw=localStorage.getItem(key); const obj=JSON.parse(raw); return {key,raw,obj,tx:Array.isArray(obj?.transactions)?obj.transactions.length:0,rules:Array.isArray(obj?.rules)?obj.rules.length:0,last:Date.parse(obj?.lastSavedAt||obj?.latestSavedAt||obj?.createdAt||0)||0,size:raw.length};}
      catch(e){return null;}
    }).filter(Boolean).sort((a,b)=>b.tx-a.tx||b.last-a.last||a.key.localeCompare(b.key));
  }
  function bestVault(){return readAllVaults()[0]||null;}
  function restoreBest(){
    const GBV=window.GBV; if(!GBV||!GBV.store) return null;
    const best=bestVault(); if(!best) return null;
    const current=(GBV.state&&Array.isArray(GBV.state.transactions))?GBV.state.transactions.length:0;
    if(best.tx>=current){
      GBV.state={...GBV.defaultState(),...best.obj,version:GBV.VERSION,meta:{...GBV.defaultState().meta,...(best.obj.meta||{}),loadedFromKey:best.key,activeStorageKey:best.key,lastRecovery:{at:new Date().toISOString(),fromKey:best.key,transactions:best.tx,rules:best.rules}}};
      if(GBV.store.saveMeta) GBV.store.saveMeta(false);
      if(GBV.ui) GBV.ui.renderAll();
    }
    return best;
  }
  function draw(){
    const el=document.getElementById('repairSummary');
    const list=document.getElementById('vaultKeyList');
    const rows=readAllVaults();
    if(el){const best=rows[0]; el.textContent=best?`Best local vault: ${best.key}\nTransactions: ${best.tx}\nRules: ${best.rules}\nCurrent app version: ${window.GBV?.VERSION||'unknown'}\nActive storage key: ${window.GBV?.store?.loadedKey?.()||best.key}\nQuota-safe mode: restore reads from the best local vault without creating another full version copy.`:'No Gringotts local vaults found.';}
    if(list){list.innerHTML=rows.map(r=>`<div class="list-item"><span><strong>${r.key}</strong><br><small>${r.tx} transactions • ${r.rules} rules • ${(r.size/1024).toFixed(0)} KB</small></span><button class="btn secondary" data-restore-key="${r.key}" type="button">Restore</button></div>`).join('')||'<p>No local vault keys found.</p>'; list.querySelectorAll('[data-restore-key]').forEach(btn=>btn.onclick=()=>{const r=rows.find(x=>x.key===btn.dataset.restoreKey); if(r&&window.GBV){window.GBV.state={...window.GBV.defaultState(),...r.obj,version:window.GBV.VERSION,meta:{...window.GBV.defaultState().meta,...(r.obj.meta||{}),loadedFromKey:r.key,activeStorageKey:r.key,lastRecovery:{at:new Date().toISOString(),fromKey:r.key,transactions:r.tx,rules:r.rules}}}; if(window.GBV.store.saveMeta) window.GBV.store.saveMeta(false); window.GBV.ui.renderAll(); draw(); window.GBV.store.toast('Restored '+r.tx+' transactions from '+r.key);}});}
  }
  document.addEventListener('DOMContentLoaded',function(){
    restoreBest();
    const btn=document.getElementById('restoreBestVaultBtn'); if(btn) btn.onclick=function(){const b=restoreBest(); draw(); if(window.GBV) window.GBV.store.toast(b?'Restored best local vault':'No local vault found');};
    draw();
  });
  window.GringottsDataGuard={readAllVaults,bestVault,restoreBest,draw};
})();
