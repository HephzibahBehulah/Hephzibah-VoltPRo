/* Structural preflight before solving. This is deliberately conservative:
 * only malformed topology references block the legacy solver. Domain/model
 * warnings remain visible to the v5 diagnostics and do not silently change
 * the electrical engine's behaviour.
 */
(()=>{'use strict';
const BLOCKING=new Set([
 'WIRE_ENDPOINT_MISSING',
 'WIRE_ENDPOINT_UNKNOWN',
 'INVALID_TERMINAL_REFERENCE',
 'INTERNAL_PATH_ENDPOINT_UNKNOWN',
 'TOPOLOGY_VALIDATOR_UNAVAILABLE'
]);
function validate(project){
 const unavailable=(project.components||[]).map(c=>({c,r:window.VoltProComponents?.get?.(c.type),d:window.VoltProRegistry?.definition?.(c.type),unknown:Boolean(!window.VoltProComponents?.get?.(c.type)&&window.defs&&!window.defs[c.type]&&!window.VoltProRegistry?.get?.(c.type))})).filter(({r,d,unknown,c})=>unknown||c.type==="arduino"||(r?r.status!=="educational":["review","reference"].includes(d?.status)));
 if(unavailable.length)return {available:true,valid:false,errors:unavailable.map(({c,r})=>({code:"COMPONENT_MODEL_UNAVAILABLE",deviceId:c.id,message:(r?.name||c.type)+": no tested electrical model is installed. Use a simulated part or remove this reference."})),warnings:[]};
 const runtime=window.VoltProV5Runtime;
 if(!runtime||typeof runtime.analyze!=='function')return {available:false,valid:true,errors:[],warnings:[]};
 let result;
 try{result=runtime.analyze(project)}catch(error){
  return {available:true,valid:false,errors:[{code:'PREFLIGHT_FAILED',message:String(error?.message||error)}],warnings:[]};
 }
 const topology=result?.topology||{},all=[...(topology.errors||[]),...(topology.netErrors||[])];
 const errors=all.filter(item=>BLOCKING.has(item.code));
 const warnings=all.filter(item=>!BLOCKING.has(item.code));
 return {available:true,valid:errors.length===0,errors,warnings,analysis:result};
}
window.VoltProSimulationPreflight={validate};
})();
