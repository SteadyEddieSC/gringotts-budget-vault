(function(){
  const CATEGORIES=['Income','VA Benefits','Payroll','Groceries','Dining','Housing','Utilities','Transportation','Pets','Health','Education','Shopping','Entertainment','Transfers','Financial','Giving','Other'];
  const OWNERS=['Household','Eddie','Alexia','Kids','Review'];
  const ROADMAP=[
    ['v63','Cash-Flow Command Center','Bill/payday calendar, safe-to-spend projection, and scenario controls.'],
    ['v64','Debt Payoff Planner','Snowball/avalanche payoff scenarios, APR fields, and payoff milestones.'],
    ['v65','Receipt & Evidence Vault','Receipt-needed queue, reimbursement notes, and household/tax tags.'],
    ['v66','Family Budget Briefing','Printable meeting summary, goal progress, and action list.'],
    ['v67','PWA Update Hardening','Backup preflight, update state panel, and rollback guidance.'],
    ['v68','UI Overhaul III','Simplified navigation, cleaner mobile review, and reduced clutter.'],
    ['v69','Import Connectors','CSV mapping assistant and normalization for external files.'],
    ['v70','Household Goals','Sinking funds and goal-based budget views.'],
    ['v71','Shared Household Handoff','Spouse-device setup, safer data handoff, and restore checklist.'],
    ['v72','Monthly Close Assistant','Month-end checklist, variance review, and carry-forward notes.']
  ];
  function defaultState(){return {version:'v62',createdAt:new Date().toISOString(),lastSavedAt:'',source:null,transactions:[],rules:[],review:{cursor:0},settings:{windowDays:60},meta:{imports:[],notes:[],lastDiff:null,ruleConflicts:null,health:null}};}
  window.GBV={
    VERSION:'v62',
    STORAGE_KEY:'gringottsBudgetVault.v62',
    PREVIOUS_KEYS:['gringottsBudgetVault.v61','gringottsBudgetVault.v60','gringottsBudgetVault.v59','gringottsBudgetVault.v58','gringottsBudgetVault.v57','gringottsBudgetVault.v56','gringottsBudgetVault.latest'],
    CATEGORIES,OWNERS,ROADMAP,defaultState,
    state:defaultState(),deferredInstallPrompt:null
  };
})();
