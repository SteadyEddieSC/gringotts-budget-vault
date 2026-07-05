(function(){
  const GBV=window.GBV;
  function bind(){
    document.querySelectorAll('.tab').forEach(btn=>btn.addEventListener('click',()=>GBV.ui.setSection(btn.dataset.section)));
    GBV.ui.$('#backupNowBtn').onclick=()=>GBV.store.backup();
    GBV.ui.$('#clearDataBtn').onclick=()=>{if(confirm('Clear local Gringotts data on this device? Download a backup first if needed.')){GBV.store.clear(); GBV.ui.renderAll(); GBV.ui.renderImportSummary('Local vault cleared.'); if(GBV.diff) GBV.diff.render();}};
    GBV.ui.$('#jsonFile').addEventListener('change',async e=>{const file=e.target.files[0]; if(!file) return; try{const pack=await GBV.importer.readFile(file); const r=GBV.importer.importPack(pack,file.name); GBV.ui.renderImportSummary(`Imported ${r.rows} rows from ${file.name}\nAdded: ${r.added}\nUpdated/duplicates: ${r.updated}\nVault total: ${r.total}`); GBV.ui.renderAll(); GBV.ui.setSection('dashboard');}catch(err){console.error(err); GBV.ui.renderImportSummary(`Import failed: ${err.message}`); GBV.store.toast('Import failed');}});
    GBV.ui.$('#diffFile').addEventListener('change',async e=>{const file=e.target.files[0]; if(!file) return; try{const r=await GBV.diff.analyzeFile(file); GBV.state.meta.lastDiff={fileName:file.name,at:new Date().toISOString(),newRows:r.newRows.length,duplicates:r.duplicates.length,changed:r.changed.length,possibleDuplicates:r.possibleDuplicates.length,missingFromIncoming:r.missingFromIncoming.length}; GBV.store.save(false); GBV.store.toast('Diff preview ready');}catch(err){console.error(err); GBV.store.toast('Diff analysis failed'); document.getElementById('diffSummary').textContent=`Diff failed: ${err.message}`;}});
    GBV.ui.$('#importNewRowsBtn').onclick=()=>{if(confirm('Import only rows that are new to this device?')) GBV.diff.importNewRows();};
    GBV.ui.$('#mergeAllRowsBtn').onclick=()=>{if(confirm('Merge all incoming rows into this device? Download a backup first if needed.')) GBV.diff.mergeAllRows();};
    GBV.ui.$('#sampleBtn').onclick=()=>{const r=GBV.importer.importPack(GBV.importer.demo(),'demo-data-v60.json'); GBV.ui.renderImportSummary(`Loaded demo data. Added ${r.added}, total ${r.total}.`); GBV.ui.renderAll();};
    GBV.ui.$('#ledgerSearch').addEventListener('input',()=>GBV.ui.renderLedger());
    GBV.ui.$('#addRuleBtn').onclick=()=>{try{GBV.rules.add(GBV.ui.$('#ruleMatch').value,GBV.ui.$('#ruleCategory').value,GBV.ui.$('#ruleOwner').value); GBV.ui.$('#ruleMatch').value=''; GBV.ui.$('#ruleCategory').value=''; GBV.ui.$('#ruleOwner').value=''; GBV.ui.renderAll(); GBV.store.toast('Rule added');}catch(e){GBV.store.toast(e.message);}};
    GBV.ui.$('#copyCloudflareBtn').onclick=async()=>{const text='Cloudflare Pages settings for Gringotts: Pages → Connect to Git; repo SteadyEddieSC/gringotts-budget-vault; production branch main; build command blank; output directory /; do not use npx wrangler deploy.'; try{await navigator.clipboard.writeText(text); GBV.store.toast('Checklist copied');}catch(e){GBV.store.toast(text);}};
    GBV.ui.$('#checkUpdateBtn').onclick=()=>GBV.pwa.checkUpdate();
  }
  document.addEventListener('DOMContentLoaded',()=>{GBV.store.load(); bind(); GBV.ui.renderAll(); if(GBV.diff) GBV.diff.render(); GBV.pwa.installPrompt(); GBV.pwa.register();});
})();
