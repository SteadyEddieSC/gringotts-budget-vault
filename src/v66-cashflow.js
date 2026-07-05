(function(){
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function iso(d){return d.toISOString().slice(0,10);}
  function daysBetween(a,b){return Math.round((new Date(b)-new Date(a))/86400000);}
  function txs(){return (window.GBV?.state?.transactions||[]).filter(t=>!t.pending&&t.date);}
  function recent(days){const start=Date.now()-days*86400000; return txs().filter(t=>new Date(t.date).getTime()>=start);}
  function sum(rows,fn){return rows.filter(fn).reduce((a,t)=>a+Math.abs(Number(t.amount||0)),0);}
  function groupByMerchant(rows){const map=new Map(); rows.forEach(t=>{const k=t.merchant||t.name||'Unknown'; if(!map.has(k)) map.set(k,[]); map.get(k).push(t);}); return map;}
  function recurringCandidates(){
    const rows=recent(180).filter(t=>Number(t.amount)>0);
    const groups=[...groupByMerchant(rows).entries()].map(([merchant,items])=>{
      items.sort((a,b)=>a.date.localeCompare(b.date));
      const amounts=items.map(t=>Math.abs(Number(t.amount||0)));
      const avg=amounts.reduce((a,b)=>a+b,0)/Math.max(1,amounts.length);
      const gaps=[]; for(let i=1;i<items.length;i++) gaps.push(daysBetween(items[i-1].date,items[i].date));
      const avgGap=gaps.length?gaps.reduce((a,b)=>a+b,0)/gaps.length:30;
      const monthly=items.length>=2 && avg>15 && avgGap>=20 && avgGap<=45;
      const weekly=items.length>=4 && avg>10 && avgGap>=5 && avgGap<=10;
      const cadence=monthly?'monthly':weekly?'weekly':'';
      const last=items[items.length-1];
      const next=new Date(last.date); next.setDate(next.getDate()+(weekly?7:30));
      return {merchant,count:items.length,avg,avgGap,cadence,lastDate:last.date,nextDate:iso(next),category:last.category||'Other'};
    }).filter(x=>x.cadence).sort((a,b)=>b.avg-a.avg);
    return groups.slice(0,25);
  }
  function scenarioSettings(){
    const raw=localStorage.getItem('gringottsCashflowScenario.v1');
    try{return {...{startingCash:0,reserveTarget:0,lookaheadDays:30},...(raw?JSON.parse(raw):{})};}catch(e){return {startingCash:0,reserveTarget:0,lookaheadDays:30};}
  }
  function saveScenario(s){localStorage.setItem('gringottsCashflowScenario.v1',JSON.stringify(s));}
  function metrics(){
    const r30=recent(30), r60=recent(60);
    const income30=sum(r30,t=>Number(t.amount)<0), out30=sum(r30,t=>Number(t.amount)>0);
    const income60=sum(r60,t=>Number(t.amount)<0), out60=sum(r60,t=>Number(t.amount)>0);
    const recurring=recurringCandidates();
    const s=scenarioSettings();
    const horizon=Number(s.lookaheadDays||30);
    const today=new Date(); const end=new Date(Date.now()+horizon*86400000);
    const upcoming=recurring.filter(r=>new Date(r.nextDate)<=end);
    const projectedBills=upcoming.reduce((a,b)=>a+b.avg,0);
    const avgDailyFlexible=Math.max(0,(out60/60)-(projectedBills/Math.max(1,horizon)));
    const safe=Number(s.startingCash||0)+income30-projectedBills-Number(s.reserveTarget||0);
    return {income30,out30,income60,out60,net30:income30-out30,recurring,upcoming,projectedBills,avgDailyFlexible,safe,settings:s,horizon};
  }
  function render(){
    const GBV=window.GBV; if(!GBV) return;
    GBV.VERSION='v66'; GBV.STORAGE_KEY='gringottsBudgetVault.v66';
    const m=metrics();
    const summary=document.getElementById('cashflowSummary');
    if(summary){summary.textContent=`Last 30 days income: ${money(m.income30)}\nLast 30 days outflow: ${money(m.out30)}\nLast 30 days net: ${money(m.net30)}\nProjected recurring bills next ${m.horizon} days: ${money(m.projectedBills)}\nScenario safe-to-spend estimate: ${money(m.safe)}\nNote: this uses imported transactions only; it is not a live bank balance.`;}
    const settings=document.getElementById('cashflowScenario');
    if(settings){settings.innerHTML=`<label>Starting cash / available checking estimate <input id="cashStart" type="number" step="0.01" value="${Number(m.settings.startingCash||0)}"></label><label>Reserve target to protect <input id="cashReserve" type="number" step="0.01" value="${Number(m.settings.reserveTarget||0)}"></label><label>Lookahead days <input id="cashDays" type="number" min="7" max="90" value="${Number(m.settings.lookaheadDays||30)}"></label><button id="saveCashflowScenarioBtn" class="btn primary" type="button">Save scenario</button>`; const btn=document.getElementById('saveCashflowScenarioBtn'); if(btn) btn.onclick=function(){saveScenario({startingCash:Number(document.getElementById('cashStart').value||0),reserveTarget:Number(document.getElementById('cashReserve').value||0),lookaheadDays:Number(document.getElementById('cashDays').value||30)}); render(); GBV.store.toast('Cash-flow scenario saved');};}
    const bills=document.getElementById('cashflowBills');
    if(bills){bills.innerHTML=m.upcoming.map(b=>`<div class="list-item"><span><strong>${GBV.ui.escape(b.merchant)}</strong><br><small>${GBV.ui.escape(b.category)} • ${b.cadence} • next est. ${GBV.ui.escape(b.nextDate)} • ${b.count} hits</small></span><strong>${money(b.avg)}</strong></div>`).join('')||'<p>No upcoming recurring bills detected yet. Add more transaction history or rules to improve detection.</p>';}
    const recurring=document.getElementById('cashflowRecurring');
    if(recurring){recurring.innerHTML=m.recurring.map(b=>`<div class="list-item"><span><strong>${GBV.ui.escape(b.merchant)}</strong><br><small>${b.cadence} avg every ${Math.round(b.avgGap)} days • last ${GBV.ui.escape(b.lastDate)}</small></span><strong>${money(b.avg)}</strong></div>`).join('')||'<p>No recurring candidates detected.</p>';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v66 Cash-Flow Command Center';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v66';
  }
  document.addEventListener('DOMContentLoaded',render);
  window.GringottsCashflow={metrics,render,recurringCandidates,scenarioSettings,saveScenario};
})();
