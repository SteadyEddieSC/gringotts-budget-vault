(function(){
  const GBV=window.GBV;
  function matchRule(tx,rule){const hay=`${tx.merchant} ${tx.name}`.toLowerCase(); return hay.includes(String(rule.match||'').toLowerCase());}
  function applyOne(tx){for(const rule of GBV.state.rules){if(rule.enabled!==false&&rule.match&&matchRule(tx,rule)){if(rule.category) tx.category=rule.category; if(rule.owner) tx.owner=rule.owner; tx.ruleId=rule.id; break;}} return tx;}
  function applyAll(save=true){GBV.state.transactions.forEach(applyOne); if(save) GBV.store.save();}
  function add(match,category,owner){const rule={id:`rule_${Date.now()}_${Math.random().toString(16).slice(2)}`,match:String(match||'').trim(),category:String(category||'').trim(),owner:String(owner||'').trim()||'Household',enabled:true,createdAt:new Date().toISOString()}; if(!rule.match) throw new Error('Rule needs merchant text'); GBV.state.rules.unshift(rule); applyAll(false); GBV.store.save(); return rule;}
  function remove(id){GBV.state.rules=GBV.state.rules.filter(r=>r.id!==id); GBV.store.save();}
  GBV.rules={applyOne,applyAll,add,remove};
})();
