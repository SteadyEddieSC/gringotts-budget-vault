(function(){
  const GBV=window.GBV;
  function inWindow(days=60){const start=new Date(Date.now()-days*86400000).toISOString().slice(0,10); return GBV.state.transactions.filter(t=>(t.date||'')>=start&&!t.pending);}
  function sum(rows,filter){return rows.filter(filter).reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0);}
  function group(rows,keyFn,filter=()=>true){const out=new Map(); rows.filter(filter).forEach(t=>{const k=keyFn(t)||'Other'; out.set(k,(out.get(k)||0)+Math.abs(Number(t.amount||0)));}); return [...out.entries()].sort((a,b)=>b[1]-a[1]);}
  function metrics(){const rows=inWindow(GBV.state.settings.windowDays||60); const all=GBV.state.transactions; const outflow=sum(rows,t=>t.amount>0); const income=sum(rows,t=>t.amount<0); const reviewed=all.filter(t=>t.reviewed).length; return {rows,all,outflow,income,net:income-outflow,reviewed,unreviewed:all.length-reviewed,category:group(rows,t=>t.category,t=>t.amount>0),merchant:group(rows,t=>t.merchant,t=>t.amount>0)};}
  function notes(m){const notes=[]; if(!m.all.length) notes.push('Import a transaction pack to populate the dashboard.'); if(m.unreviewed>0) notes.push(`${m.unreviewed} transactions still need review. Start with the Review tab.`); if(m.outflow>m.income&&m.income>0) notes.push('Recent outflow is higher than recent income. Check transfers and large purchases before drawing conclusions.'); if(m.category[0]) notes.push(`Largest recent spending category is ${m.category[0][0]} at ${GBV.importer.money(m.category[0][1])}.`); if(GBV.state.rules.length<3&&m.all.length) notes.push('Add merchant rules for repeat merchants to speed up future imports.'); return notes;}
  GBV.reports={inWindow,sum,group,metrics,notes};
})();
