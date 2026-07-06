(function(){
  const KEY='gringottsDebtPlanner.v1';
  const PROMO_KEY='gringottsPromoAprWatch.v1';
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function pct(n){return `${Number(n||0).toFixed(2)}%`;}
  function esc(s){return window.GBV?.ui?.escape?window.GBV.ui.escape(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{extraPayment:0,debts:[]};}catch(e){return {extraPayment:0,debts:[]};}}
  function save(data){localStorage.setItem(KEY,JSON.stringify(data));}
  function loadPromos(){try{return (JSON.parse(localStorage.getItem(PROMO_KEY))||{cards:[]}).cards||[];}catch(e){return [];}}
  function daysUntil(date){if(!date) return null; const now=new Date(); now.setHours(0,0,0,0); const d=new Date(date+'T00:00:00'); return Math.ceil((d-now)/86400000);}
  function monthsUntil(date){const days=daysUntil(date); return days==null?0:Math.max(0,Math.ceil(days/30.4375));}
  function cleanDebt(d){return {id:d.id||`debt_${Date.now()}_${Math.random().toString(16).slice(2)}`,name:String(d.name||'Debt').trim(),balance:Math.max(0,Number(d.balance||0)),apr:Math.max(0,Number(d.apr||0)),minPayment:Math.max(0,Number(d.minPayment||0)),notes:String(d.notes||'').trim()};}
  function cleanPromo(c){return {id:c.id||`promo_${Date.now()}`,name:String(c.name||'Promo balance').trim(),balance:Math.max(0,Number(c.balance||0)),promoApr:Math.max(0,Number(c.promoApr||0)),regularApr:Math.max(0,Number(c.regularApr||0)),promoEnd:String(c.promoEnd||''),minPayment:Math.max(0,Number(c.minPayment||0)),notes:String(c.notes||'').trim()};}
  function promoTarget(c){const p=cleanPromo(c); const months=monthsUntil(p.promoEnd); const days=daysUntil(p.promoEnd); const target=months>0?p.balance/months:p.balance; let status='Needs date'; if(days!=null){if(days<0) status='Expired'; else if(days<=60) status='Urgent'; else if(target>p.minPayment*2&&p.balance>0) status='Above minimum'; else status='On track';} return {...p,months,days,target,status};}
  function addDebt(d){const data=load(); data.debts.push(cleanDebt(d)); save(data); render(); window.GBV?.store?.toast('Debt added locally');}
  function removeDebt(id){const data=load(); data.debts=data.debts.filter(d=>d.id!==id); save(data); render(); window.GBV?.store?.toast('Debt removed');}
  function saveScenario(extra){const data=load(); data.extraPayment=Math.max(0,Number(extra||0)); save(data); render(); window.GBV?.store?.toast('Debt scenario saved');}
  function orderDebts(strategy,debts){const rows=debts.map(cleanDebt).filter(d=>d.balance>0); if(strategy==='avalanche') return rows.sort((a,b)=>b.apr-a.apr||a.balance-b.balance); return rows.sort((a,b)=>a.balance-b.balance||b.apr-a.apr);}
  function simulate(strategy){
    const data=load(); const base=orderDebts(strategy,data.debts); const debts=base.map(d=>({...d}));
    let month=0,totalInterest=0,totalPaid=0; const schedule=[]; const fixedMin=debts.reduce((a,d)=>a+d.minPayment,0); const extra=Number(data.extraPayment||0); const maxMonths=600;
    while(debts.some(d=>d.balance>0.01)&&month<maxMonths){
      month++;
      debts.forEach(d=>{if(d.balance>0){const interest=d.balance*(d.apr/100/12); d.balance+=interest; totalInterest+=interest;}});
      let pool=fixedMin+extra;
      debts.forEach(d=>{if(d.balance>0&&pool>0){const p=Math.min(d.minPayment,d.balance,pool); d.balance-=p; pool-=p; totalPaid+=p;}});
      const focus=orderDebts(strategy,debts).find(d=>d.balance>0.01);
      if(focus&&pool>0){const d=debts.find(x=>x.id===focus.id); const p=Math.min(pool,d.balance); d.balance-=p; pool-=p; totalPaid+=p;}
      const paidOff=debts.filter(d=>d.balance<=0.01&&!d.done).map(d=>{d.done=month; return d.name;});
      if(month<=36||paidOff.length) schedule.push({month,focus:focus?.name||'Complete',remaining:debts.reduce((a,d)=>a+Math.max(0,d.balance),0),paidOff});
    }
    return {strategy,months:month,totalInterest,totalPaid,totalBalance:base.reduce((a,d)=>a+d.balance,0),order:base,schedule,extra,fixedMin,complete:month<maxMonths};
  }
  function promoSummary(){const promos=loadPromos().map(cleanPromo).filter(p=>p.balance>0); const targets=promos.map(promoTarget).sort((a,b)=>(a.days??99999)-(b.days??99999)||b.regularApr-a.regularApr); const total=targets.reduce((a,p)=>a+p.balance,0); const targetTotal=targets.reduce((a,p)=>a+p.target,0); const urgent=targets.filter(p=>['Expired','Urgent','Needs date'].includes(p.status)); return {promos:targets,total,targetTotal,urgent};}
  function renderSummary(){
    const data=load(); const debts=data.debts.map(cleanDebt); const total=debts.reduce((a,d)=>a+d.balance,0); const min=debts.reduce((a,d)=>a+d.minPayment,0); const promo=promoSummary();
    const snow=simulate('snowball'); const ava=simulate('avalanche');
    const el=document.getElementById('debtSummary'); if(!el) return;
    el.textContent=`Manual debt entered: ${money(total)}\nPromo APR balances tracked: ${money(promo.total)}\nCombined debt/promo exposure: ${money(total+promo.total)}\nMinimum payments: ${money(min)}\nPromo target payoff total: ${money(promo.targetTotal)}/mo\nExtra monthly payment: ${money(data.extraPayment||0)}\nSnowball estimate: ${snow.complete?snow.months+' months':'over 600 months'} • interest ${money(snow.totalInterest)}\nAvalanche estimate: ${ava.complete?ava.months+' months':'over 600 months'} • interest ${money(ava.totalInterest)}\nPriority guidance: ${promo.urgent.length?'promo APR deadlines first, then avalanche/snowball':'avalanche usually saves interest; snowball may feel easier'}.`;
  }
  function renderForm(){
    const data=load(); const form=document.getElementById('debtForm'); if(!form) return;
    form.innerHTML=`<label>Name <input id="debtName" type="text" placeholder="Credit card, truck, loan"></label><label>Balance <input id="debtBalance" type="number" step="0.01" placeholder="0.00"></label><label>APR % <input id="debtApr" type="number" step="0.01" placeholder="0.00"></label><label>Minimum payment <input id="debtMin" type="number" step="0.01" placeholder="0.00"></label><label style="grid-column:1/-1">Notes <input id="debtNotes" type="text" placeholder="Optional"></label><button id="addDebtBtn" class="btn primary" type="button">Add debt</button><label style="grid-column:1/-1">Extra monthly payoff amount <input id="debtExtra" type="number" step="0.01" value="${Number(data.extraPayment||0)}"></label><button id="saveDebtScenarioBtn" class="btn secondary" type="button">Save payoff scenario</button>`;
    document.getElementById('addDebtBtn').onclick=()=>addDebt({name:document.getElementById('debtName').value,balance:document.getElementById('debtBalance').value,apr:document.getElementById('debtApr').value,minPayment:document.getElementById('debtMin').value,notes:document.getElementById('debtNotes').value});
    document.getElementById('saveDebtScenarioBtn').onclick=()=>saveScenario(document.getElementById('debtExtra').value);
  }
  function renderList(){
    const GBV=window.GBV; const list=document.getElementById('debtList'); if(!list) return; const debts=load().debts.map(cleanDebt);
    list.innerHTML=debts.map(d=>`<div class="list-item"><span><strong>${GBV.ui.escape(d.name)}</strong><br><small>${money(d.balance)} • ${pct(d.apr)} APR • min ${money(d.minPayment)}${d.notes?' • '+GBV.ui.escape(d.notes):''}</small></span><button class="btn danger" data-remove-debt="${d.id}" type="button">Remove</button></div>`).join('')||'<p>No manual debts entered yet. Promo APR balances entered on the Promo APR tab will still appear in the payoff focus below.</p>';
    list.querySelectorAll('[data-remove-debt]').forEach(btn=>btn.onclick=()=>removeDebt(btn.dataset.removeDebt));
  }
  function promoCard(){const p=promoSummary(); if(!p.promos.length) return '<article class="card"><h3>Promo APR payoff focus</h3><p>No promo APR balances entered yet. Add 0% offers in Promo APR Watch to include payoff-by-date targets here.</p></article>'; return `<article class="card"><h3>Promo APR payoff focus</h3><p>Target total: ${money(p.targetTotal)}/mo across ${p.promos.length} promo balance${p.promos.length===1?'':'s'}.</p>${p.promos.map(x=>`<div class="list-item"><span><strong>${esc(x.name)}</strong> <span class="pill">${esc(x.status)}</span><br><small>${money(x.balance)} • promo ends ${esc(x.promoEnd||'date needed')} • ${x.days==null?'date needed':x.days+' days'} • regular ${pct(x.regularApr)}</small></span><strong>${money(x.target)}/mo</strong></div>`).join('')}</article>`;}
  function renderPlans(){
    const GBV=window.GBV; const box=document.getElementById('debtPlans'); if(!box) return; const snow=simulate('snowball'), ava=simulate('avalanche');
    function planCard(p,title){return `<article class="card"><h3>${title}</h3><p>${p.complete?p.months+' months':'Over 600 months'} • ${money(p.totalInterest)} estimated interest</p>${p.order.map((d,i)=>`<div class="list-item"><span><strong>${i+1}. ${GBV.ui.escape(d.name)}</strong><br><small>${money(d.balance)} • ${pct(d.apr)} APR</small></span></div>`).join('')||'<p>No manual debts in this plan yet.</p>'}</article>`;}
    box.innerHTML=`${promoCard()}<div class="grid two" style="margin-top:1rem">${planCard(snow,'Snowball order')}${planCard(ava,'Avalanche order')}</div>`;
  }
  function render(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v78'; GBV.STORAGE_KEY='gringottsBudgetVault.v78';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v78 Debt Planner II + Promo APR';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v78';
    renderSummary(); renderForm(); renderList(); renderPlans();
  }
  document.addEventListener('DOMContentLoaded',render);
  window.GringottsDebt={load,save,addDebt,removeDebt,simulate,promoSummary,render};
})();
