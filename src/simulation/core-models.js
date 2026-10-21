(()=>{'use strict';
const M=window.VoltProDeviceModels;
function s(d){return d.state||{}}
function stateOn(value,fallback=false){
 if(value===undefined||value===null)return fallback;
 if(value===true||value===1)return true;
 if(value===false||value===0)return false;
 if(typeof value==='string'){
  const normalized=value.trim().toLowerCase();
  if(['','0','false','off','open','no'].includes(normalized))return false;
  if(['1','true','on','closed','yes'].includes(normalized))return true;
 }
 return Boolean(value);
}
M.register({id:'switch',version:'1.0.1',domains:['dc','ac','control'],validated:true,evaluate(d){const closed=stateOn(s(d).closed,true);return {ok:true,closed,contacts:[{id:'1-2',closed}]}}});
M.register({id:'pushbutton-no',version:'1.0.1',domains:['control'],validated:true,evaluate(d){const closed=stateOn(s(d).pressed,false);return {ok:true,closed,contacts:[{id:'13-14',closed}]}}});
M.register({id:'pushbutton-nc',version:'1.0.1',domains:['control'],validated:true,evaluate(d){const closed=!stateOn(s(d).pressed,false);return {ok:true,closed,contacts:[{id:'21-22',closed}]}}});
M.register({id:'lamp',version:'1.0.0',domains:['dc','ac'],validated:true,evaluate(d){return {ok:true,energized:Boolean(s(d).energized),contacts:[]}}});
})();