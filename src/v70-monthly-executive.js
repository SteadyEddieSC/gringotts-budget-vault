(function(){
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function monthKey(d){return String(d||'').slice(0,7);}
  function label(key){const [y,m]=String(key||'').split('-').map(Number); if(!y||!m) return key||'unknown'; return new Date(y,m-1,1).toLocaleString(undefined,{month:'long',year:'numeric'});}
  function prevKey(key){const [y,m]=String(key).split('-').map(Number); const d=new Date(y,m-2,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function currentKey(){return new Date().toISOString().slice(0,7);}
  function txs(){return (window.GBV?.state?.transactions||[]).filter(t=>t&&t.date&&!t.pending);}
  function amount(t){return Number(t.amount||0);}
  function outflow(t){return amount(t)>0?Math.abs(amount(t)):0;}
  function income(t){return amount(t)<0?Math.abs(amount(t)):0;}
  function cat(t){return String(t.category||t.personal_finance_category_primary||'Other').trim()||'Other';}
  function isEatingOut(category){const c=String(category||'').toLowerCase(); return c.includes('eating out')||c.includes('dining')||c.includes('restaurant')||c.includes('fast food')||c.includes('coffee');}
  function rowsForMonth(key){return txs().filter(t=>monthKey(t.date)===key);}
  function ytdRows(key){const year=String(key||currentKey()).slice(0,4); return txs().filter(t=>String(t.date).startsWith(year+'-')&&monthKey(t.date)<=key);}
  function totals(rows){return {income:rows.reduce((a,t)=>a+income(t),0),outflow:rows.reduce((a,t)=>a+outflow(t),0),net:rows.reduce((a,t)=>a+income(t)-outflow(t),0)};}
  function categoryOutflows(rows){const m=new Map(); rows.forEach(t=>{const v=outflow(t); if(v>0){const k=cat(t); m.set(k,(m.get(k)||0)+v);}}); return m;}
  function diffCategories(nowRows,lastRows){const now=categoryOutflows(nowRows); const last=categoryOutflows(lastRows); const keys=[...new Set([...now.keys(),...last.keys()])]; const diffs=keys.map(k=>({category:k,current:now.get(k)||0,last:last.get(k)||0,change:(now.get(k)||0)-(last.get(k)||0)})).filter(x=>Math.abs(x.change)>0.005); const inc=[...diffs].sort((a,b)=>b.change-a.change)[0]||null; const dec=[...diffs].sort((a,b)=>a.change-b.change)[0]||null; return {increase:inc,decrease:dec,diffs};}
  function eatingOut(rows){let total=0; categoryOutflows(rows).forEach((v,k)=>{if(isEatingOut(k)) total+=v;}); return total;}
  function availableMonth(){const keys=[...new Set(txs().map(t=>monthKey(t.date)).filter(Boolean))].sort(); const now=currentKey(); return keys.includes(now)?now:(keys[keys.length-1]||now);}
  function metrics(){const key=availableMonth(); const last=prevKey(key); const currentRows=rowsForMonth(key); const previousRows=rowsForMonth(last); const ytd=ytdRows(key); return {key,last,currentRows,previousRows,ytdRows:ytd,current:totals(currentRows),previous:totals(previousRows),ytd:totals(ytd),eatingCurrent:eatingOut(currentRows),eatingPrevious:eatingOut(previousRows),categories:diffCategories(currentRows,previousRows)};}
  function direction(n){if(n>0) return 'up'; if(n<0) return 'down'; return 'flat';}
  function categoryPhrase(item,type){if(!item) return type==='increase'?'No category increase stands out yet.':'No category decrease stands out yet.'; const verb=item.change>=0?'increased':'decreased'; return `${item.category} ${verb} by ${money(Math.abs(item.change))} compared with last month (${money(item.current)} vs ${money(item.last)}).`;}
  function buildParagraph(){
    const txCount=txs().length; if(!txCount) return 'Executive summary: there is no transaction history loaded in this browser profile yet, so the monthly readout cannot compare this month, last month, and year to date. Restore or import the populated vault first, then run Safety before making decisions.';
    const m=metrics(); const spendChange=m.current.outflow-m.previous.outflow; const incomeChange=m.current.income-m.previous.income; const eatingChange=m.eatingCurrent-m.eatingPrevious;
    const monthText=`Executive summary for ${label(m.key)}: month-to-date income is ${money(m.current.income)} and spending is ${money(m.current.outflow)}, leaving net cash flow of ${money(m.current.net)}.`;
    const compareText=m.previousRows.length?`Compared with ${label(m.last)}, spending is ${direction(spendChange)} ${money(Math.abs(spendChange))} and income is ${direction(incomeChange)} ${money(Math.abs(incomeChange))}.`:`There is not enough prior-month data loaded to make a full comparison against ${label(m.last)}.`;
    const ytdText=`Year to date, income totals ${money(m.ytd.income)}, spending totals ${money(m.ytd.outflow)}, and net cash flow is ${money(m.ytd.net)}.`;
    const foodText=`Eating out / dining is ${money(m.eatingCurrent)} this month${m.previousRows.length?`, ${direction(eatingChange)} ${money(Math.abs(eatingChange))} from last month`:''}.`;
    const incText=categoryPhrase(m.categories.increase,'increase'); const decText=categoryPhrase(m.categories.decrease,'decrease');
    let action='Next action: review the category with the largest increase first, then check dining/eating out before approving extra debt payoff or discretionary spending.';
    if(m.current.net<0) action='Next action: because current-month net cash flow is negative, pause optional spending and inspect the largest spending increase before making new payoff commitments.';
    if(m.eatingCurrent>0&&eatingChange>100) action='Next action: eating out is moving materially higher, so review dining transactions and decide whether to tighten the rest of the month.';
    return [monthText,compareText,ytdText,foodText,incText,decText,action].join(' ');
  }
  function insertDashboard(){
    const dash=document.getElementById('section-dashboard'); if(!dash) return;
    let card=document.getElementById('dashboardExecutiveBriefing');
    if(!card){card=document.createElement('article'); card.id='dashboardExecutiveBriefing'; card.className='card'; card.style.margin='0 0 1rem 0'; const anchor=document.getElementById('kpiGrid'); dash.insertBefore(card,anchor||dash.children[1]||dash.firstChild);}
    card.innerHTML='<div class="section-title-row"><div><h3>Executive summary</h3><p>Current month, prior month, year to date, and category movement.</p></div><span class="pill">v70</span></div><p id="dashboardExecutiveText" style="font-size:1.02rem;line-height:1.65;margin:.5rem 0 0"></p>';
  }
  function render(){const GBV=window.GBV; if(GBV){GBV.VERSION='v70'; GBV.STORAGE_KEY='gringottsBudgetVault.v70';} const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v70 Monthly Executive Summary'; const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v70'; insertDashboard(); const text=document.getElementById('dashboardExecutiveText'); if(text) text.textContent=buildParagraph(); const actions=document.getElementById('briefingActions'); if(actions){let note=document.getElementById('monthlyExecutiveBriefingNote'); if(!note){note=document.createElement('div'); note.id='monthlyExecutiveBriefingNote'; note.className='note'; actions.prepend(note);} note.textContent=buildParagraph();}}
  document.addEventListener('DOMContentLoaded',function(){setTimeout(render,0); setTimeout(render,400);});
  window.GringottsMonthlyExecutive={metrics,buildParagraph,render};
})();
