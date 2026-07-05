(function(){
  const PROMO_KEY='gringottsPromoAprWatch.v1';
  function money(n){return Number(n||0).toLocaleString(undefined,{style:'currency',currency:'USD'});}
  function today(){const d=new Date(); d.setHours(0,0,0,0); return d;}
  function daysUntil(date){if(!date) return null; const d=new Date(date+'T00:00:00'); return Math.ceil((d-today())/86400000);}
  function monthsUntil(date){const days=daysUntil(date); return days==null?0:Math.max(0,Math.ceil(days/30.4375));}
  function load(){try{return JSON.parse(localStorage.getItem(PROMO_KEY))||{cards:[]};}catch(e){return {cards:[]};}}
  function save(data){localStorage.setItem(PROMO_KEY,JSON.stringify(data));}
  function clean(card){return {id:card.id||`promo_${Date.now()}_${Math.random().toString(16).slice(2)}`,name:String(card.name||'Promo balance').trim(),balance:Math.max(0,Number(card.balance||0)),promoApr:Math.max(0,Number(card.promoApr||0)),regularApr:Math.max(0,Number(card.regularApr||0)),promoEnd:String(card.promoEnd||''),minPayment:Math.max(0,Number(card.minPayment||0)),notes:String(card.notes||'').trim()};}
  function risk(card){const c=clean(card); const days=daysUntil(c.promoEnd); const months=monthsUntil(c.promoEnd); const target=months>0?c.balance/months:c.balance; if(days==null||!c.promoEnd) return {label:'Needs date',level:'warn',days:0,months,target}; if(days<0) return {label:'Expired',level:'danger',days,months,target}; if(days<=60) return {label:'Urgent',level:'danger',days,months,target}; if(target>c.minPayment*2 && c.balance>0) return {label:'Needs larger payment',level:'warn',days,months,target}; return {label:'On watch',level:'ok',days,months,target};}
  function add(card){const data=load(); data.cards.push(clean(card)); save(data); render(); window.GBV?.store?.toast('Promo balance added');}
  function remove(id){const data=load(); data.cards=data.cards.filter(c=>c.id!==id); save(data); render(); window.GBV?.store?.toast('Promo balance removed');}
  function renderPromo(){
    const GBV=window.GBV; const data=load(); const cards=data.cards.map(clean); const total=cards.reduce((a,c)=>a+c.balance,0); const urgent=cards.filter(c=>['Expired','Urgent'].includes(risk(c).label)).length;
    const summary=document.getElementById('promoSummary'); if(summary){summary.textContent=`Promo balances tracked: ${cards.length}\nTotal promo balance: ${money(total)}\nUrgent / expired promos: ${urgent}\nPrimary rule: pay to zero before promo expiration, not just minimum payments.`;}
    const form=document.getElementById('promoForm'); if(form){form.innerHTML=`<label>Name <input id="promoName" type="text" placeholder="Card / store / offer"></label><label>Balance <input id="promoBalance" type="number" step="0.01" placeholder="0.00"></label><label>Promo APR % <input id="promoApr" type="number" step="0.01" value="0"></label><label>Regular APR % <input id="promoRegularApr" type="number" step="0.01" placeholder="29.99"></label><label>Promo end date <input id="promoEnd" type="date"></label><label>Minimum payment <input id="promoMin" type="number" step="0.01" placeholder="0.00"></label><label style="grid-column:1/-1">Notes <input id="promoNotes" type="text" placeholder="2027 payoff target, purchase category, etc."></label><button id="addPromoBtn" class="btn primary" type="button">Add promo balance</button>`; document.getElementById('addPromoBtn').onclick=()=>add({name:document.getElementById('promoName').value,balance:document.getElementById('promoBalance').value,promoApr:document.getElementById('promoApr').value,regularApr:document.getElementById('promoRegularApr').value,promoEnd:document.getElementById('promoEnd').value,minPayment:document.getElementById('promoMin').value,notes:document.getElementById('promoNotes').value});}
    const list=document.getElementById('promoList'); if(list){list.innerHTML=cards.map(c=>{const r=risk(c); return `<div class="list-item"><span><strong>${GBV.ui.escape(c.name)}</strong> <span class="pill">${GBV.ui.escape(r.label)}</span><br><small>${money(c.balance)} • promo ${c.promoApr}% until ${GBV.ui.escape(c.promoEnd||'date needed')} • regular ${c.regularApr}% • target ${money(r.target)}/mo • min ${money(c.minPayment)}${c.notes?' • '+GBV.ui.escape(c.notes):''}</small></span><button class="btn danger" data-remove-promo="${c.id}" type="button">Remove</button></div>`;}).join('')||'<p>No promo APR balances entered yet.</p>'; list.querySelectorAll('[data-remove-promo]').forEach(btn=>btn.onclick=()=>remove(btn.dataset.removePromo));}
  }
  function buildBriefing(){
    const GBV=window.GBV; const m=GBV?.reports?.metrics?GBV.reports.metrics():null; const cash=window.GringottsCashflow?.metrics?window.GringottsCashflow.metrics():null; const promo=load().cards.map(clean).map(c=>({card:c,r:risk(c)})); const urgent=promo.filter(p=>['Expired','Urgent','Needs larger payment'].includes(p.r.label)); const txCount=GBV?.state?.transactions?.length||0; const rows=[];
    rows.push(['Vault status',txCount?`${txCount} transactions loaded`:'No transactions loaded',txCount?'OK':'Needs import']);
    if(m) rows.push(['Recent net',money(m.net),m.net>=0?'Positive':'Negative']);
    if(cash) rows.push(['Safe-to-spend scenario',money(cash.safe),cash.safe>=0?'OK':'Tight']);
    rows.push(['Promo APR risk',urgent.length?`${urgent.length} needs attention`:'No urgent promo risk',urgent.length?'Watch':'OK']);
    const actions=[];
    if(urgent[0]) actions.push(`Promo APR: check ${urgent[0].card.name}; target payoff is ${money(urgent[0].r.target)}/mo.`);
    if(cash&&cash.safe<0) actions.push('Cash flow: reduce flexible spending or raise starting-cash estimate accuracy.');
    if(!txCount) actions.push('Import a transaction pack before relying on the briefing.');
    if(!actions.length) actions.push('At a glance: no major immediate warnings from the local data currently loaded.');
    return {rows,actions,promo};
  }
  function renderBriefing(){
    const GBV=window.GBV; const b=buildBriefing(); const summary=document.getElementById('briefingSummary'); const actions=document.getElementById('briefingActions'); const watch=document.getElementById('briefingWatch');
    if(summary){summary.innerHTML=b.rows.map(r=>`<div class="list-item"><span><strong>${GBV.ui.escape(r[0])}</strong><br><small>${GBV.ui.escape(r[1])}</small></span><span class="pill">${GBV.ui.escape(r[2])}</span></div>`).join('');}
    if(actions){actions.innerHTML=b.actions.map(a=>`<div class="note">${GBV.ui.escape(a)}</div>`).join('');}
    if(watch){watch.innerHTML=b.promo.slice(0,5).map(p=>`<div class="list-item"><span><strong>${GBV.ui.escape(p.card.name)}</strong><br><small>${money(p.card.balance)} • ${GBV.ui.escape(p.card.promoEnd||'date needed')} • target ${money(p.r.target)}/mo</small></span><span class="pill">${GBV.ui.escape(p.r.label)}</span></div>`).join('')||'<p>No promo APR balances on watch yet.</p>';}
  }
  function installRoadmap(){
    const GBV=window.GBV; if(!GBV) return;
    GBV.ROADMAP=[
      ['v69','Debt Planner II','Merge promo APR watch into payoff strategy and monthly payoff targets.'],
      ['v70','Executive Briefing II','Restore the polished at-a-glance briefing pack with risks, wins, and next actions.'],
      ['v71','Cash Flow II','Manual bill overrides, payday markers, and safer recurring bill controls.'],
      ['v72','Family Budget Meeting Pack','Quick read meeting notes, decisions, and household action list.'],
      ['v73','Vault Health Score','Simple score with data quality, cash-flow, debt, promo, and import hygiene.'],
      ['v74','Import Helper','Safer transaction pack intake, coverage warnings, and mapping assistance.'],
      ['v75','Calendar Export Prep','Duplicate-safe bill and promo-date manifest before ICS generation.'],
      ['v76','UI Cleanup','Reduce nav clutter and group safety/admin tools.'],
      ['v77','Goals and Sinking Funds','Pool, truck, emergency fund, and large-purchase goals.'],
      ['v78','Export Center','Markdown and JSON exports for briefing, debt, promo, and vault health.']
    ];
    if(GBV.ui?.renderRoadmap) GBV.ui.renderRoadmap();
  }
  function render(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v68'; GBV.STORAGE_KEY='gringottsBudgetVault.v68';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v68 Promo APR Watch + Executive Briefing';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v68';
    installRoadmap(); renderPromo(); renderBriefing();
  }
  document.addEventListener('DOMContentLoaded',render);
  window.GringottsPromoApr={load,save,add,remove,risk,renderPromo,renderBriefing,buildBriefing,render};
})();
