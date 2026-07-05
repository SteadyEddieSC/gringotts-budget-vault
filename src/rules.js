(function(){
  const GBV=window.GBV;
  function norm(v){return String(v||'').trim().toLowerCase().replace(/\s+/g,' ');}
  function splitAliases(v){return String(v||'').split(/[|,;]/).map(x=>x.trim()).filter(Boolean);}
  function normalizeRule(rule){
    return {
      id:rule.id||`rule_${Date.now()}_${Math.random().toString(16).slice(2)}`,
      match:String(rule.match||'').trim(),
      aliases:Array.isArray(rule.aliases)?rule.aliases:splitAliases(rule.aliases||''),
      category:String(rule.category||'').trim(),
      owner:String(rule.owner||'').trim()||'Household',
      priority:Number.isFinite(Number(rule.priority))?Number(rule.priority):50,
      enabled:rule.enabled!==false,
      createdAt:rule.createdAt||new Date().toISOString(),
      updatedAt:new Date().toISOString(),
      hits:Number(rule.hits||0)
    };
  }
  function haystack(tx){return norm(`${tx.merchant||''} ${tx.name||''}`);}
  function candidates(rule){return [rule.match,...(rule.aliases||[])].map(norm).filter(Boolean);}
  function matchRule(tx,rule){const hay=haystack(tx); return candidates(rule).some(term=>hay.includes(term));}
  function orderedRules(){return (GBV.state.rules||[]).map(normalizeRule).filter(r=>r.enabled&&r.match).sort((a,b)=>a.priority-b.priority||a.createdAt.localeCompare(b.createdAt));}
  function matchingRules(tx){return orderedRules().filter(r=>matchRule(tx,r));}
  function applyOne(tx){const matches=matchingRules(tx); if(matches.length){const rule=matches[0]; if(rule.category) tx.category=rule.category; if(rule.owner) tx.owner=rule.owner; tx.ruleId=rule.id; tx.ruleMatchCount=matches.length; tx.ruleConflict=matches.length>1;} else {tx.ruleId=''; tx.ruleMatchCount=0; tx.ruleConflict=false;} return tx;}
  function applyAll(save=true){GBV.state.rules=(GBV.state.rules||[]).map(normalizeRule).sort((a,b)=>a.priority-b.priority||a.createdAt.localeCompare(b.createdAt)); GBV.state.transactions.forEach(applyOne); if(save) GBV.store.save(); return conflictReport();}
  function add(match,category,owner,aliases='',priority=50){const rule=normalizeRule({match,category,owner,aliases,priority}); if(!rule.match) throw new Error('Rule needs merchant text'); GBV.state.rules.unshift(rule); applyAll(false); GBV.store.save(); return rule;}
  function remove(id){GBV.state.rules=GBV.state.rules.filter(r=>r.id!==id); applyAll(false); GBV.store.save();}
  function toggle(id){const r=GBV.state.rules.find(x=>x.id===id); if(r){r.enabled=r.enabled===false; r.updatedAt=new Date().toISOString(); applyAll(false); GBV.store.save();} return r;}
  function move(id,delta){const r=GBV.state.rules.find(x=>x.id===id); if(r){r.priority=Math.max(1,Math.min(999,Number(r.priority||50)+delta)); r.updatedAt=new Date().toISOString(); applyAll(false); GBV.store.save();} return r;}
  function conflictReport(){const conflicts=[]; for(const tx of GBV.state.transactions||[]){const matches=matchingRules(tx); if(matches.length>1) conflicts.push({tx,matches});} GBV.state.meta=GBV.state.meta||{}; GBV.state.meta.ruleConflicts={count:conflicts.length,checkedAt:new Date().toISOString()}; return conflicts;}
  function stats(){const count=new Map(); for(const tx of GBV.state.transactions||[]){if(tx.ruleId) count.set(tx.ruleId,(count.get(tx.ruleId)||0)+1);} (GBV.state.rules||[]).forEach(r=>r.hits=count.get(r.id)||0); return count;}
  GBV.rules={normalizeRule,splitAliases,matchRule,matchingRules,orderedRules,applyOne,applyAll,add,remove,toggle,move,conflictReport,stats};
})();
