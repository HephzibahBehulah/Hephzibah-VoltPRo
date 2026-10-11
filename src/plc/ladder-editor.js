(()=>{'use strict';
function create(spec={}){return {name:spec.name||'PLC Program',rungs:Array.isArray(spec.rungs)?structuredClone(spec.rungs):[],io:structuredClone(spec.io||{})}}
function addRung(p,nodes=[]){p.rungs.push({id:'R'+String(p.rungs.length+1).padStart(3,'0'),nodes:structuredClone(nodes)});return p}
function node(type,tag,props={}){if(!['contact-no','contact-nc','coil','timer-on','timer-off','counter-up'].includes(type))throw Error('Unsupported ladder node');return {id:'N'+Math.random().toString(36).slice(2,8),type,tag,props}}
window.VoltProLadderEditor={create,addRung,node};
})();