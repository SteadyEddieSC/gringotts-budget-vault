(function(){
  const GBV=window.GBV;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function toast(message){const el=document.getElementById('toast'); if(!el) return; el.textContent=message; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600);}
  function migrate(raw){const base=GBV.defaultState(); const incoming=raw&&typeof raw==='object'?raw:{}; return {...base,...incoming,version:GBV.VERSION,transactions:Array.isArray(incoming.transactions)?incoming.transactions:[],rules:Array.isArray(incoming.rules)?incoming.rules:[],meta:{...base.meta,...(incoming.meta||{})}};}
  function allVaults(){
    const keys=[GBV.STORAGE_KEY,...GBV.PREVIOUS_KEYS,...Object.keys(localStorage).filter(k=>k.startsWith('gringottsBudgetVault.'))];
    return [...new Set(keys)].map(key=>{try{const raw=localStorage.getItem(key); if(!raw) return null; const obj=JSON.parse(raw); const tx=Array.isArray(obj.transactions)?obj.transactions.length:0; const rules=Array.isArray(obj.rules)?obj.rules.length:0; const last=Date.parse(obj.lastSavedAt||obj.latestSavedAt||obj.createdAt||0)||0; return {key,obj,tx,rules,last,size:raw.length};}catch(e){return null;}}).filter(Boolean).sort((a,b)=>b.tx-a.tx||b.last-a.last||a.key.localeCompare(b.key));
  }
  function bestVault(){return allVaults()[0]||null;}
  function loadedKey(){return GBV.state?.meta?.loadedFromKey||GBV.state?.meta?.activeStorageKey||bestVault()?.key||'gringottsBudgetVault.latest';}
  function pruneEmptyVaults(keepKey){
    const removed=[];
    allVaults().forEach(v=>{if(v.key!==keepKey&&v.key!=='gringottsBudgetVault.latest'&&v.tx===0&&v.rules===0){try{localStorage.removeItem(v.key); removed.push(v.key);}catch(e){}}});
    return removed;
  }
  function load(){
    const best=bestVault();
    if(best){GBV.state=migrate(best.obj); GBV.state.meta=GBV.state.meta||{}; GBV.state.meta.loadedFromKey=best.key; GBV.state.meta.activeStorageKey=best.key; return GBV.state;}
    GBV.state=GBV.defaultState(); GBV.state.meta.activeStorageKey='gringottsBudgetVault.latest'; return GBV.state;
  }
  function save(show=true,options={}){
    GBV.state.lastSavedAt=new Date().toISOString();
    GBV.state.version=GBV.VERSION;
    GBV.state.meta=GBV.state.meta||{};
    const key=options.key||loadedKey();
    GBV.state.meta.activeStorageKey=key;
    const payload=JSON.stringify(GBV.state);
    try{localStorage.setItem(key,payload);}
    catch(e){
      pruneEmptyVaults(key);
      try{localStorage.setItem(key,payload);}catch(e2){toast('Save skipped: browser storage quota is full. Download backup, then use Safety before clearing anything.'); throw e2;}
    }
    if(show) toast('Vault saved locally');
  }
  function saveMeta(show=false){try{localStorage.setItem('gringottsBudgetVault.meta',JSON.stringify({version:GBV.VERSION,at:new Date().toISOString(),activeStorageKey:loadedKey(),transactions:(GBV.state.transactions||[]).length})); if(show) toast('Vault metadata saved');}catch(e){}}
  function clear(){const key=loadedKey(); localStorage.removeItem(key); GBV.state=GBV.defaultState(); GBV.state.meta.activeStorageKey=key; save(false,{key}); toast('Local vault cleared');}
  function download(name,content,type='application/json'){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);}
  function backup(){const stamp=new Date().toISOString().replace(/[:.]/g,'-'); const best=bestVault(); const data=best?migrate(best.obj):GBV.state; download(`Gringotts_Budget_Vault_${GBV.VERSION}_backup_${stamp}.json`,JSON.stringify(data,null,2)); toast('Backup downloaded');}
  function importBackup(obj){GBV.state=migrate(obj); GBV.state.meta=GBV.state.meta||{}; GBV.state.meta.activeStorageKey='gringottsBudgetVault.latest'; save(true,{key:'gringottsBudgetVault.latest'});}
  GBV.store={clone,load,save,saveMeta,clear,backup,download,importBackup,toast,allVaults,bestVault,loadedKey,pruneEmptyVaults};
})();
