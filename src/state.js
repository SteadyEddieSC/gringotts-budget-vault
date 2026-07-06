(function(){
  const CATEGORIES=['Income','VA Benefits','Payroll','Groceries','Dining','Housing','Utilities','Transportation','Pets','Health','Education','Shopping','Entertainment','Transfers','Financial','Giving','Other'];
  const OWNERS=['Household','Eddie','Alexia','Kids','Review'];
  const ROADMAP=[
    ['v82','Vault Health Score','Simple score with data quality, cash-flow, debt, promo, and import hygiene.'],
    ['v83','Import Helper','Safer transaction pack intake, coverage warnings, and mapping assistance.'],
    ['v84','Calendar Export Prep','Duplicate-safe bill and promo-date manifest before ICS generation.'],
    ['v85','UI Cleanup','Reduce nav clutter and group safety/admin tools.'],
    ['v86','Goals and Sinking Funds','Pool, truck, emergency fund, and large-purchase goals.'],
    ['v87','Export Center','Markdown and JSON exports for briefing, debt, promo, and vault health.'],
    ['v88','Shared Household Handoff','Spouse-device setup, restore checklist, and backup discipline.'],
    ['v89','Receipt & Evidence Vault','Receipt-needed queue, reimbursement notes, and household/tax tags.'],
    ['v90','Cash Flow III','Recurring bill edit/confirm workflow and payday templates.'],
    ['v91','Navigation Cleanup','Group admin/safety tools and reduce tab crowding on mobile.']
  ];
  function defaultState(){return {version:'v81',createdAt:new Date().toISOString(),lastSavedAt:'',source:null,transactions:[],rules:[],review:{cursor:0},settings:{windowDays:60},meta:{imports:[],notes:[],lastDiff:null,ruleConflicts:null,health:null,lastUpdateRepair:null,lastRecovery:null,activeStorageKey:null}};}
  window.GBV={
    VERSION:'v81',
    STORAGE_KEY:'gringottsBudgetVault.v81',
    PREVIOUS_KEYS:['gringottsBudgetVault.v80','gringottsBudgetVault.v79','gringottsBudgetVault.v78','gringottsBudgetVault.v77','gringottsBudgetVault.v76','gringottsBudgetVault.v75','gringottsBudgetVault.v74','gringottsBudgetVault.v73','gringottsBudgetVault.v72','gringottsBudgetVault.v71','gringottsBudgetVault.v70','gringottsBudgetVault.v69','gringottsBudgetVault.v68','gringottsBudgetVault.v67','gringottsBudgetVault.v66','gringottsBudgetVault.v65','gringottsBudgetVault.v64','gringottsBudgetVault.v63','gringottsBudgetVault.v62','gringottsBudgetVault.v61','gringottsBudgetVault.v60','gringottsBudgetVault.v59','gringottsBudgetVault.v58','gringottsBudgetVault.v57','gringottsBudgetVault.v56','gringottsBudgetVault.latest'],
    CATEGORIES,OWNERS,ROADMAP,defaultState,
    state:defaultState(),deferredInstallPrompt:null
  };
})();
