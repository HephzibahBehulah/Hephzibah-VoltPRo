/* Original VoltPRo bridge: real breadboard strips -> the shared MNA engine. */
(function(root){'use strict';
function group(h){
 if(!h||!Number.isInteger(h.r)||!Number.isInteger(h.c)||h.r<0||h.r>14||h.r===7||h.c<0||h.c>=((h.r<2||h.r>12)?50:63))throw Error('A terminal is outside the 830-point breadboard.');
 return h.r<2||h.r>12?'rail:'+h.r+':'+Math.floor(h.c/25):(h.r<=6?'upper:':'lower:')+h.c;
}
function parseValue(raw){const match=String(raw).trim().match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)\s*([GMkmunµμp]?)(?:[A-Za-zΩ]+)?$/i);if(!match)return NaN;const scale={G:1e9,M:1e6,k:1e3,m:1e-3,u:1e-6,µ:1e-6,μ:1e-6,n:1e-9,p:1e-12};return Number(match[1])*(scale[match[2]]??1)}
function topology(project){
 const parent=new Map(),find=x=>{if(!parent.has(x))parent.set(x,x);let r=x;while(parent.get(r)!==r)r=parent.get(r);while(parent.get(x)!==x){const n=parent.get(x);parent.set(x,r);x=n}return r},join=(a,b)=>{a=find(a);b=find(b);if(a!==b)parent.set(a,b)};
 for(const wire of project.wires||[])join(group(wire.a),group(wire.b));
 for(const p of project.parts||[])if(p.type==='jumper'&&p.pins?.length===2)join(group(p.pins[0]),group(p.pins[1]));
 return {net:h=>find(group(h)),same:(a,b)=>find(group(a))===find(group(b))};
}
function build(project){
 if(project?.format!=='voltpro.vbb.json'||!Array.isArray(project.parts)||!Array.isArray(project.wires))throw Error('Open a valid VoltPRo breadboard project.');
 const topo=topology(project),components=[],wires=[],anchors=new Map(),netPins=new Map(),ids=new Set();
 for(const part of project.parts){
  if(ids.has(part.id))throw Error('Duplicate component ID: '+part.id);ids.add(part.id);
  if(part.type==='jumper')continue;
  if(part.type==='arduino')throw Error('Arduino is a footprint here. Full firmware execution is not available in this breadboard engine. Open the simulator MCU Lab for the supported GPIO interpreter.');
  if(part.pins?.length!==2)throw Error(part.id+' needs two connected terminal holes. Re-place this older footprint to assign its pins.');
  const nets=part.pins.map(topo.net);if(nets[0]===nets[1])throw Error(part.id+' has both legs on the same connected strip. Move one leg to a different net.');
  let type=part.type,props={};
  const positive=(value,name)=>{if(!Number.isFinite(value)||value<=0)throw Error(part.id+': '+name+' must be a positive number.');return value};
  if(['resistor','potentiometer','photoresistor'].includes(type)){type='resistor';props.resistance=positive(Number(part.resistanceOhm??220),'resistance')}
  else if(type==='battery'){props.voltage=positive(Number(part.voltageV??9),'voltage')}
  else if(type==='acsource'){props={voltage:positive(Number(part.voltageV??5),'amplitude'),frequency:positive(Number(part.frequencyHz??50),'frequency')}}
  else if(type==='capacitor')props.capacitance=positive(Number(part.capacitanceF??100e-6),'capacitance');
  else if(type==='inductor')props.inductance=positive(Number(part.inductanceH??.01),'inductance');
  else if(type==='led'||type==='diode'){props={forward:positive(Number(part.forwardVoltageV??(type==='led'?1.8:.7)),'forward voltage'),dynamicResistance:10,resistance:10}}
  else if(type==='switch')props.closed=part.closed===false?0:1;
  else throw Error('No electrical model for '+part.type+'.');
  const pins=part.pins.map((h,i)=>part.id+':'+i);components.push({id:part.id,type,props,pins});
  nets.forEach((net,i)=>{if(!anchors.has(net))anchors.set(net,pins[i]);else wires.push({id:'N'+wires.length,a:anchors.get(net),b:pins[i]});if(!netPins.has(net))netPins.set(net,[]);netPins.get(net).push(pins[i])});
 }
 if(!components.some(c=>['battery','acsource'].includes(c.type)))throw Error('Add a DC battery or AC source, and connect a complete circuit.');
 if(components.length>80)throw Error('This interactive analysis supports up to 80 electrical components per capture.');
 return {solver:{components,wires},topology:topo,anchors,netPins};
}
function analyze(project,engine){
 const built=build(project);if(!engine?.dc)throw Error('The MNA engine is unavailable.');
 // A zero-offset sine source contributes zero to the DC operating point.
 const dcProject={...built.solver,components:built.solver.components.map(c=>c.type==='acsource'?{...c,props:{...c.props,voltage:0}}:c)};
 const result=engine.dc(dcProject);if(!result.ok)throw Error(result.error);
 return {status:'solved',result,built,components:result.branches.map(b=>({id:b.id,type:b.type,voltageV:b.voltage,currentA:b.current,powerW:b.power,state:b.type==='led'?(b.current>1e-6?'on':'off'):undefined})),netVoltage(h){const pin=built.anchors.get(built.topology.net(h));return pin===undefined?null:result.terminalVoltages?.[pin]??null}};
}
function capture(project,engine,{duration=.1,steps=400}={}){
 const built=build(project),result=engine.transient(built.solver,{duration,steps});if(!result.ok)throw Error(result.error);
 return {built,result,trace(h){const pin=built.anchors.get(built.topology.net(h));if(!pin)return [];const node=result.terminalNodes[pin];return result.samples.map(s=>({x:s.t,y:node===0?0:s.nodeVoltages.find(n=>n.node===node)?.voltage??NaN})).filter(p=>Number.isFinite(p.y))},componentTrace(id){const a=result.terminalNodes[id+':0'],b=result.terminalNodes[id+':1'];if(a===undefined||b===undefined)return [];return result.samples.map(s=>{const v=n=>n===0?0:s.nodeVoltages.find(p=>p.node===n)?.voltage??0;return {x:s.t,y:v(a)-v(b)}})}};
}
const api={group,topology,build,analyze,capture,parseValue};root.VoltProBreadboardMNA=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:this);
