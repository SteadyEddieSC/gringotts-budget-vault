(function(){
  const GBV=window.GBV;
  const diffState={pack:null,fileName:'',rows:[],result:null};
  function normText(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
  function cents(v){return Math.round(Number(v||0)*100);}
  function similarKey(t){return [t.date||'',cents(t.amount),normText(t.merchant||t.name)].join('|');}
  function coreChanged(a,b){return cents(a.amount)!==cents(b.amount)||(a.date||'')!==(b.date||'')||normText(a.merchant)!==normText(b.merchant)||normText(a.category)!==normText(b.category)||(a.pending!==b.pending);}
  function analyzeRows(rows,fileName='incoming file'){
    const current=GBV.state.transactions||[];
    const currentById=new Map(current.map(t=>[t.id,t]));
    const currentBySimilar=new Map(current.map(t=>[similarKey(t),t]));
    const incomingIds=new Set(rows.map(t=>t.id));
    const incomingSimilar=new Set(rows.map(similarKey));
    const result={fileName,totalIncoming:rows.length,currentTotal:current.length,newRows:[],duplicates:[],changed:[],possibleDuplicates:[],missingFromIncoming:[]};
    for(const row of rows){
      const existing=currentById.get(row.id);
      if(existing){
        if(coreChanged(row,existing)) result.changed.push({incoming:row,existing});
        else result.duplicates.push({incoming:row,existing});
      }else{
        const similar=currentBySimilar.get(similarKey(row));
        if(similar) result.possibleDuplicates.push({incoming:row,existing:similar});
        else result.newRows.push(row);
      }
    }
    for(const row of current){
      if(!incomingIds.has(row.id)&&!incomingSimilar.has(similarKey(row))) result.missingFromIncoming.push(row);
    }
    diffState.rows=rows; diffState.fileName=fileName; diffState.result=result; return result;
  }
  function summarize(result){
    if(!result) return 'No file analyzed yet.';
    return `File: ${result.fileName}\nIncoming rows: ${result.totalIncoming}\nCurrent vault rows: ${result.currentTotal}\nNew rows: ${result.newRows.length}\nExact duplicates: ${result.duplicates.length}\nChanged same-ID rows: ${result.changed.length}\nPossible duplicates: ${result.possibleDuplicates.length}\nCurrent rows missing from incoming: ${result.missingFromIncoming.length}`;
  }
  function renderSample(rows){
    if(!rows.length) return '<p>No rows in this bucket.</p>';
    return `<div class="table-wrap"><table class="ledger"><thead><tr><th>Date</th><th>Merchant</th><th>Category</th><th>Amount</th></tr></thead><tbody>${rows.slice(0,25).map(t=>`<tr><td>${GBV.ui.escape(t.date)}</td><td>${GBV.ui.escape(t.merchant)}</td><td>${GBV.ui.escape(t.category)}</td><td class="${t.amount<0?'amount-income':'amount-outflow'}">${t.amount<0?'+':'−'}${GBV.importer.money(Math.abs(t.amount))}</td></tr>`).join('')}</tbody></table></div>`;
  }
  function render(){
    const result=diffState.result; const summary=document.getElementById('diffSummary'); const buckets=document.getElementById('diffBuckets');
    if(summary) summary.textContent=summarize(result);
    if(!buckets) return;
    if(!result){buckets.innerHTML='<p>Choose a JSON pack to preview changes before importing.</p>'; return;}
    buckets.innerHTML=`<div class="grid two"><article class="card"><h3>New rows</h3>${renderSample(result.newRows)}</article><article class="card"><h3>Changed same-ID rows</h3>${renderSample(result.changed.map(x=>x.incoming))}</article><article class="card"><h3>Possible duplicates</h3>${renderSample(result.possibleDuplicates.map(x=>x.incoming))}</article><article class="card"><h3>Missing from incoming</h3>${renderSample(result.missingFromIncoming)}</article></div>`;
    const importNew=document.getElementById('importNewRowsBtn'); const mergeAll=document.getElementById('mergeAllRowsBtn');
    if(importNew) importNew.disabled=!result.newRows.length;
    if(mergeAll) mergeAll.disabled=!result.totalIncoming;
  }
  async function analyzeFile(file){
    const pack=await GBV.importer.readFile(file); const rows=GBV.importer.normalizePack(pack); diffState.pack=pack; analyzeRows(rows,file.name); render(); return diffState.result;
  }
  function importNewRows(){const result=diffState.result; if(!result) return; const r=GBV.importer.importRows(result.newRows,`diff-new-${result.fileName}`,{preserveExisting:true}); GBV.store.toast(`Imported ${r.added} new rows`); GBV.ui.renderAll(); analyzeRows(diffState.rows,diffState.fileName); render();}
  function mergeAllRows(){const result=diffState.result; if(!result) return; const r=GBV.importer.importRows(diffState.rows,`diff-merge-${result.fileName}`,{preserveExisting:true}); GBV.store.toast(`Merged ${r.rows} rows`); GBV.ui.renderAll(); analyzeRows(diffState.rows,diffState.fileName); render();}
  GBV.diff={state:diffState,analyzeRows,analyzeFile,render,importNewRows,mergeAllRows};
})();
