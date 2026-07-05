(function(){
  const GBV=window.GBV;
  const checks=[
    ['Core state','GBV.defaultState',()=>typeof GBV.defaultState==='function'],
    ['Local storage','GBV.store.load/save/backup',()=>!!(GBV.store&&GBV.store.load&&GBV.store.save&&GBV.store.backup)],
    ['Importer','GBV.importer.importPack/normalizePack',()=>!!(GBV.importer&&GBV.importer.importPack&&GBV.importer.normalizePack)],
    ['Reports','GBV.reports.metrics',()=>!!(GBV.reports&&GBV.reports.metrics)],
    ['Rules Engine II','GBV.rules.applyAll/conflictReport',()=>!!(GBV.rules&&GBV.rules.applyAll&&GBV.rules.conflictReport)],
    ['Differential Pull','GBV.diff.analyzeFile/render',()=>!!(GBV.diff&&GBV.diff.analyzeFile&&GBV.diff.render)],
    ['PWA updater','GBV.pwa.register/checkUpdate',()=>!!(GBV.pwa&&GBV.pwa.register&&GBV.pwa.checkUpdate)],
    ['UI renderer','GBV.ui.renderAll/setSection',()=>!!(GBV.ui&&GBV.ui.renderAll&&GBV.ui.setSection)]
  ];
  const removed=[
    ['Old v58 all-in-one release center','Paused after modular refactor; Cloudflare tab now handles update checks.'],
    ['Legacy presentation pack panel','Paused; planned to return in Family Budget Briefing.'],
    ['Old experimental import widgets','Replaced by Import and Diff Pull.'],
    ['Binary PNG icon workflow','Replaced by SVG icons so the connector can push releases.']
  ];
  function run(){
    const rows=checks.map(([name,detail,test])=>{let ok=false,err=''; try{ok=!!test();}catch(e){err=e.message||String(e);} return {name,detail,ok,err};});
    const missing=rows.filter(r=>!r.ok);
    const summary={version:GBV.VERSION,storageKey:GBV.STORAGE_KEY,transactions:(GBV.state.transactions||[]).length,rules:(GBV.state.rules||[]).length,missing:missing.length,checkedAt:new Date().toISOString()};
    GBV.state.meta=GBV.state.meta||{}; GBV.state.meta.health=summary;
    if(GBV.store&&GBV.store.save) GBV.store.save(false);
    return {rows,summary,removed};
  }
  function render(){
    const out=run();
    const summary=document.getElementById('healthSummary');
    const list=document.getElementById('healthList');
    const removedList=document.getElementById('removedList');
    if(summary){summary.textContent=`Version: ${out.summary.version}\nStorage key: ${out.summary.storageKey}\nTransactions: ${out.summary.transactions}\nRules: ${out.summary.rules}\nMissing required capabilities: ${out.summary.missing}\nChecked: ${out.summary.checkedAt}`;}
    if(list){list.innerHTML=out.rows.map(r=>`<div class="list-item"><span><strong>${GBV.ui.escape(r.name)}</strong><br><small>${GBV.ui.escape(r.detail)}${r.err?' • '+GBV.ui.escape(r.err):''}</small></span><span class="pill">${r.ok?'OK':'Missing'}</span></div>`).join('');}
    if(removedList){removedList.innerHTML=out.removed.map(r=>`<div class="note"><strong>${GBV.ui.escape(r[0])}</strong><br><small>${GBV.ui.escape(r[1])}</small></div>`).join('');}
  }
  document.addEventListener('DOMContentLoaded',()=>{const btn=document.getElementById('runHealthBtn'); if(btn) btn.onclick=()=>{render(); if(GBV.store) GBV.store.toast('Health check complete');}; render();});
  GBV.health={checks,removed,run,render};
})();
