(function(){
  function executiveText(){
    if(window.GringottsMonthlyExecutive&&window.GringottsMonthlyExecutive.buildParagraph){return window.GringottsMonthlyExecutive.buildParagraph();}
    return 'Executive summary will appear after the monthly reporting module finishes loading.';
  }
  function render(){
    const GBV=window.GBV;
    if(GBV){GBV.VERSION='v71'; GBV.STORAGE_KEY='gringottsBudgetVault.v71';}
    const subtitle=document.getElementById('subtitle'); if(subtitle) subtitle.textContent='v71 Executive Summary Polish';
    const title=document.querySelector('title'); if(title) title.textContent='Gringotts Budget Vault v71';
    const dash=document.getElementById('section-dashboard'); if(!dash) return;
    let card=document.getElementById('dashboardExecutiveBriefing');
    if(!card){card=document.createElement('article'); card.id='dashboardExecutiveBriefing'; card.className='card'; card.style.margin='0 0 1rem 0'; const anchor=document.getElementById('kpiGrid'); dash.insertBefore(card,anchor||dash.children[1]||dash.firstChild);}
    card.innerHTML='<div class="section-title-row"><div><h3>Executive summary</h3><p>Current month, prior month, year to date, and category movement.</p></div></div><p id="dashboardExecutiveText" style="font-size:1.02rem;line-height:1.65;margin:.5rem 0 0"></p>';
    const text=document.getElementById('dashboardExecutiveText'); if(text) text.textContent=executiveText();
  }
  document.addEventListener('DOMContentLoaded',function(){setTimeout(render,50); setTimeout(render,500);});
  window.GringottsExecutivePolish={render};
})();
