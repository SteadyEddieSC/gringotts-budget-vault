(function(){
  const CATEGORIES=['Income','VA Benefits','Payroll','Groceries','Dining','Housing','Utilities','Transportation','Pets','Health','Education','Shopping','Entertainment','Transfers','Financial','Giving','Other'];
  const OWNERS=['Household','Eddie','Alexia','Kids','Review'];
  const ROADMAP=[
    ['v60','Differential Pull Studio','New-since-last-import comparison, duplicate review, missing-only import workflow.'],
    ['v61','Rules Engine II','Rule priority, aliases, split transactions, and conflict detection.'],
    ['v62','Cash-Flow Command Center','Bill/payday calendar, safe-to-spend projection, and scenario controls.'],
    ['v63','Debt Payoff Planner','Snowball/avalanche calculator, APR fields, and payoff milestones.'],
    ['v64','Receipt & Evidence Vault','Receipt-needed queue, reimbursements, medical/tax/homeschool notes.'],
    ['v65','Family Budget Briefing','Printable meeting report, goal progress, and plain-English action list.'],
    ['v66','PWA Update Hardening','Backup preflight, service-worker state panel, rollback guidance.'],
    ['v67','UI Overhaul III','Simplified navigation, cleaner mobile review, reduced clutter.'],
    ['v68','Import Connectors','CSV mapping assistant and external transaction normalization.'],
    ['v69','Household Goals','Sinking funds, large-purchase plans, and goal-based monthly budget views.']
  ];
  function defaultState(){return {version:'v59',createdAt:new Date().toISOString(),lastSavedAt:'',source:null,transactions:[],rules:[],review:{cursor:0},settings:{windowDays:60},meta:{imports:[],notes:[]}};}
  window.GBV={
    VERSION:'v59',
    STORAGE_KEY:'gringottsBudgetVault.v59',
    PREVIOUS_KEYS:['gringottsBudgetVault.v58','gringottsBudgetVault.v57','gringottsBudgetVault.v56','gringottsBudgetVault.latest'],
    CATEGORIES,OWNERS,ROADMAP,defaultState,
    state:defaultState(),deferredInstallPrompt:null
  };
})();
