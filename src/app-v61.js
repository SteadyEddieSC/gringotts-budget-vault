(function(){
  document.addEventListener('DOMContentLoaded',function(){
    var GBV=window.GBV;
    if(!GBV||!GBV.ui||!GBV.rules){return;}
    var $=GBV.ui.$;
    var add=$('#addRuleBtn');
    if(add){
      add.onclick=function(){
        try{
          var aliases=$('#ruleAliases')?$('#ruleAliases').value:'';
          var priority=$('#rulePriority')?Number($('#rulePriority').value||50):50;
          GBV.rules.add($('#ruleMatch').value,$('#ruleCategory').value,$('#ruleOwner').value,aliases,priority);
          ['#ruleMatch','#ruleCategory','#ruleOwner','#ruleAliases'].forEach(function(sel){var el=$(sel); if(el){el.value='';}});
          if($('#rulePriority')){$('#rulePriority').value='50';}
          GBV.ui.renderAll();
          GBV.store.toast('Rule added');
        }catch(e){GBV.store.toast(e.message);}
      };
    }
    var apply=$('#applyRulesBtn');
    if(apply){
      apply.onclick=function(){
        var conflicts=GBV.rules.applyAll();
        GBV.ui.renderAll();
        GBV.store.toast('Rules applied. '+conflicts.length+' conflicts found.');
      };
    }
    GBV.rules.applyAll(false);
    GBV.ui.renderAll();
  });
})();
