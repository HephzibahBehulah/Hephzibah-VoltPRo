/* VoltPRo breadboard DC engine. Deterministic educational DC operating-point solver.
 * Supports resistors, red/green/yellow/blue/white LEDs (piecewise-linear), and DC batteries.
 * No AC, transient, capacitor, Arduino firmware, or semiconductor switching claims.
 */
(function(root){
'use strict';
const VERSION='1.0.0', EPS=1e-10;
function key(h){if(!h||!Number.isInteger(h.r)||!Number.isInteger(h.c))throw Error('Each terminal must reference an integer breadboard hole.');return h.r+','+h.c}
function validHole(h){return h.r>=0&&h.r<15&&h.r!==7&&h.c>=0&&h.c<(h.r<2||h.r>12?50:63)}
function group(h){if(!validHole(h))throw Error('Terminal references a hole outside the 830-point breadboard.');if(h.r<2||h.r>12&&h.r!==7)return 'rail:'+h.r+':'+Math.floor(h.c/25);return h.r<=6?'upper:'+h.c:'lower:'+h.c}
function solveLinear(A,b){const n=b.length,M=A.map((row,i)=>row.slice().concat(b[i]));for(let k=0;k<n;k++){let p=k;for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;if(Math.abs(M[p][k])<EPS)throw Error('Circuit is floating or singular. Connect a complete return path and remove conflicting ideal sources.');[M[k],M[p]]=[M[p],M[k]];const d=M[k][k];for(let j=k;j<=n;j++)M[k][j]/=d;for(let i=0;i<n;i++){if(i===k)continue;const f=M[i][k];if(!f)continue;for(let j=k;j<=n;j++)M[i][j]-=f*M[k][j]}}return M.map(row=>row[n])}
function analyze(project){
 if(!project||project.format!=='voltpro.vbb.json'||!Array.isArray(project.parts)||!Array.isArray(project.wires))throw Error('Invalid VoltPRo breadboard project.');
 const parts=project.parts, wires=project.wires, parent=new Map(), find=x=>{if(!parent.has(x))parent.set(x,x);let p=parent.get(x);if(p!==x){p=find(p);parent.set(x,p)}return p}, union=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(a,b)};
 const groups=new Map();function attach(h){const k=key(h),g=group(h);if(!groups.has(g))groups.set(g,[]);groups.get(g).push(k);parent.set(k,g);return k}
 // All breadboard holes in one native five-hole strip / split rail are equipotential.
 for(let r=0;r<15;r++){if(r===7)continue;const n=(r<2||r>12)?50:63;for(let c=0;c<n;c++){const h={r,c},g=group(h);if(!parent.has(g))parent.set(g,g);parent.set(key(h),g)}}
 const wireIds=new Set();for(const w of wires){if(!w||!w.a||!w.b)throw Error('Wire requires endpoints a and b.');if(wireIds.has(w.id))throw Error('Duplicate wire id: '+w.id);wireIds.add(w.id);union(key(w.a),key(w.b))}
 const electrical=[],ids=new Set();
 for(const p of parts){if(!p||typeof p.id!=='string'||ids.has(p.id))throw Error('Every component must have a unique id.');ids.add(p.id);if(['jumper','arduino','capacitor'].includes(p.type))continue;if(!['resistor','led','battery'].includes(p.type))throw Error('Unsupported component type: '+p.type);if(!Array.isArray(p.pins)||p.pins.length!==2)throw Error(p.id+' requires two explicit electrical terminals.');const a=find(attach(p.pins[0])),b=find(attach(p.pins[1]));if(a===b)throw Error(p.id+' has both terminals on the same electrical net (shorted footprint).');const raw=String(p.value??'');let value;if(p.type==='resistor'){value=Number(p.resistanceOhm??raw.match(/[0-9]+(?:\\.[0-9]+)?/)?.[0]);if(!Number.isFinite(value)||value<=0)throw Error(p.id+' has an invalid resistance.')}else if(p.type==='battery'){value=Number(p.voltageV??raw.match(/[0-9]+(?:\\.[0-9]+)?/)?.[0]);if(!Number.isFinite(value)||value<=0)throw Error(p.id+' has an invalid DC voltage.')}else{value=Number(p.forwardVoltageV??(/blue|white/i.test(raw)?3:/green/i.test(raw)?2.1:/yellow/i.test(raw)?2:1.8));if(!Number.isFinite(value)||value<0.1||value>5)throw Error(p.id+' has an invalid LED forward voltage.')}electrical.push({id:p.id,type:p.type,a,b,value,rd:p.type==='led'?10:0})}
 // Components may create additional terminals, so canonicalize after all joins.
 for(const e of electrical){e.a=find(e.a);e.b=find(e.b)}
 const nodeNames=[...new Set(electrical.flatMap(e=>[e.a,e.b]))].sort();if(!nodeNames.length)return {version:VERSION,status:'no-circuit',nets:nodeNames.length,components:[],message:'Place and wire a supported component before running DC analysis.'};
 const ground=nodeNames[0],nodes=nodeNames.filter(n=>n!==ground),idx=new Map(nodes.map((n,i)=>[n,i])),sources=electrical.filter(e=>e.type==='battery'),unknowns=nodes.length+sources.length;
 if(!unknowns)return {version:VERSION,status:'no-circuit',nets:1,components:[],message:'Circuit has no independent electrical nodes.'};
 let ledOn=new Map(electrical.filter(e=>e.type==='led').map(e=>[e.id,false])),solution;
 function stampG(A,a,b,g){const ia=idx.get(a),ib=idx.get(b);if(ia!==undefined)A[ia][ia]+=g;if(ib!==undefined)A[ib][ib]+=g;if(ia!==undefined&&ib!==undefined){A[ia][ib]-=g;A[ib][ia]-=g}}
 for(let iter=0;iter<30;iter++){const A=Array.from({length:unknowns},()=>Array(unknowns).fill(0)),z=Array(unknowns).fill(0);for(const e of electrical){if(e.type==='resistor'){stampG(A,e.a,e.b,1/e.value)}else if(e.type==='led'){const on=ledOn.get(e.id),g=on?1/e.rd:1e-9;stampG(A,e.a,e.b,g);if(on){const vf=e.value;const ia=idx.get(e.a),ib=idx.get(e.b);if(ia!==undefined)z[ia]+=g*vf;if(ib!==undefined)z[ib]-=g*vf}}}
  sources.forEach((e,j)=>{const k=nodes.length+j,ia=idx.get(e.a),ib=idx.get(e.b);if(ia!==undefined){A[ia][k]+=1;A[k][ia]+=1}if(ib!==undefined){A[ib][k]-=1;A[k][ib]-=1}z[k]=e.value});
  solution=solveLinear(A,z);const voltage=n=>n===ground?0:solution[idx.get(n)];let changed=false;for(const e of electrical.filter(x=>x.type==='led')){const next=voltage(e.a)-voltage(e.b)>e.value;if(next!==ledOn.get(e.id)){ledOn.set(e.id,next);changed=true}}if(!changed)break;if(iter===29)throw Error('LED operating point did not converge. Check circuit polarity and topology.')}
 const voltage=n=>n===ground?0:solution[idx.get(n)],results=electrical.map(e=>{const v=voltage(e.a)-voltage(e.b);let current;if(e.type==='resistor')current=v/e.value;else if(e.type==='battery'){const j=sources.findIndex(s=>s.id===e.id);current=-solution[nodes.length+j]}else current=ledOn.get(e.id)?(v-e.value)/e.rd:Math.max(0,v)*1e-9;return {id:e.id,type:e.type,voltageV:+v.toFixed(6),currentA:+current.toFixed(9),powerW:+(v*current).toFixed(9),...(e.type==='led'?{state:ledOn.get(e.id)&&current>1e-6?'on':'off',forwardVoltageV:e.value}:{})}});
 const nets=new Set(electrical.flatMap(e=>[e.a,e.b]));return {version:VERSION,status:'solved',referenceNet:ground,netCount:nets.size,iterationCount:undefined,components:results,nodeVoltages:Object.fromEntries(nodeNames.map(n=>[n,+voltage(n).toFixed(6)])),message:'DC operating point calculated using supported breadboard component models. Results are educational and apply only to the declared models.'}
}
const api={version:VERSION,analyze,holeGroup:group};root.VoltProBreadboardSolver=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
