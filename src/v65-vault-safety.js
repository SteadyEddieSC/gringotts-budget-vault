(function(){
  function rows(){
    const helper=window.GringottsDataGuard;
    if(helper&&helper.readAllVaults) return helper.readAllVaults();
    return [];
  }
  function best(){return rows()[0]||null;}
  function stamp(){return new Date().toISOString().replace(/[:.]/g,'-');}
  function draw(){
    const GBV=window.GBV;
    const box=document.getElementById('safetySummary');
    const list=document.getElementById('safetyVaultList');
    const b=best();
    if(box){
      box.textContent=b?`Best available vault: ${b.key}\nTransactions: ${b.tx}\nRules: ${b.rules}\nCurrent app version: ${GBV?.VERSION||'unknown'}\nSafety mode: populated-vault-first, backup-before-feature-work.`:'No populated Gringotts vault found in this browser profile.';
    }
    if(list){
      list.innerHTML=rows().map(r=>`<div class="list-item"><span><strong>${r.key}</strong><br><small>${r.tx} transactions • ${r.rules} rules</small></span><button class="btn secondary" data-safety-backup="${r.key}" type="button">Backup</button></div>`).join('')||'<p>No vault keys found.</p>';
      list.querySelectorAll('[data-safety-backup]').forEach(btn=>btn.onclick=()=>backupKey(btn.dataset.safetyBackup));
    }
  }
  function backupKey(key){
    const GBV=window.GBV;
    const r=rows().find(x=>x.key===key)||best();
    if(!r||!GBV||!GBV.store){GBV?.store?.toast('No vault found to back up'); return;}
    const data={...GBV.defaultState(),...r.obj,version:GBV.VERSION,meta:{...GBV.defaultState().meta,...(r.obj.meta||{}),safetyBackup:{at:new Date().toISOString(),fromKey:r.key,transactions:r.tx,rules:r.rules}}};
    GBV.store.download(`Gringotts_safety_backup_${GBV.VERSION}_${r.tx}_rows_${stamp()}.json`,JSON.stringify(data,null,2));
    GBV.store.toast('Safety backup downloaded');
    draw();
  }
  function backupBest(){const b=best(); if(b) backupKey(b.key); else window.GBV?.store?.toast('No vault found to back up');}
  function verifyAndRepair(){
    const GBV=window.GBV;
    const b=best();
    if(!GBV||!b){draw(); return null;}
    const current=(GBV.state&&Array.isArray(GBV.state.transactions))?GBV.state.transactions.length:0;
    if(b.tx>current && window.GringottsDataGuard&&window.GringottsDataGuard.restoreBest){window.GringottsDataGuard.restoreBest();}
    draw();
    GBV.store.toast('Safety check complete');
    return b;
  }
  document.addEventListener('DOMContentLoaded',function(){
    const GBV=window.GBV;
    if(GBV){GBV.VERSION='v65'; GBV.STORAGE_KEY='gringottsBudgetVault.v65';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v65 Vault Safety Center';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v65';
    const b1=document.getElementById('safetyBackupBestBtn'); if(b1) b1.onclick=backupBest;
    const b2=document.getElementById('safetyVerifyBtn'); if(b2) b2.onclick=verifyAndRepair;
    const b3=document.getElementById('backupNowBtn'); if(b3) b3.title='Downloads the best populated local vault backup';
    verifyAndRepair();
  });
  window.GringottsVaultSafety={rows,best,draw,backupKey,backupBest,verifyAndRepair};
})();
