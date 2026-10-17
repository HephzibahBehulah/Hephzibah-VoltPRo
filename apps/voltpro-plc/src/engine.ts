import {emptyMemory,isInput,ports,validate,type Project,type EngineMemory,type Result} from './model';
export function scan(p:Project,inputs:Record<string,boolean>,previous:EngineMemory=emptyMemory(),dt=20):{result:Result;memory:EngineMemory}{
 const errors=validate(p);if(errors.length)throw Error(errors.join(' '));
 const tags={...previous.tags},active:Record<string,boolean>={},elapsed:Record<string,number>={},wires:Record<string,boolean>={},warnings:string[]=[];
 const timers=structuredClone(previous.timers);const step=Math.min(100,Math.max(0,dt));
 const contact=(id:string,k:string,tag:string)=>{const v=Boolean(inputs[id]);if(['nc','overloadNC'].includes(k))return !v;if(k==='auxNC')return !previous.tags[tag];if(k==='auxNO'||k==='contactor3')return !!previous.tags[tag];if(['breaker','breaker3','overload3'].includes(k))return !v;return v;};
 const nodeSignal:Record<string,boolean>={};
 if(p.mode==='fbd'){
  const pending=new Set(p.nodes.map(n=>n.id));
  for(let pass=0;pass<=p.nodes.length&&pending.size;pass++)for(const n of p.nodes){if(!pending.has(n.id))continue;const incoming=p.edges.filter(e=>e.target===n.id);if(incoming.some(e=>pending.has(e.source)))continue;const values=incoming.map(e=>!!nodeSignal[e.source]);const byPort=(port:string)=>incoming.filter(e=>e.targetHandle===port).some(e=>nodeSignal[e.source]);let value=false;
   if(isInput(n.data.kind))value=contact(n.id,n.data.kind,n.data.tag);else if(n.data.kind==='supply')value=true;else if(n.data.kind==='AND')value=byPort('IN1')&&byPort('IN2');else if(n.data.kind==='OR')value=byPort('IN1')||byPort('IN2');else if(n.data.kind==='NOT')value=incoming.length>0&&!byPort('IN');else value=values.some(Boolean);
   if(['TON','TOF'].includes(n.data.kind)){const t=timers[n.id]||{elapsed:0,previous:false,output:false};if(n.data.kind==='TON'){t.elapsed=value?Math.min(n.data.preset,t.elapsed+step):0;t.output=value&&t.elapsed>=n.data.preset;}else{t.elapsed=value?0:Math.min(n.data.preset,t.elapsed+step);t.output=value||(t.output&&t.elapsed<n.data.preset);}t.previous=value;timers[n.id]=t;elapsed[n.id]=t.elapsed;value=t.output;}
   nodeSignal[n.id]=value;pending.delete(n.id);
  }
  if(pending.size)warnings.push('FBD contains feedback or an unresolved cycle. Use ladder auxiliary contacts for scan-memory feedback.');
 }else{
  const parent=new Map<string,string>();const root=(x:string):string=>{if(!parent.has(x))parent.set(x,x);const next=parent.get(x)!;if(next!==x)parent.set(x,root(next));return parent.get(x)!;};const join=(a:string,b:string)=>parent.set(root(a),root(b));
  for(const n of p.nodes)for(const port of ports(n.data.kind))root(n.id+':'+port);
  for(const e of p.edges)join(e.source+':'+e.sourceHandle,e.target+':'+e.targetHandle);
  for(const n of p.nodes){const k=n.data.kind;if(isInput(k)||['auxNO','auxNC','contactor3'].includes(k)){const closed=contact(n.id,k,n.data.tag);active[n.id]=closed;if(closed){const ps=ports(k);if(ps.length===6)for(let i=0;i<3;i++)join(n.id+':'+ps[i],n.id+':'+ps[i+3]);else join(n.id+':'+ps[0],n.id+':'+ps[1]);}}}
  const live=new Set<string>(),returns=new Set<string>(),phase=new Map<string,Set<number>>();
  for(const n of p.nodes){if(n.data.kind==='supply')live.add(root(n.id+':L'));if(n.data.kind==='neutral')returns.add(root(n.id+':N'));if(n.data.kind==='threephase')for(let i=1;i<=3;i++){const r=root(n.id+':L'+i);live.add(r);if(!phase.has(r))phase.set(r,new Set());phase.get(r)!.add(i);}}
  const short=[...live].some(r=>returns.has(r))||[...phase.values()].some(v=>v.size>1);if(short)warnings.push('Supply short circuit detected. Outputs are inhibited.');
  for(const n of p.nodes){const k=n.data.kind,ps=ports(k);if(k==='motor'){const rs=['U','V','W'].map(port=>root(n.id+':'+port));nodeSignal[n.id]=!short&&rs.every(r=>live.has(r))&&new Set(rs).size===3;}else if(['coil','lamp','TON','TOF'].includes(k)){nodeSignal[n.id]=!short&&live.has(root(n.id+':'+ps[0]))&&returns.has(root(n.id+':'+ps[1]));}else if(['supply','threephase'].includes(k))active[n.id]=!short;}
  for(const e of p.edges)wires[e.id]=!short&&live.has(root(e.source+':'+e.sourceHandle));
 }
 const drivers=new Set<string>();for(const n of p.nodes){const k=n.data.kind;if(['coil','TON','TOF'].includes(k)){if(drivers.has(n.data.tag))warnings.push('Duplicate output driver: '+n.data.tag);drivers.add(n.data.tag);}if(['TON','TOF'].includes(k)){const input=!!nodeSignal[n.id],t=timers[n.id]||{elapsed:0,previous:false,output:false};if(p.mode!=='fbd'){if(k==='TON'){t.elapsed=input?Math.min(n.data.preset,t.elapsed+step):0;t.output=input&&t.elapsed>=n.data.preset;}else{t.elapsed=input?0:Math.min(n.data.preset,t.elapsed+step);t.output=input||(t.output&&t.elapsed<n.data.preset);}t.previous=input;timers[n.id]=t;elapsed[n.id]=t.elapsed;}active[n.id]=t.output;tags[n.data.tag]=t.output;}else if(k==='coil'){active[n.id]=!!nodeSignal[n.id];tags[n.data.tag]=active[n.id];}else if(k==='lamp'||k==='motor'||p.mode==='fbd')active[n.id]=!!nodeSignal[n.id];}
 if(p.mode==='fbd')for(const e of p.edges)wires[e.id]=!!nodeSignal[e.source];
 return {result:{active,tags,elapsed,wires,warnings:[...new Set(warnings)],scan:previous.scan+1},memory:{tags,timers,scan:previous.scan+1}};
}
