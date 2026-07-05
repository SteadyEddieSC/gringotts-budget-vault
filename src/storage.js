(function(){
  const GBV=window.GBV;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function toast(message){const el=document.getElementById('toast'); if(!el) return; el.textContent=message; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600);}
  function migrate(raw){const base=GBV.defaultState(); const incoming=raw&&typeof raw==='object'?raw:{}; return {...base,...incoming,version:GBV.VERSION,transactions:Array.isArray(incoming.transactions)?incoming.transactions:[],rules:Array.isArray(incoming.rules)?incoming.rules:[],meta:{...base.meta,...(incoming.meta||{})}};}
  function allVaults(){
    const keys=[GBV.STORAGE_KEY,...GBV.PREVIOUS_KEYS,...Object.keys(localStorage).filter(k=>k.startsWith('gringottsBudgetVault.'))];
    return [...new Set(keys)].map(key=>{try{const raw=localStorage.getItem(key); if(!raw) return null; const obj=JSON.parse(raw); const tx=Array.isArray(obj.transactions)?obj.transactions.length:0; const rules=Array.isArray(obj.rules)?obj.rules.length:0; const last=Date.parse(obj.lastSavedAt||obj.latestSavedAt||obj.createdAt||0)||0; return {key,obj,tx,rules,last};}catch(e){return null;}}).filter(Boolean).sort((a,b)=>b.tx-a.tx||b.last-a.last||a.key.localeCompare(b.key));
  }
  function bestVault(){return allVaults()[0]||null;}
  function load(){
    const best=bestVault();
    if(best){GBV.state=migrate(best.obj); GBV.state.meta=GBV.state.meta||{}; GBV.state.meta.loadedFromKey=best.key; save(false); return GBV.state;}
    GBV.state=GBV.defaultState(); return GBV.state;
  }
  function save(show=true){GBV.state.lastSavedAt=new Date().toISOString(); localStorage.setItem(GBV.STORAGE_KEY,JSON.stringify(GBV.state)); localStorage.setItem('gringottsBudgetVault.latest',JSON.stringify({...GBV.state,latestSavedAt:GBV.state.lastSavedAt})); if(show) toast('Vault saved locally');}
  function clear(){localStorage.removeItem(GBV.STORAGE_KEY); localStorage.removeItem('gringottsBudgetVault.latest'); GBV.state=GBV.defaultState(); save(false); toast('Local vault cleared');}
  function download(name,content,type='application/json'){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);}
  function backup(){const stamp=new Date().toISOString().replace(/[:.]/g,'-'); const best=bestVault(); const data=best?migrate(best.obj):GBV.state; download(`Gringotts_Budget_Vault_${GBV.VERSION}_backup_${stamp}.json`,JSON.stringify(data,null,2)); toast('Backup downloaded');}
  function importBackup(obj){GBV.state=migrate(obj); save();}
  GBV.store={clone,load,save,clear,backup,download,importBackup,toast,allVaults,bestVault};
})();
