(function(){
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function sentenceJoin(parts){return parts.filter(Boolean).join(' ');}
  function getMetrics(){try{return window.GBV?.reports?.metrics?window.GBV.reports.metrics():null;}catch(e){return null;}}
  function getCash(){try{return window.GringottsCashflow?.metrics?window.GringottsCashflow.metrics():null;}catch(e){return null;}}
  function getPromos(){try{return window.GringottsPromoApr?.load?window.GringottsPromoApr.load().cards||[]:[];}catch(e){return [];}}
  function promoRisk(card){try{return window.GringottsPromoApr?.risk?window.GringottsPromoApr.risk(card):{label:'On watch',target:0};}catch(e){return {label:'On watch',target:0};}}
  function getDebt(){try{return window.GringottsDebt?.load?window.GringottsDebt.load():{debts:[],extraPayment:0};}catch(e){return {debts:[],extraPayment:0};}}
  function classifyNet(net){if(net>500) return 'positive'; if(net<-500) return 'negative'; return 'tight but roughly balanced';}
  function buildParagraph(){
    const GBV=window.GBV;
    const txCount=GBV?.state?.transactions?.length||0;
    const m=getMetrics();
    const cash=getCash();
    const promos=getPromos();
    const debts=getDebt();
    const promoWatch=promos.map(c=>({card:c,r:promoRisk(c)})).filter(x=>['Expired','Urgent','Needs larger payment','Needs date'].includes(x.r.label));
    const debtTotal=(debts.debts||[]).reduce((a,d)=>a+Number(d.balance||0),0);
    if(!txCount){
      return 'Executive readout: the vault is loaded, but it does not have transaction history available in this browser profile yet. Before relying on cash-flow, debt, or promo APR guidance, import or restore the populated vault from Safety or Repair, then download a fresh backup.';
    }
    const netText=m?`The last reviewed window is ${classifyNet(m.net)}, with income of ${money(m.income)} against outflow of ${money(m.outflow)}, leaving a net of ${money(m.net)}.`:'The transaction register is available, but the reporting module did not return a full income/outflow summary yet.';
    const cashText=cash?`The cash-flow scenario currently estimates safe-to-spend at ${money(cash.safe)} after recurring-bill assumptions and your reserve target; treat this as a planning estimate, not a bank balance.`:'The cash-flow scenario has not been filled in yet, so the dashboard cannot give a reliable safe-to-spend readout.';
    const promoText=promos.length?promoWatch.length?`Promo APR watch needs attention on ${promoWatch.length} balance${promoWatch.length===1?'':'s'}; the highest priority is ${promoWatch[0].card.name||'a promo balance'}, with a target payoff of ${money(promoWatch[0].r.target||0)} per month before the promo window closes.`:`Promo APR watch has ${promos.length} balance${promos.length===1?'':'s'} tracked, with no urgent promo warning from the current dates and targets.`:'No promo APR balances are tracked yet, so any 0% offers ending in 2027 should be entered in Promo APR Watch.';
    const debtText=debtTotal>0?`Debt planner has ${money(debtTotal)} entered manually; compare avalanche for interest savings against snowball for faster wins before choosing the next payoff move.`:'Debt planner has no manual balances entered yet.';
    const actionText=promoWatch.length?'Next action: update the promo balances first, then verify whether the monthly target fits the cash-flow scenario.':cash&&cash.safe<0?'Next action: review upcoming recurring bills and reduce flexible spending before adding extra debt payoff.':'Next action: keep the Safety backup current, then use the Briefing and Promo APR tabs for the deeper view.';
    return sentenceJoin(['Executive readout:',netText,cashText,promoText,debtText,actionText]);
  }
  function ensureCard(){
    const dash=document.getElementById('section-dashboard'); if(!dash) return null;
    let card=document.getElementById('dashboardExecutiveBriefing');
    if(!card){
      const anchor=document.getElementById('kpiGrid');
      card=document.createElement('article');
      card.id='dashboardExecutiveBriefing';
      card.className='card';
      card.style.margin='0 0 1rem 0';
      card.innerHTML='<div class="section-title-row"><div><h3>Executive briefing</h3><p>Quick-read advisor summary.</p></div><span class="pill">v69</span></div><p id="dashboardExecutiveText" style="font-size:1.02rem;line-height:1.65;margin:.5rem 0 0"></p>';
      dash.insertBefore(card,anchor||dash.firstChild.nextSibling);
    }
    return card;
  }
  function render(){
    const GBV=window.GBV;
    if(GBV){GBV.VERSION='v69'; GBV.STORAGE_KEY='gringottsBudgetVault.v69';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v69 Executive Dashboard Briefing';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v69';
    ensureCard();
    const text=document.getElementById('dashboardExecutiveText'); if(text) text.textContent=buildParagraph();
    const briefingActions=document.getElementById('briefingActions'); if(briefingActions){const p=document.createElement('div'); p.className='note'; p.textContent=buildParagraph(); briefingActions.prepend(p);}
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(render,0); setTimeout(render,300);});
  window.GringottsExecutiveDashboard={buildParagraph,render};
})();
