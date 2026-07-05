(function(){
  const CATEGORIES=['Income','VA Benefits','Payroll','Groceries','Dining','Housing','Utilities','Transportation','Pets','Health','Education','Shopping','Entertainment','Transfers','Financial','Giving','Other'];
  const OWNERS=['Household','Eddie','Alexia','Kids','Review'];
  const ROADMAP=[
    ['v64','Cash-Flow Command Center','Bill/payday calendar, safe-to-spend projection, and scenario controls.'],
    ['v65','Debt Payoff Planner','Snowball/avalanche payoff scenarios, APR fields, and payoff milestones.'],
    ['v66','Receipt & Evidence Vault','Receipt-needed queue, reimbursement notes, and household/tax tags.'],
    ['v67','Family Budget Briefing','Printable meeting summary, goal progress, and action list.'],
    ['v68','PWA Update Hardening II','Update diagnostics, restore guidance, and service-worker visibility.'],
    ['v69','UI Overhaul III','Simplified navigation, cleaner mobile review, and reduced clutter.'],
    ['v70','Import Connectors','CSV mapping assistant and normalization for external files.'],
    ['v71','Household Goals','Sinking funds and goal-based budget views.'],
    ['v72','Shared Household Handoff','Spouse-device setup, safer data handoff, and restore checklist.'],
    ['v73','Monthly Close Assistant','Month-end checklist, variance review, and carry-forward notes.']
  ];
  function defaultState(){return {version:'v63',createdAt:new Date().toISOString(),lastSavedAt:'',source:null,transactions:[],rules:[],review:{cursor:0},settings:{windowDays:60},meta:{imports:[],notes:[],lastDiff:null,ruleConflicts:null,health:null,lastUpdateRepair:null}};}
  window.GBV={
    VERSION:'v63',
    STORAGE_KEY:'gringottsBudgetVault.v63',
    PREVIOUS_KEYS:['gringottsBudgetVault.v62','gringottsBudgetVault.v61','gringottsBudgetVault.v60','gringottsBudgetVault.v59','gringottsBudgetVault.v58','gringottsBudgetVault.v57','gringottsBudgetVault.v56','gringottsBudgetVault.latest'],
    CATEGORIES,OWNERS,ROADMAP,defaultState,
    state:defaultState(),deferredInstallPrompt:null
  };
})();
