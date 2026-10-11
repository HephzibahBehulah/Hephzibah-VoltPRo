/* VoltPRo deterministic electrical net resolver. */
(()=>{'use strict';
const endpointId=value=>{
 if(typeof value==='string')return value;
 if(value&&typeof value==='object'&&value.deviceId!=null&&value.terminalId!=null)return String(value.deviceId)+':'+String(value.terminalId);
 return '';
};
function resolve(project,terminalGraph){
 const parent=new Map(),rank=new Map(),errors=[],wires=project.wires||[];
 const add=x=>{if(!parent.has(x)){parent.set(x,x);rank.set(x,0)}};
 const find=x=>{add(x);let r=x;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(x)!==x){const p=parent.get(x);parent.set(x,r);x=p}return r};
 const union=(a,b)=>{const x=find(a),y=find(b);if(x===y)return;if(rank.get(x)<rank.get(y))parent.set(x,y);else if(rank.get(x)>rank.get(y))parent.set(y,x);else{parent.set(y,x);rank.set(x,rank.get(x)+1)}};
 for(const id of terminalGraph.endpointIds())add(id);
 for(const w of wires){
  const from=endpointId(w?.from??w?.a),to=endpointId(w?.to??w?.b);
  if(!from||!to){errors.push({code:'WIRE_ENDPOINT_MISSING',wireId:w?.id});continue}
  if(!terminalGraph.resolve(from)||!terminalGraph.resolve(to)){errors.push({code:'WIRE_ENDPOINT_UNKNOWN',wireId:w.id,from:from||w.from||w.a,to:to||w.to||w.b});continue}
  union(from,to);
 }
 // Fixed passive paths are physical conductors (for example breadboard strips,
 // shared ground headers and fixed terminal aliases). Never merge switchable,
 // coil, transformer or other behavioural paths as if they were bare wire.
 const devices=project.devices||project.components||[];
 for(const device of devices){
  const paths=terminalGraph.internalPaths?.(String(device.id))||[];
  for(const path of paths){
   if(path.kind!=="passive")continue;
   const from=endpointId(path.from),to=endpointId(path.to);
   if(!from||!to||!terminalGraph.resolve(from)||!terminalGraph.resolve(to)){
    errors.push({code:"INTERNAL_PATH_ENDPOINT_UNKNOWN",deviceId:device.id,pathId:path.id,from:path.from,to:path.to});
    continue;
   }
   union(from,to);
  }
 }
 const groups=new Map();for(const id of terminalGraph.endpointIds()){const root=find(id);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(id)}
 const nets=Array.from(groups.values()).map((members,i)=>({id:'N'+String(i+1).padStart(3,'0'),terminals:members.slice().sort()}));
 const terminalToNet=new Map();for(const n of nets)for(const t of n.terminals)terminalToNet.set(t,n.id);
 return {nets,terminalToNet,errors,valid:errors.length===0};
}
window.VoltProNetResolver={resolve};
})();