(function(){
  const CATEGORIES=['Income','VA Benefits','Payroll','Groceries','Dining','Housing','Utilities','Transportation','Pets','Health','Education','Shopping','Entertainment','Transfers','Financial','Giving','Other'];
  const OWNERS=['Household','Eddie','Alexia','Kids','Review'];
  const ROADMAP=[
    ['v77','Debt Planner II','Merge promo APR watch into debt payoff strategy and monthly payoff targets.'],
    ['v78','Cash Flow II','Manual bill overrides, payday markers, and safer recurring bill controls.'],
    ['v79','Family Budget Meeting Pack','Quick-read meeting notes, decisions, and household action list.'],
    ['v80','Vault Health Score','Simple score with data quality, cash-flow, debt, promo, and import hygiene.'],
    ['v81','Import Helper','Safer transaction pack intake, coverage warnings, and mapping assistance.'],
    ['v82','Calendar Export Prep','Duplicate-safe bill and promo-date manifest before ICS generation.'],
    ['v83','UI Cleanup','Reduce nav clutter and group safety/admin tools.'],
    ['v84','Goals and Sinking Funds','Pool, truck, emergency fund, and large-purchase goals.'],
    ['v85','Export Center','Markdown and JSON exports for briefing, debt, promo, and vault health.'],
    ['v86','Shared Household Handoff','Spouse-device setup, restore checklist, and backup discipline.']
  ];
  function defaultState(){return {version:'v76',createdAt:new Date().toISOString(),lastSavedAt:'',source:null,transactions:[],rules:[],review:{cursor:0},settings:{windowDays:60},meta:{imports:[],notes:[],lastDiff:null,ruleConflicts:null,health:null,lastUpdateRepair:null,lastRecovery:null}};}
  window.GBV={
    VERSION:'v76',
    STORAGE_KEY:'gringottsBudgetVault.v76',
    PREVIOUS_KEYS:['gringottsBudgetVault.v75','gringottsBudgetVault.v74','gringottsBudgetVault.v73','gringottsBudgetVault.v72','gringottsBudgetVault.v71','gringottsBudgetVault.v70','gringottsBudgetVault.v69','gringottsBudgetVault.v68','gringottsBudgetVault.v67','gringottsBudgetVault.v66','gringottsBudgetVault.v65','gringottsBudgetVault.v64','gringottsBudgetVault.v63','gringottsBudgetVault.v62','gringottsBudgetVault.v61','gringottsBudgetVault.v60','gringottsBudgetVault.v59','gringottsBudgetVault.v58','gringottsBudgetVault.v57','gringottsBudgetVault.v56','gringottsBudgetVault.latest'],
    CATEGORIES,OWNERS,ROADMAP,defaultState,
    state:defaultState(),deferredInstallPrompt:null
  };
})();
