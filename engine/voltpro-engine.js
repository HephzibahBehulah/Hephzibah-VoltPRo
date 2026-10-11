/* VoltPRo Engine — browser-native Modified Nodal Analysis (MNA).
 * Original VoltPRo implementation. It is an MNA engine, not a claim of
 * Ngspice compatibility. Educational use only; verify real designs against
 * applicable standards, manufacturer data and qualified engineering practice.
 */
(()=>{"use strict";
const EPS=1e-12;
const C=(re=0,im=0)=>({re:+re||0,im:+im||0});
const add=(a,b)=>C(a.re+b.re,a.im+b.im), sub=(a,b)=>C(a.re-b.re,a.im-b.im);
const mul=(a,b)=>C(a.re*b.re-a.im*b.im,a.re*b.im+a.im*b.re);
const div=(a,b)=>{const d=b.re*b.re+b.im*b.im;if(d<EPS)throw Error("Singular complex division");return C((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d)};
const mag=a=>Math.hypot(a.re,a.im), deg=a=>Math.atan2(a.im,a.re)*180/Math.PI;
function solve(A,b){
 const n=A.length;if(!n)return [];
 const M=A.map((r,i)=>r.map(x=>C(x.re,x.im)).concat(C(b[i]?.re||0,b[i]?.im||0)));
 for(let k=0;k<n;k++){let p=k,m=mag(M[k][k]);for(let i=k+1;i<n;i++){const q=mag(M[i][k]);if(q>m){m=q;p=i}}
  if(m<EPS)throw Error("Circuit matrix is singular or floating");
  if(p!==k)[M[p],M[k]]=[M[k],M[p]];
  for(let i=k+1;i<n;i++){const f=div(M[i][k],M[k][k]);for(let j=k;j<=n;j++)M[i][j]=sub(M[i][j],mul(f,M[k][j]))}
 }
 const x=Array(n);for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s=sub(s,mul(M[i][j],x[j]));x[i]=div(s,M[i][i])}return x;
}
function pinsOf(x){return Array.isArray(x.pins)&&x.pins.length?x.pins:Array.from({length:2},(_,i)=>x.id+":"+i)}
function value(x,names,fallback){const p=x.props||x.parameters||{};for(const n of names){if(p[n]!==undefined)return Number(p[n]);}return fallback}
function typeOf(x){return String(x.type||x.model||"").toLowerCase().replace(/[-\s]/g,"_")}
function topology(project){
 const parent=new Map(), find=x=>{if(!parent.has(x))parent.set(x,x);let r=x;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(x)!==x){const q=parent.get(x);parent.set(x,r);x=q}return r};
 const union=(a,b)=>{const x=find(a),y=find(b);if(x!==y)parent.set(x,y)};
 (project.components||[]).forEach(x=>pinsOf(x).forEach(p=>find(p)));
 (project.wires||[]).forEach(w=>{if(w.a&&w.b)union(w.a,w.b)});
 // Passive internal paths are real electrical connections: breadboard strips, rails and board pin aliases.
 (project.components||[]).forEach(x=>{const def=window.VoltProTerminalGraph?.definitionFor?.(x.type);if(!def?.terminals?.length)return;const pins=pinsOf(x),index=new Map(def.terminals.map((t,i)=>[String(t.id),pins[i]]));for(const p of def.paths||[]){if(p.kind!=="passive")continue;const a=index.get(String(p.from)),b=index.get(String(p.to));if(a&&b)union(a,b)}});
 return {find};
}
function build(project,options={}){
 const t=topology(project), comps=project.components||[], source=comps.find(x=>["battery","dcsource","voltage_source","ac_source"].includes(typeOf(x)));
 const explicit=options.groundRef||project.groundRef||"GND";
 let ground=explicit;
 if(!comps.some(x=>pinsOf(x).includes(explicit)) && source)ground=pinsOf(source)[1];
 const nodeKeys=[], nodeMap=new Map();
 const nodeFor=r=>{const q=t.find(r);if(t.find(ground)===q)return 0;if(!nodeMap.has(q)){nodeMap.set(q,nodeKeys.length+1);nodeKeys.push(q)}return nodeMap.get(q)};
 const refs=(project.wires||[]).flatMap(w=>[w.a,w.b]).filter(Boolean);
 refs.forEach(nodeFor);
 const wired=new Set(refs);
 const branches=[], voltageSources=[];
 const addBranch=(comp,a,b,kind,extra={})=>branches.push({comp,a:nodeFor(a),b:nodeFor(b),kind,...extra});
 for(const x of comps){
  const p=pinsOf(x),ty=typeOf(x),definition=window.VoltProTerminalGraph?.definitionFor?.(x.type);
  if(/^circuit-breaker-[1234]p$/.test(String(x.type))||x.type==="auxiliary-contact-block"||x.type==="abb-aux-cb-11"){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   for(const contact of definition?.paths||[]){if(contact.kind!=="switchable")continue;const a=index.get(String(contact.from)),b=index.get(String(contact.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    const stateValue=x.state?.[contact.stateKey]??x.props?.[contact.stateKey]??(contact.stateKey==="closed"?x.props?.closed:undefined);
    const closed=stateValue===undefined?contact.closedWhen!==false:Boolean(stateValue)===Boolean(contact.closedWhen??true);
    const tripped=x.state?.tripped===true;
    addBranch(x,a,b,closed&&!tripped?"resistor":"open",{R:Math.max(EPS,value(x,["onResistance"],1e-6)),contactId:contact.id});
   }
   continue;
  }
  if(p.length<2)continue;
  const a=p[0],b=p[1];
  if(["resistor","lamp","heater","buzzer"].includes(ty))addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["resistance","resistance_ohm","value"],1000))});
  else if(ty==="switch"||["fuse","breaker","mcb","mccb","rcd","rcbo","relay","contactor","emergency_stop"].includes(ty)){
   const closed=x.props?.closed!==false && x.props?.closed!==0 && x.props?.closed!=="0" && x.props?.state!=="open";addBranch(x,a,b,closed?"resistor":"open",{R:closed?Math.max(EPS,value(x,["onResistance"],1e-6)):1e30});
  } else if(["capacitor","c"].includes(ty))addBranch(x,a,b,"capacitor",{C:Math.max(EPS,value(x,["capacitance","value"],1e-6))});
  else if(["inductor","l"].includes(ty))addBranch(x,a,b,"inductor",{L:Math.max(EPS,value(x,["inductance","value"],1e-3))});
  else if(["diode","zener","led"].includes(ty))addBranch(x,a,b,"diode",{vf:Math.max(0,value(x,["forward","forwardVoltage","vf"],ty==="led"?2:0.7)),rd:Math.max(1e-6,value(x,["resistance","dynamicResistance"],10)),reverse:Math.max(1e-9,value(x,["reverseLeakage"],1e-9))});
  else if(["bjt","transistor","npn","pnp"].includes(ty))addBranch(x,a,b,"bjt",{beta:Math.max(1,value(x,["beta","gain"],100)),vt:0.7});
  else if(["mosfet","nmos","pmos","igbt"].includes(ty))addBranch(x,a,b,"mosfet",{threshold:value(x,["threshold","vth"],3),onResistance:Math.max(1e-6,value(x,["onResistance","rdsOn"],1))});
  else if(["current_source","isource"].includes(ty))voltageSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"current",value:value(x,["current","amplitude"],1)});
  else if(["battery","dcsource","voltage_source","ac_source"].includes(ty))voltageSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"voltage",value:value(x,["voltage","amplitude"],12),phase:value(x,["phase","phaseDeg"],0)});
  else if(["vcvs","dependent_voltage_source"].includes(ty))voltageSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"vcvs",gain:value(x,["gain"],1),cp:nodeFor(p[2]||a),cm:nodeFor(p[3]||b)});
  else if(["vccs","dependent_current_source"].includes(ty))addBranch(x,a,b,"vccs",{gm:value(x,["transconductance","gm"],1e-3),cp:nodeFor(p[2]||a),cm:nodeFor(p[3]||b)});
 }
 return {t,comps,nodeFor,nodeKeys,ground,branches,voltageSources,N:nodeKeys.length};
}
function stampG(A,a,b,g){
 if(a>0)A[a-1][a-1]=add(A[a-1][a-1],g);
 if(b>0)A[b-1][b-1]=add(A[b-1][b-1],g);
 if(a>0&&b>0){A[a-1][b-1]=sub(A[a-1][b-1],g);A[b-1][a-1]=sub(A[b-1][a-1],g)}
}
function stampI(z,a,b,i){if(a>0)z[a-1]=sub(z[a-1],i);if(b>0)z[b-1]=add(z[b-1],i)}
function stampV(A,z,a,b,k,v){const j=A.length-1-k;if(a>0){A[a-1][j]=add(A[a-1][j],C(1));A[j][a-1]=add(A[j][a-1],C(1))}if(b>0){A[b-1][j]=sub(A[b-1][j],C(1));A[j][b-1]=sub(A[j][b-1],C(1))}z[j]=add(z[j],v)}
function linearSolve(b,options,history={}){
 const n=b.N, vs=b.voltageSources.length, size=n+vs, A=Array.from({length:size},()=>Array.from({length:size},()=>C())),z=Array.from({length:size},()=>C());
 const xPrev=options.xPrev||Array.from({length:n},()=>C());
 const v=node=>node===0?C():xPrev[node-1]||C();
 for(const q of b.branches){
  if(q.kind==="resistor")stampG(A,q.a,q.b,C(1/q.R));
  else if(q.kind==="open"){}
  else if(q.kind==="capacitor"){const g=options.ac?C(0,q.C*options.omega):C(options.dt?q.C/options.dt:0); if(mag(g)>0)stampG(A,q.a,q.b,g);}
  else if(q.kind==="inductor"){const g=options.ac?C(0,-1/(options.omega*q.L)):C(options.dt?options.dt/q.L:1e12);stampG(A,q.a,q.b,g);if(options.dt){const old=history[q.comp.id]||0;stampI(z,q.a,q.b,C(-old))}}
  else if(q.kind==="diode"){const vd=v(q.a).re-v(q.b).re;const on=vd>=q.vf;const g=on?1/q.rd:q.reverse;const iEq=on?(vd-q.vf)/q.rd-g*vd:0;stampG(A,q.a,q.b,C(g));stampI(z,q.a,q.b,C(iEq))}
  else if(q.kind==="bjt"){const vd=v(q.a).re-v(q.b).re;const g=vd>q.vt?1/q.beta:1e-9;stampG(A,q.a,q.b,C(g))}
  else if(q.kind==="mosfet"){const vd=v(q.a).re-v(q.b).re;stampG(A,q.a,q.b,C(vd>q.threshold?1/q.onResistance:1e-9))}
  else if(q.kind==="vccs"){const j1=q.cp,j2=q.cm;if(q.a>0&&j1>0)A[q.a-1][j1-1]=add(A[q.a-1][j1-1],C(q.gm));if(q.a>0&&j2>0)A[q.a-1][j2-1]=sub(A[q.a-1][j2-1],C(q.gm));if(q.b>0&&j1>0)A[q.b-1][j1-1]=sub(A[q.b-1][j1-1],C(q.gm));if(q.b>0&&j2>0)A[q.b-1][j2-1]=add(A[q.b-1][j2-1],C(q.gm))}
 }
 b.voltageSources.forEach((q,k)=>{
  let vv=C(q.value);
  if(q.kind==="voltage"&&typeOf(q.comp)==="ac_source"){const ph=q.phase*Math.PI/180;vv=C(q.value*Math.cos(ph),q.value*Math.sin(ph))}
  if(q.kind==="vcvs")vv=mul(C(q.gain),sub(v(q.cp),v(q.cm)));
  if(q.kind==="current")stampI(z,q.a,q.b,C(q.value));else stampV(A,z,q.a,q.b,k,vv);
 });
 let x;try{x=solve(A,z)}catch(e){return {ok:false,error:e.message}};
 return {ok:true,x,nodeCount:n,sourceCount:vs};
}
function operatingPoint(project,options={}){
 const b=build(project,options);let xPrev=Array.from({length:b.N},()=>C()),result;
 for(let it=0;it<12;it++){const previous=xPrev.slice();result=linearSolve(b,{...options,xPrev});if(!result.ok)return {ok:false,analysis:"DC operating point",error:result.error};xPrev=result.x.slice(0,b.N);if(xPrev.every((v,i)=>mag(sub(v,previous[i]||C()))<1e-9))break}
 const x=result.x, nodeVoltage=n=>n===0?0:(x[n-1]?.re||0), branches=b.branches.map(q=>{const u=nodeVoltage(q.a)-nodeVoltage(q.b);let i=0;if(q.kind==="resistor")i=u/q.R;else if(q.kind==="diode")i=u>=q.vf?(u-q.vf)/q.rd:u*q.reverse;else if(q.kind==="bjt")i=u>q.vt?(u-q.vt)/q.beta/Math.max(q.vt,EPS):u*1e-9;else if(q.kind==="mosfet")i=u>q.threshold?u/q.onResistance:u*1e-9;return {id:q.comp.id,type:q.comp.type,voltage:u,current:i,power:u*i}});
 const sourceCurrents=b.voltageSources.map((q,k)=>({id:q.comp.id,type:q.comp.type,current:x[b.N+k]?.re||0}));
 const totalCurrent=sourceCurrents.reduce((s,q)=>s+Math.abs(q.current),0);
 return {ok:true,analysis:"DC operating point (MNA)",engine:"VoltPRo MNA",sourceVoltage:b.voltageSources[0]?.value||0,totalCurrent,totalPower:branches.reduce((s,q)=>s+q.power,0),nodes:b.N,branches,sourceCurrents,nodeVoltages:Array.from({length:b.N},(_,i)=>({node:i+1,voltage:nodeVoltage(i+1)})),iterations:12};
}
function dc(project,options={}){return operatingPoint(project,options)}
function ac(project,{start=1,stop=1e5,points=50,frequency=50,groundRef}={}){
 const b=build(project,{groundRef}), freqs=points<=1?[frequency]:Array.from({length:points},(_,i)=>start*Math.pow(stop/start,i/(points-1))),rows=[];
 for(const f of freqs){const scale=2*Math.PI*f;const result=linearSolve(b,{frequency:f,omega:scale,ac:true,xPrev:Array.from({length:b.N},()=>C())},{}) ;if(!result.ok)return {ok:false,analysis:"AC sweep",error:result.error};const x=result.x;const vs=b.voltageSources[0];const vout=vs?sub(x[(vs.a||1)-1]||C(),x[(vs.b||1)-1]||C()):C();const z=vs&&x[b.N]?div(vout,x[b.N]):C(Infinity,0);rows.push({frequency:f,magnitude:mag(vout),phaseDeg:deg(vout),impedanceMagnitude:mag(z),impedancePhaseDeg:deg(z)})}
 return {ok:true,analysis:"AC sweep (MNA)",frequency,points:freqs.length,start,stop,sweep:rows};
}
function transient(project,{duration=.1,steps=100,groundRef}={}){
 const b=build(project,{groundRef}),dt=duration/Math.max(1,steps),samples=[],history={};let xPrev=Array.from({length:b.N},()=>C());
 for(let s=0;s<=steps;s++){const t=s*dt;const r=linearSolve(b,{dt,xPrev},history);if(!r.ok)return {ok:false,analysis:"Transient analysis",error:r.error,time:t};const x=r.x;xPrev=x.slice(0,b.N);samples.push({t,nodeVoltages:xPrev.map((v,i)=>({node:i+1,voltage:v.re})),sourceCurrent:r.x[b.N]?.re||0});for(const q of b.branches)if(q.kind==="inductor")history[q.comp.id]=(xPrev[q.a-1]?.re||0)-(xPrev[q.b-1]?.re||0);}
 return {ok:true,analysis:"Transient analysis (backward Euler MNA)",duration,steps,dt,samples};
}
function dcSweep(project,{componentId,param="resistance",start=100,stop=10000,points=20}={}){const base=JSON.parse(JSON.stringify(project));const target=(base.components||[]).find(x=>x.id===componentId);if(!target)return {ok:false,analysis:"DC sweep",error:"Component not found: "+componentId};const values=points<=1?[start]:Array.from({length:points},(_,i)=>start+(stop-start)*i/(points-1));const sweep=[];for(const v of values){target.props=target.props||{};target.props[param]=v;const r=dc(base);if(!r.ok)return {ok:false,analysis:"DC sweep",error:r.error,value:v};sweep.push({value:v,totalCurrent:r.totalCurrent,totalPower:r.totalPower,branches:r.branches})}return {ok:true,analysis:"DC parameter sweep (MNA)",componentId,param,start,stop,points:sweep.length,sweep}}
function power(project,options={}){const r=dc(project,options);if(!r.ok)return r;return {ok:true,analysis:"DC power",totalPower:r.totalPower,branches:r.branches.map(x=>({id:x.id,power:x.power}))}}
function analyze(project,options={}){
 const out={engine:"VoltPRo MNA",version:4,dc:dc(project,options)};
 if(options.ac)out.ac=ac(project,options.ac===true?options:options.ac);
 if(options.transient)out.transient=transient(project,options.transient===true?options:options.transient);
 if(options.power)out.power=power(project,options);
 return out;
}
window.VoltProEngine={version:4,analyze,dc,dcSweep,transient,ac,power,math:{mag,solve}};
})();