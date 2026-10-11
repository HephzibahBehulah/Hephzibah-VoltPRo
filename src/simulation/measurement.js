(()=>{'use strict';
function nodeValue(state,id){const nodes=state.nodeVoltages||[];if(Array.isArray(nodes)){const found=nodes.find(n=>Number(n.node)===Number(id));return Number(found?.voltage??nodes[Number(id)-1]?.voltage??nodes[Number(id)-1]??0)}const v=nodes[id];return Number(v?.voltage??v??0)}
function voltage(state,a,b){return nodeValue(state,a)-nodeValue(state,b)}
function findBranch(state,branchId,contactId){let id=branchId,cid=contactId;if(branchId&&typeof branchId==='object'){id=branchId.branchId??branchId.id;cid=branchId.contactId??cid}if(typeof id==='string'&&id.includes('#')){const i=id.indexOf('#');cid=cid||id.slice(i+1);id=id.slice(0,i)}return (state.branches||[]).find(x=>(x.branchId===id||x.id===id)&&(!cid||x.contactId===cid))||null}
function current(state,branchId,contactId){const x=findBranch(state,branchId,contactId);return Number(x?.current??0)}
function resistance(state,branchId,contactId){const x=findBranch(state,branchId,contactId);if(!x||Math.abs(x.current)<1e-12)return Infinity;return Math.abs(x.voltage/x.current)}
function continuity(state,branchId,threshold=.1,contactId){return resistance(state,branchId,contactId)<=threshold}
function threePhase(state){const v=state.threePhase||{};return {L1L2:Number(v.L1L2??0),L2L3:Number(v.L2L3??0),L3L1:Number(v.L3L1??0),frequency:Number(v.frequency??0),sequence:v.sequence||null}}
function measure(type,state,args={}){if(type==='voltage')return args.branchId!=null?Number(findBranch(state,args.branchId,args.contactId)?.voltage??0):voltage(state,args.a,args.b);if(type==='current')return current(state,args.branchId,args.contactId);if(type==='resistance')return resistance(state,args.branchId,args.contactId);if(type==='continuity')return continuity(state,args.branchId,args.threshold??.1,args.contactId);if(type==='three-phase')return threePhase(state);throw Error('Unknown measurement: '+type)}
window.VoltProMeasurement={voltage,current,resistance,continuity,threePhase,findBranch,measure};
})();