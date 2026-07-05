(function(){
  const KEY='gringottsDebtPlanner.v1';
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function pct(n){return `${Number(n||0).toFixed(2)}%`;}
  function load(){try{return JSON.parse(localStorage.getItem(KEY))||{extraPayment:0,debts:[]};}catch(e){return {extraPayment:0,debts:[]};}}
  function save(data){localStorage.setItem(KEY,JSON.stringify(data));}
  function cleanDebt(d){return {id:d.id||`debt_${Date.now()}_${Math.random().toString(16).slice(2)}`,name:String(d.name||'Debt').trim(),balance:Math.max(0,Number(d.balance||0)),apr:Math.max(0,Number(d.apr||0)),minPayment:Math.max(0,Number(d.minPayment||0)),notes:String(d.notes||'').trim()};}
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
  function renderSummary(){
    const GBV=window.GBV; const data=load(); const debts=data.debts.map(cleanDebt); const total=debts.reduce((a,d)=>a+d.balance,0); const min=debts.reduce((a,d)=>a+d.minPayment,0);
    const snow=simulate('snowball'); const ava=simulate('avalanche');
    const el=document.getElementById('debtSummary'); if(!el) return;
    el.textContent=`Total debt entered: ${money(total)}\nMinimum payments: ${money(min)}\nExtra monthly payment: ${money(data.extraPayment||0)}\nSnowball payoff estimate: ${snow.complete?snow.months+' months':'over 600 months'} • interest ${money(snow.totalInterest)}\nAvalanche payoff estimate: ${ava.complete?ava.months+' months':'over 600 months'} • interest ${money(ava.totalInterest)}\nBest interest strategy: ${ava.totalInterest<=snow.totalInterest?'Avalanche':'Snowball'}\nNote: estimates are manual and assume payments stay constant.`;
  }
  function renderForm(){
    const data=load(); const form=document.getElementById('debtForm'); if(!form) return;
    form.innerHTML=`<label>Name <input id="debtName" type="text" placeholder="Credit card, truck, loan"></label><label>Balance <input id="debtBalance" type="number" step="0.01" placeholder="0.00"></label><label>APR % <input id="debtApr" type="number" step="0.01" placeholder="0.00"></label><label>Minimum payment <input id="debtMin" type="number" step="0.01" placeholder="0.00"></label><label style="grid-column:1/-1">Notes <input id="debtNotes" type="text" placeholder="Optional"></label><button id="addDebtBtn" class="btn primary" type="button">Add debt</button><label style="grid-column:1/-1">Extra monthly payoff amount <input id="debtExtra" type="number" step="0.01" value="${Number(data.extraPayment||0)}"></label><button id="saveDebtScenarioBtn" class="btn secondary" type="button">Save payoff scenario</button>`;
    document.getElementById('addDebtBtn').onclick=()=>addDebt({name:document.getElementById('debtName').value,balance:document.getElementById('debtBalance').value,apr:document.getElementById('debtApr').value,minPayment:document.getElementById('debtMin').value,notes:document.getElementById('debtNotes').value});
    document.getElementById('saveDebtScenarioBtn').onclick=()=>saveScenario(document.getElementById('debtExtra').value);
  }
  function renderList(){
    const GBV=window.GBV; const list=document.getElementById('debtList'); if(!list) return; const debts=load().debts.map(cleanDebt);
    list.innerHTML=debts.map(d=>`<div class="list-item"><span><strong>${GBV.ui.escape(d.name)}</strong><br><small>${money(d.balance)} • ${pct(d.apr)} APR • min ${money(d.minPayment)}${d.notes?' • '+GBV.ui.escape(d.notes):''}</small></span><button class="btn danger" data-remove-debt="${d.id}" type="button">Remove</button></div>`).join('')||'<p>No debts entered yet.</p>';
    list.querySelectorAll('[data-remove-debt]').forEach(btn=>btn.onclick=()=>removeDebt(btn.dataset.removeDebt));
  }
  function renderPlans(){
    const GBV=window.GBV; const box=document.getElementById('debtPlans'); if(!box) return; const snow=simulate('snowball'), ava=simulate('avalanche');
    function planCard(p,title){return `<article class="card"><h3>${title}</h3><p>${p.complete?p.months+' months':'Over 600 months'} • ${money(p.totalInterest)} estimated interest</p>${p.order.map((d,i)=>`<div class="list-item"><span><strong>${i+1}. ${GBV.ui.escape(d.name)}</strong><br><small>${money(d.balance)} • ${pct(d.apr)} APR</small></span></div>`).join('')}</article>`;}
    box.innerHTML=`<div class="grid two">${planCard(snow,'Snowball order')}${planCard(ava,'Avalanche order')}</div>`;
  }
  function render(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v67'; GBV.STORAGE_KEY='gringottsBudgetVault.v67';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v67 Debt Payoff Planner';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v67';
    renderSummary(); renderForm(); renderList(); renderPlans();
  }
  document.addEventListener('DOMContentLoaded',render);
  window.GringottsDebt={load,save,addDebt,removeDebt,simulate,render};
})();
