/* VoltPRo deterministic electrical net resolver. */
(()=>{'use strict';
function resolve(project,terminalGraph){
 const parent=new Map(), rank=new Map(), errors=[], wires=project.wires||[];
 const add=x=>{if(!parent.has(x)){parent.set(x,x);rank.set(x,0)}};
 const find=x=>{add(x);let r=x;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(x)!==x){const p=parent.get(x);parent.set(x,r);x=p}return r};
 const union=(a,b)=>{const x=find(a),y=find(b);if(x===y)return;if(rank.get(x)<rank.get(y))parent.set(x,y);else if(rank.get(x)>rank.get(y))parent.set(y,x);else{parent.set(y,x);rank.set(x,rank.get(x)+1)}};
 for(const id of terminalGraph.endpointIds())add(id);
 for(const w of wires){if(!w?.from||!w?.to){errors.push({code:'WIRE_ENDPOINT_MISSING',wireId:w?.id});continue}if(!terminalGraph.resolve(w.from)||!terminalGraph.resolve(w.to)){errors.push({code:'WIRE_ENDPOINT_UNKNOWN',wireId:w.id,from:w.from,to:w.to});continue}union(w.from,w.to)}
 // Fixed passive paths are physical conductors (for example breadboard strips,
 // shared ground headers and fixed terminal aliases). Never merge switchable,
 // coil, transformer or other behavioural paths as if they were bare wire.
 const devices=project.devices||project.components||[];
 for(const device of devices){
  const paths=terminalGraph.internalPaths?.(String(device.id))||[];
  for(const path of paths){
   if(path.kind!=="passive")continue;
   if(!path.from||!path.to||!terminalGraph.resolve(path.from)||!terminalGraph.resolve(path.to)){
    errors.push({code:"INTERNAL_PATH_ENDPOINT_UNKNOWN",deviceId:device.id,pathId:path.id,from:path.from,to:path.to});
    continue;
   }
   union(path.from,path.to);
  }
 }
 const groups=new Map();for(const id of terminalGraph.endpointIds()){const root=find(id);if(!groups.has(root))groups.set(root,[]);groups.get(root).push(id)}
 const nets=Array.from(groups.values()).map((members,i)=>({id:'N'+String(i+1).padStart(3,'0'),terminals:members.slice().sort()}));
 const terminalToNet=new Map();for(const n of nets)for(const t of n.terminals)terminalToNet.set(t,n.id);
 return {nets,terminalToNet,errors,valid:errors.length===0};
}
window.VoltProNetResolver={resolve};
})();