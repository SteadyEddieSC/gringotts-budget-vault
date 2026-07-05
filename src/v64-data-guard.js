(function(){
  function readAllVaults(){
    return Object.keys(localStorage).filter(k=>k.indexOf('gringottsBudgetVault.')===0).map(key=>{
      try{const raw=localStorage.getItem(key); const obj=JSON.parse(raw); return {key,raw,obj,tx:Array.isArray(obj?.transactions)?obj.transactions.length:0,rules:Array.isArray(obj?.rules)?obj.rules.length:0,last:Date.parse(obj?.lastSavedAt||obj?.latestSavedAt||obj?.createdAt||0)||0};}
      catch(e){return null;}
    }).filter(Boolean).sort((a,b)=>b.tx-a.tx||b.last-a.last||a.key.localeCompare(b.key));
  }
  function bestVault(){return readAllVaults()[0]||null;}
  function restoreBest(){
    const GBV=window.GBV; if(!GBV||!GBV.store) return null;
    const best=bestVault(); if(!best) return null;
    const current=(GBV.state&&Array.isArray(GBV.state.transactions))?GBV.state.transactions.length:0;
    if(best.tx>=current){
      GBV.state={...GBV.defaultState(),...best.obj,version:GBV.VERSION,meta:{...GBV.defaultState().meta,...(best.obj.meta||{}),lastRecovery:{at:new Date().toISOString(),fromKey:best.key,transactions:best.tx,rules:best.rules}}};
      GBV.store.save(false);
      if(GBV.ui) GBV.ui.renderAll();
    }
    return best;
  }
  function draw(){
    const el=document.getElementById('repairSummary');
    const list=document.getElementById('vaultKeyList');
    const rows=readAllVaults();
    if(el){const best=rows[0]; el.textContent=best?`Best local vault: ${best.key}\nTransactions: ${best.tx}\nRules: ${best.rules}\nCurrent app version: ${window.GBV?.VERSION||'unknown'}\nThis release will prefer the most populated local vault instead of an empty newest key.`:'No Gringotts local vaults found.';}
    if(list){list.innerHTML=rows.map(r=>`<div class="list-item"><span><strong>${r.key}</strong><br><small>${r.tx} transactions • ${r.rules} rules</small></span><button class="btn secondary" data-restore-key="${r.key}" type="button">Restore</button></div>`).join('')||'<p>No local vault keys found.</p>'; list.querySelectorAll('[data-restore-key]').forEach(btn=>btn.onclick=()=>{const r=rows.find(x=>x.key===btn.dataset.restoreKey); if(r&&window.GBV){window.GBV.state={...window.GBV.defaultState(),...r.obj,version:window.GBV.VERSION,meta:{...window.GBV.defaultState().meta,...(r.obj.meta||{}),lastRecovery:{at:new Date().toISOString(),fromKey:r.key,transactions:r.tx,rules:r.rules}}}; window.GBV.store.save(false); window.GBV.ui.renderAll(); draw(); window.GBV.store.toast('Restored '+r.tx+' transactions from '+r.key);}});}
  }
  document.addEventListener('DOMContentLoaded',function(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v64'; GBV.STORAGE_KEY='gringottsBudgetVault.v64';}
    restoreBest();
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v64 Data Guard + Vault Recovery';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v64';
    const btn=document.getElementById('restoreBestVaultBtn'); if(btn) btn.onclick=function(){const b=restoreBest(); draw(); if(window.GBV) window.GBV.store.toast(b?'Restored best local vault':'No local vault found');};
    draw();
  });
  window.GringottsDataGuard={readAllVaults,bestVault,restoreBest,draw};
})();
