(function(){
  const MONTH_KEY='gringottsExecutiveMonth.v1';
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function monthKey(d){return String(d||'').slice(0,7);}
  function currentKey(){return new Date().toISOString().slice(0,7);}
  function txs(){return (window.GBV?.state?.transactions||[]).filter(t=>t&&t.date&&!t.pending);}
  function availableMonth(){const keys=[...new Set(txs().map(t=>monthKey(t.date)).filter(Boolean))].sort(); const now=currentKey(); return keys.includes(now)?now:(keys[keys.length-1]||now);}
  function selectedMonth(){const saved=localStorage.getItem(MONTH_KEY); return saved||availableMonth();}
  function setSelectedMonth(key){if(/^\d{4}-\d{2}$/.test(key)){localStorage.setItem(MONTH_KEY,key);} render();}
  function addMonths(key,delta){const [y,m]=String(key).split('-').map(Number); const d=new Date(y,m-1+delta,1); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;}
  function label(key){const [y,m]=String(key).split('-').map(Number); if(!y||!m) return key||'Month'; return new Date(y,m-1,1).toLocaleString(undefined,{month:'short',year:'2-digit'}).toUpperCase().replace(' ',' ');}
  function fullLabel(key){const [y,m]=String(key).split('-').map(Number); if(!y||!m) return key||'unknown'; return new Date(y,m-1,1).toLocaleString(undefined,{month:'long',year:'numeric'});}
  function amount(t){return Number(t.amount||0);} function outflow(t){return amount(t)>0?Math.abs(amount(t)):0;} function income(t){return amount(t)<0?Math.abs(amount(t)):0;}
  function cat(t){return String(t.category||t.personal_finance_category_primary||'Other').trim()||'Other';}
  function isEatingOut(category){const c=String(category||'').toLowerCase(); return c.includes('eating out')||c.includes('dining')||c.includes('restaurant')||c.includes('fast food')||c.includes('coffee');}
  function rowsForMonth(key){return txs().filter(t=>monthKey(t.date)===key);}
  function ytdRows(key){const year=String(key||selectedMonth()).slice(0,4); return txs().filter(t=>String(t.date).startsWith(year+'-')&&monthKey(t.date)<=key);}
  function totals(rows){return {income:rows.reduce((a,t)=>a+income(t),0),outflow:rows.reduce((a,t)=>a+outflow(t),0),net:rows.reduce((a,t)=>a+income(t)-outflow(t),0)};}
  function categoryOutflows(rows){const m=new Map(); rows.forEach(t=>{const v=outflow(t); if(v>0){const k=cat(t); m.set(k,(m.get(k)||0)+v);}}); return m;}
  function diffCategories(nowRows,lastRows){const now=categoryOutflows(nowRows), last=categoryOutflows(lastRows); const keys=[...new Set([...now.keys(),...last.keys()])]; const diffs=keys.map(k=>({category:k,current:now.get(k)||0,last:last.get(k)||0,change:(now.get(k)||0)-(last.get(k)||0)})).filter(x=>Math.abs(x.change)>0.005); return {increase:[...diffs].sort((a,b)=>b.change-a.change)[0]||null,decrease:[...diffs].sort((a,b)=>a.change-b.change)[0]||null,diffs};}
  function eatingOut(rows){let total=0; categoryOutflows(rows).forEach((v,k)=>{if(isEatingOut(k)) total+=v;}); return total;}
  function metrics(key=selectedMonth()){const last=addMonths(key,-1); const currentRows=rowsForMonth(key); const previousRows=rowsForMonth(last); const ytd=ytdRows(key); return {key,last,currentRows,previousRows,ytdRows:ytd,current:totals(currentRows),previous:totals(previousRows),ytd:totals(ytd),eatingCurrent:eatingOut(currentRows),eatingPrevious:eatingOut(previousRows),categories:diffCategories(currentRows,previousRows)};}
  function direction(n){if(n>0) return 'up'; if(n<0) return 'down'; return 'flat';}
  function categoryPhrase(item,type){if(!item) return type==='increase'?'No category increase stands out yet.':'No category decrease stands out yet.'; const verb=item.change>=0?'increased':'decreased'; return `${item.category} ${verb} by ${money(Math.abs(item.change))} compared with last month (${money(item.current)} vs ${money(item.last)}).`;}
  function buildParagraph(key=selectedMonth()){
    if(!txs().length) return 'Executive summary: there is no transaction history loaded in this browser profile yet, so the monthly readout cannot compare this month, last month, and year to date. Restore or import the populated vault first, then run Safety before making decisions.';
    const m=metrics(key); const spendChange=m.current.outflow-m.previous.outflow; const incomeChange=m.current.income-m.previous.income; const eatingChange=m.eatingCurrent-m.eatingPrevious;
    const monthText=`Executive summary for ${fullLabel(m.key)}: month-to-date income is ${money(m.current.income)} and spending is ${money(m.current.outflow)}, leaving net cash flow of ${money(m.current.net)}.`;
    const compareText=m.previousRows.length?`Compared with ${fullLabel(m.last)}, spending is ${direction(spendChange)} ${money(Math.abs(spendChange))} and income is ${direction(incomeChange)} ${money(Math.abs(incomeChange))}.`:`There is not enough prior-month data loaded to make a full comparison against ${fullLabel(m.last)}.`;
    const ytdText=`Year to date, income totals ${money(m.ytd.income)}, spending totals ${money(m.ytd.outflow)}, and net cash flow is ${money(m.ytd.net)}.`;
    const foodText=`Eating out / dining is ${money(m.eatingCurrent)} this month${m.previousRows.length?`, ${direction(eatingChange)} ${money(Math.abs(eatingChange))} from last month`:''}.`;
    let action='Next action: review the category with the largest increase first, then check dining/eating out before approving extra debt payoff or discretionary spending.';
    if(m.current.net<0) action='Next action: because selected-month net cash flow is negative, pause optional spending and inspect the largest spending increase before making new payoff commitments.';
    if(m.eatingCurrent>0&&eatingChange>100) action='Next action: eating out is moving materially higher, so review dining transactions and decide whether to tighten the rest of the month.';
    return [monthText,compareText,ytdText,foodText,categoryPhrase(m.categories.increase,'increase'),categoryPhrase(m.categories.decrease,'decrease'),action].join(' ');
  }
  function removeDashboardHelper(){const row=document.querySelector('#section-dashboard .section-title-row div'); if(row){[...row.querySelectorAll('p')].forEach(p=>p.remove());}}
  function pickerHtml(key){return `<div class="button-row" style="justify-content:center;margin:.85rem 0 1rem"><button id="execMonthPrev" class="btn secondary" type="button" aria-label="Previous month" style="min-width:54px;font-size:1.35rem">‹</button><button id="execMonthChoose" class="btn secondary" type="button" aria-label="Choose executive summary month" style="min-width:140px;font-weight:800;color:#f6c653;letter-spacing:.08em">${label(key)}</button><button id="execMonthNext" class="btn secondary" type="button" aria-label="Next month" style="min-width:54px;font-size:1.35rem">›</button><input id="execMonthInput" type="month" value="${key}" style="position:absolute;opacity:0;pointer-events:none;width:1px;height:1px"></div>`;}
  function render(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v72'; GBV.STORAGE_KEY='gringottsBudgetVault.v72';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v72 Dashboard Month Picker';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v72';
    removeDashboardHelper();
    const dash=document.getElementById('section-dashboard'); if(!dash) return;
    let card=document.getElementById('dashboardExecutiveBriefing');
    if(!card){card=document.createElement('article'); card.id='dashboardExecutiveBriefing'; card.className='card'; card.style.margin='0 0 1rem 0'; const anchor=document.getElementById('kpiGrid'); dash.insertBefore(card,anchor||dash.children[1]||dash.firstChild);}
    const key=selectedMonth();
    card.innerHTML=`<div class="section-title-row"><div><h3>Executive summary</h3></div></div>${pickerHtml(key)}<p id="dashboardExecutiveText" style="font-size:1.02rem;line-height:1.65;margin:.5rem 0 0"></p>`;
    const text=document.getElementById('dashboardExecutiveText'); if(text) text.textContent=buildParagraph(key);
    const prev=document.getElementById('execMonthPrev'), next=document.getElementById('execMonthNext'), choose=document.getElementById('execMonthChoose'), input=document.getElementById('execMonthInput');
    if(prev) prev.onclick=()=>setSelectedMonth(addMonths(selectedMonth(),-1));
    if(next) next.onclick=()=>setSelectedMonth(addMonths(selectedMonth(),1));
    if(input) input.onchange=()=>setSelectedMonth(input.value);
    if(choose) choose.onclick=()=>{if(input&&input.showPicker){input.showPicker();}else if(input){input.click(); input.focus();}else{const v=prompt('Enter month as YYYY-MM',selectedMonth()); if(v) setSelectedMonth(v);}};
    const actions=document.getElementById('monthlyExecutiveBriefingNote'); if(actions) actions.textContent=buildParagraph(key);
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(render,80); setTimeout(render,700); setTimeout(render,1300);});
  window.GringottsDashboardMonthPicker={metrics,buildParagraph,selectedMonth,setSelectedMonth,render};
})();
