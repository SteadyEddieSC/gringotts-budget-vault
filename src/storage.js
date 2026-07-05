(function(){
  const GBV=window.GBV;
  function clone(v){return JSON.parse(JSON.stringify(v));}
  function toast(message){const el=document.getElementById('toast'); if(!el) return; el.textContent=message; el.classList.add('show'); clearTimeout(toast.t); toast.t=setTimeout(()=>el.classList.remove('show'),2600);}
  function migrate(raw){const base=GBV.defaultState(); const incoming=raw&&typeof raw==='object'?raw:{}; return {...base,...incoming,version:GBV.VERSION,transactions:Array.isArray(incoming.transactions)?incoming.transactions:[],rules:Array.isArray(incoming.rules)?incoming.rules:[],meta:{...base.meta,...(incoming.meta||{})}};}
  function load(){
    const keys=[GBV.STORAGE_KEY,...GBV.PREVIOUS_KEYS];
    for(const key of keys){try{const raw=localStorage.getItem(key); if(raw){GBV.state=migrate(JSON.parse(raw)); save(false); return GBV.state;}}catch(e){console.warn('load failed',key,e);}}
    GBV.state=GBV.defaultState(); return GBV.state;
  }
  function save(show=true){GBV.state.lastSavedAt=new Date().toISOString(); localStorage.setItem(GBV.STORAGE_KEY,JSON.stringify(GBV.state)); localStorage.setItem('gringottsBudgetVault.latest',JSON.stringify({...GBV.state,latestSavedAt:GBV.state.lastSavedAt})); if(show) toast('Vault saved locally');}
  function clear(){localStorage.removeItem(GBV.STORAGE_KEY); localStorage.removeItem('gringottsBudgetVault.latest'); GBV.state=GBV.defaultState(); save(false); toast('Local vault cleared');}
  function download(name,content,type='application/json'){const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();},0);}
  function backup(){const stamp=new Date().toISOString().replace(/[:.]/g,'-'); download(`Gringotts_Budget_Vault_${GBV.VERSION}_backup_${stamp}.json`,JSON.stringify(GBV.state,null,2)); toast('Backup downloaded');}
  function importBackup(obj){GBV.state=migrate(obj); save();}
  GBV.store={clone,load,save,clear,backup,download,importBackup,toast};
})();
