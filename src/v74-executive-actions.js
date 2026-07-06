(function(){
  const MONTH_KEY='gringottsExecutiveMonth.v1';
  function esc(s){return window.GBV?.ui?.escape?window.GBV.ui.escape(String(s??'')):String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function monthKey(d){return String(d||'').slice(0,7);}
  function currentKey(){return new Date().toISOString().slice(0,7);}
  function txs(){return (window.GBV?.state?.transactions||[]).filter(t=>t&&t.date&&!t.pending);}
  function availableMonth(){const keys=[...new Set(txs().map(t=>monthKey(t.date)).filter(Boolean))].sort(); const now=currentKey(); return keys.includes(now)?now:(keys[keys.length-1]||now);}
  function selectedMonth(){return localStorage.getItem(MONTH_KEY)||availableMonth();}
  function setLedgerSearch(q){const input=document.getElementById('ledgerSearch'); if(input){input.value=q; input.dispatchEvent(new Event('input',{bubbles:true}));} if(window.GBV?.ui){window.GBV.ui.setSection('transactions'); window.GBV.ui.renderLedger();} window.GBV?.store?.toast?.('Ledger filtered: '+q);}
  function openMonthCategory(category){setLedgerSearch(`${selectedMonth()} ${category}`);}
  function openMonthMerchant(merchant){setLedgerSearch(`${selectedMonth()} ${merchant}`);}
  async function copySummary(){const text=document.getElementById('dashboardExecutiveText')?.textContent||''; if(!text){window.GBV?.store?.toast?.('No executive summary to copy'); return;} try{await navigator.clipboard.writeText(text); window.GBV?.store?.toast?.('Executive summary copied');}catch(e){const area=document.createElement('textarea'); area.value=text; document.body.appendChild(area); area.select(); document.execCommand('copy'); area.remove(); window.GBV?.store?.toast?.('Executive summary copied');}}
  function enhance(){
    const GBV=window.GBV; if(GBV){GBV.VERSION='v74'; GBV.STORAGE_KEY='gringottsBudgetVault.v74';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v74 Executive Action Links';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v74';
    const card=document.getElementById('dashboardExecutiveBriefing'); if(!card) return;
    if(!document.getElementById('copyExecutiveSummaryBtn')){
      const row=document.createElement('div'); row.className='button-row'; row.style.margin='0 0 .85rem'; row.innerHTML='<button id="copyExecutiveSummaryBtn" class="btn secondary" type="button">Copy summary</button><button id="openSelectedMonthLedgerBtn" class="btn secondary" type="button">Open selected month in ledger</button>';
      const text=document.getElementById('dashboardExecutiveText'); if(text) card.insertBefore(row,text.nextSibling);
    }
    const copy=document.getElementById('copyExecutiveSummaryBtn'); if(copy) copy.onclick=copySummary;
    const openMonth=document.getElementById('openSelectedMonthLedgerBtn'); if(openMonth) openMonth.onclick=()=>setLedgerSearch(selectedMonth());
    const focus=document.getElementById('executiveFocusDetails'); if(!focus) return;
    [...focus.querySelectorAll('.list-item')].forEach(item=>{
      const heading=item.querySelector('strong')?.textContent?.trim(); if(!heading||item.querySelector('[data-exec-open]')) return;
      const sectionTitle=item.closest('article')?.querySelector('h4')?.textContent||'';
      const btn=document.createElement('button'); btn.className='btn secondary'; btn.type='button'; btn.dataset.execOpen='1'; btn.textContent='Open'; btn.style.marginLeft='.5rem';
      btn.onclick=()=>sectionTitle.toLowerCase().includes('eating')?openMonthMerchant(heading):openMonthCategory(heading);
      item.appendChild(btn);
    });
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(enhance,220); setTimeout(enhance,1100); setTimeout(enhance,1900);});
  window.GringottsExecutiveActions={enhance,copySummary,setLedgerSearch,openMonthCategory,openMonthMerchant};
})();
