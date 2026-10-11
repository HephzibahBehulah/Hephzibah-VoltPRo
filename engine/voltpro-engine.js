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
const div=(a,b)=>{const d=b.re*b.re+b.im*b.im;if(d<EPS*EPS)throw Error("Singular complex division");return C((a.re*b.re+a.im*b.im)/d,(a.im*b.re-a.re*b.im)/d)};
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
function sensorResistance(x){const id=String(x.type||x.model||"").toLowerCase(),p=x.props||x.parameters||{};const has=(...keys)=>keys.some(k=>p[k]!==undefined&&Number.isFinite(Number(p[k])));const num=(keys,fallback)=>value(x,keys,fallback);const temp=has("temperatureC","temperature")?num(["temperatureC","temperature"],25):null;if(/sensor[-_]pt1000?(?:$|[-_])/.test(id)&&temp!==null){const r0=/pt1000/.test(id)?1000:100;const t=Math.max(-200,Math.min(850,temp));return Math.max(EPS,r0*(1+0.00385*t))}if(/sensor[-_]ntc[-_]10k/.test(id)&&temp!==null){const r0=Math.max(EPS,num(["r25","nominalResistance","resistance"],10000)),beta=Math.max(1,num(["beta"],3950)),tk=Math.max(1,temp+273.15);return Math.max(EPS,r0*Math.exp(beta*(1/tk-1/298.15)))}if(/sensor[-_]ntc[-_]100k/.test(id)&&temp!==null){const r0=Math.max(EPS,num(["r25","nominalResistance","resistance"],100000)),beta=Math.max(1,num(["beta"],3950)),tk=Math.max(1,temp+273.15);return Math.max(EPS,r0*Math.exp(beta*(1/tk-1/298.15)))}if(/sensor[-_]ldr(?:$|[-_])/.test(id)&&has("lightLux","illuminanceLux")){const lux=Math.max(0.1,num(["lightLux","illuminanceLux"],10)),reference=Math.max(EPS,num(["referenceResistance","resistance"],10000)),referenceLux=Math.max(0.1,num(["referenceLux"],10)),gamma=Math.max(0.1,num(["gamma"],0.7));return Math.max(EPS,reference*Math.pow(referenceLux/lux,gamma))}return Math.max(EPS,num(["resistance","value"],1000))}
function ratedCoilVoltage(x,kind){const configured=value(x,["coilVoltage","ratedCoilVoltage"],NaN);if(Number.isFinite(configured)&&configured>0)return configured;const id=String(x.type||x.model||"").toLowerCase(),match=id.match(/(?:contactor|relay)[-_](24|48|110|230|400|415)v(?:ac|dc)?(?:$|[-_])/);if(match)return Number(match[1]);return kind==="contactor"?230:24}
function protectionRating(x){const configured=value(x,["rating","ratedCurrent","currentRating","tripCurrent"],NaN),id=String(x.type||"").toLowerCase(),match=id.match(/-(?:mccb|fuse)-([0-9]+)a$/)||id.match(/-(?:mcb|rcbo)-[bcd]?([0-9]+)$/),encoded=match?Number(match[1]):NaN;if(Number.isFinite(encoded)&&(!Number.isFinite(configured)||configured===16))return encoded;return Number.isFinite(configured)?configured:(typeOf(x)==="fuse"?1:16)}
function ratedLoadResistance(x){const configured=value(x,["resistance","resistance_ohm"],NaN);if(Number.isFinite(configured)&&configured>0)return configured;const watts=value(x,["ratedPower","power","wattage"],NaN),voltage=value(x,["ratedVoltage","voltage"],230);if(Number.isFinite(watts)&&watts>0&&Number.isFinite(voltage)&&voltage>0)return voltage*voltage/watts;return Math.max(EPS,value(x,["value"],1000))}
function typeOf(x){const raw=String(x.type||x.model||""),id=raw.toLowerCase(),registryModel=window.VoltProRegistry?.get?.(raw)?.electricalModel?.type;if(registryModel==="motor"||/^motors[-_]motor[-_]/i.test(raw))return "motor";if(/^lighting[-_]lamp[-_]led[-_](?:red|green|blue|yellow|white)$/i.test(raw))return "led";if(/^loads[-_]load[-_](?:lamp|heater|fan|pump|compressor|solenoid|buzzer|siren|immersion|kettle|oven|welding|ev)[-_]/i.test(raw)||/^lighting[-_]lamp[-_]fluorescent[-_](?:18|36|58)w$/i.test(raw))return "rated_load";if(registryModel==="transformer"||/^transformers[-_]transformer[-_][0-9]+[-_][0-9]+v(?:[-_][0-9]+va)?$/i.test(raw))return "transformer";if(registryModel==="three-phase-transformer"||/^transformers[-_]transformer[-_]3p[-_]400[-_](?:230|110)(?:[-_]24)?$/i.test(raw))return "three_phase_transformer";if(/^contactors[-_]contactor[-_](?:24vac|24vdc|48vac|48vdc|110vac|110vdc|230vac|230vdc|400vac|415vac|2p|3p|4p|1no|2no|1nc|2nc|1no1nc|2no2nc)$/i.test(raw))return "contactor";if(/^relays[-_]relay[-_](?:24vac|24vdc|48vac|48vdc|110vac|110vdc|230vac|230vdc|2co|spdt|dpdt)$/i.test(raw))return "relay";if(registryModel==="protection"||/^protection[-_]/i.test(raw)){if(/rcbo/.test(id))return "rcbo";if(/rcd|rccb/.test(id))return "rcd";if(/mccb/.test(id))return "mccb";if(/fuse/.test(id))return "fuse";if(/mcb/.test(id))return "mcb";return "protection"}if(/^switching[-_]switch[-_]/i.test(raw)){if(/pushbutton[-_]no$/.test(id))return "pushbutton_no";if(/pushbutton[-_]nc$/.test(id))return "pushbutton_nc";if(/emergency[-_]stop/.test(id))return "emergency_stop";if(/pedal[-_]no$/.test(id))return "pedal_no";if(/pedal[-_]nc$/.test(id))return "pedal_nc";if(/isolator/.test(id))return "isolator";if(/selector/.test(id))return "selector";if(/limit[-_]switch/.test(id))return "limit_switch";if(/float[-_]switch/.test(id))return "float_switch";if(/pressure[-_]switch/.test(id))return "pressure_switch";if(/thermostat/.test(id))return "thermostat";if(/microswitch/.test(id))return "microswitch";if(/reed[-_]switch/.test(id))return "reed_switch";if(/proximity[-_]switch/.test(id))return "proximity_switch";if(/photo[-_]switch/.test(id))return "photo_switch";if(/safety[-_]switch/.test(id))return "safety_switch";if(/main[-_]switch/.test(id))return "main_switch";if(/disconnect[-_]switch/.test(id))return "disconnect_switch";if(/test[-_]switch/.test(id))return "test_switch";return "switch"}if(/^sensors[-_]sensor[-_](?:pt1000?|ntc[-_]10k|ntc[-_]100k|ldr)$/i.test(raw))return "sensor_resistive";if(/^sensors[-_]sensor[-_](?:photoelectric|inductive[-_]m(?:8|12|18|30)|capacitive[-_]m18|ultrasonic|pir|microwave|pressure[-_](?:1|10|100)bar|flow|level|float|vibration|proximity)$/i.test(raw))return "sensor_contact";return id.replace(/[-\s]/g,"_")}
function plcProgram(device){const raw=device.props?.program??device.props?.ladderProgram;if(raw&&typeof raw==="object")return raw;if(typeof raw==="string"){try{return JSON.parse(raw)}catch{return null}}return null}
function plcScan(device,b,voltageAt,stateOverrides,ladderAdvanced,scanTimeMsOverride){
 const definition=window.VoltProTerminalGraph?.definitionFor?.(device.type),pins=pinsOf(device),map=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),pins[i]])),pin=id=>map.get(id),read=id=>{const p=pin(id);return p&&b.wired.has(p)?voltageAt(b.nodeFor(p)):null},m=read("M"),lplus=read("L+"),powered=m!==null&&lplus!==null&&magnitudeDifference(lplus,m)>=Math.max(EPS,value(device,["minVoltage","supplyThreshold"],18)),threshold=Math.max(EPS,value(device,["inputThreshold"],12)),inputs={};
 for(const id of ["I0","I1","I2"]) {const v=read(id);inputs[id]=powered&&v!==null&&magnitudeDifference(v,m)>=threshold}
 const previous=stateOverrides[device.id]&&typeof stateOverrides[device.id]==="object"?stateOverrides[device.id]:(device.state||{}),program=plcProgram(device);let scan=null,error=null;
 if(powered){if(!window.VoltProLadder?.scan)error="PLC ladder engine is not loaded.";else if(!program||!Array.isArray(program.rungs))error="PLC ladder program is invalid.";else{const dt=ladderAdvanced.has(device.id)?0:Math.max(0,Number(scanTimeMsOverride??value(device,["scanTimeMs"],10))||0);ladderAdvanced.add(device.id);scan=window.VoltProLadder.scan(program,inputs,previous.ladderState??device.state?.ladderState??{},{dtMs:dt});if(!scan.ok)error=scan.error}}
 else ladderAdvanced.add(device.id);
 const outputs={Q0:Boolean(powered&&scan?.ok&&scan.outputs.Q0),Q1:Boolean(powered&&scan?.ok&&scan.outputs.Q1),Q2:Boolean(powered&&scan?.ok&&scan.outputs.Q2),Q3:Boolean(powered&&scan?.ok&&scan.outputs.Q3)},previousOutputs=previous.outputs||{},changed=Object.keys(outputs).some(k=>Boolean(previous[k]??previousOutputs[k]??false)!==outputs[k])||Boolean(previous.powered??device.state?.powered??false)!==powered;
 stateOverrides[device.id]={...previous,...outputs,outputs,ladderState:scan?.state??previous.ladderState??device.state?.ladderState??{},powered,ladderError:error};
 return changed;
}
function magnitudeDifference(a,b){if(a===null||b===null||a===undefined||b===undefined)return 0;if(typeof a==="number"&&typeof b==="number")return Math.abs(a-b);return mag(sub(a,b))}
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
 const t=topology(project), comps=project.components||[], source=comps.find(x=>["battery","dcsource","voltage_source","ac_source","acsource","threephase","controlsource","arduino_uno_r3"].includes(typeOf(x)));
 const explicit=options.groundRef||project.groundRef||"GND";
 let ground=explicit;
 if(!comps.some(x=>pinsOf(x).includes(explicit)) && source)ground=typeOf(source)==="threephase"?(pinsOf(source)[3]||pinsOf(source)[1]):typeOf(source)==="arduino_uno_r3"?(pinsOf(source)[15]||pinsOf(source)[22]||pinsOf(source)[37]):pinsOf(source)[1];
 const nodeKeys=[], nodeMap=new Map();
 const nodeFor=r=>{const q=t.find(r);if(t.find(ground)===q)return 0;if(!nodeMap.has(q)){nodeMap.set(q,nodeKeys.length+1);nodeKeys.push(q)}return nodeMap.get(q)};
 const refs=(project.wires||[]).flatMap(w=>[w.a,w.b]).filter(Boolean);
 refs.forEach(nodeFor);
 const wired=new Set(refs);
 const branches=[], voltageSources=[], currentSources=[], transformers=[];
 const addBranch=(comp,a,b,kind,extra={})=>branches.push({comp,a:nodeFor(a),b:nodeFor(b),kind,...extra});
 for(const x of comps){
  const p=pinsOf(x),ty=typeOf(x),definition=window.VoltProTerminalGraph?.definitionFor?.(x.type);
  if(ty==="contactor"||ty==="relay"){
   // Coil and every main/auxiliary contact are separate electrical branches.
   // The operating-point loop derives energized state from solved coil voltage.
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   const energized=options.stateOverrides?.[x.id]??x.state?.energized??x.props?.energized??false;
   for(const contact of definition?.paths||[]){const a=index.get(String(contact.from)),b=index.get(String(contact.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    if(contact.kind==="coil"){
     addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["coilResistance"],ty==="contactor"?82:240)),contactId:contact.id,coil:true});
     continue;
    }
    if(contact.kind!=="switchable")continue;
    const stateValue=contact.stateKey==="energized"?energized:(x.state?.[contact.stateKey]??x.props?.[contact.stateKey]);
    const closed=typeof contact.closedWhen==="string"?String(stateValue??"off")===contact.closedWhen:(stateValue===undefined?contact.closedWhen!==false:Boolean(stateValue)===Boolean(contact.closedWhen??true));
    addBranch(x,a,b,"resistor",{R:closed?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10)),contactId:contact.id});
   }
   continue;
  }
  if(ty==="three_phase_transformer"){
   const index=new Map((definition?.terminals||[]).map((terminal,i)=>[String(terminal.id),p[i]]));
   const P1=index.get("P1"),P2=index.get("P2"),P3=index.get("P3"),PN=index.get("PN"),S1=index.get("S1"),S2=index.get("S2"),S3=index.get("S3"),SN=index.get("SN");
   const primary=Math.max(EPS,value(x,["primaryVoltage"],400)),secondary=Math.max(EPS,value(x,["secondaryVoltage"],230)),ratio=Math.max(EPS,value(x,["turnsRatio"],primary/secondary));if(PN&&SN&&wired.has(PN)&&wired.has(SN)){for(const [pa,sa] of [[P1,S1],[P2,S2],[P3,S3]])if(pa&&sa&&wired.has(pa)&&wired.has(sa))transformers.push({comp:x,p1:nodeFor(pa),p2:nodeFor(PN),s1:nodeFor(sa),s2:nodeFor(SN),ratio})}const A1=index.get("A1"),A2=index.get("A2");if(P1&&PN&&A1&&A2&&wired.has(P1)&&wired.has(PN)&&wired.has(A1)&&wired.has(A2)){const primaryPhase=Math.max(EPS,value(x,["primaryPhaseVoltage"],primary/Math.sqrt(3))),auxiliary=Math.max(EPS,value(x,["auxiliaryVoltage"],24));transformers.push({comp:x,p1:nodeFor(P1),p2:nodeFor(PN),s1:nodeFor(A1),s2:nodeFor(A2),ratio:Math.max(EPS,value(x,["auxiliaryTurnsRatio"],primaryPhase/auxiliary))})}
   continue;
  }
  if(ty==="transformer"){
   const index=new Map((definition?.terminals||[]).map((terminal,i)=>[String(terminal.id),p[i]]));
   const p1=index.get("P1"),p2=index.get("P2"),s1=index.get("S1"),s2=index.get("S2");
   if([p1,p2,s1,s2].every(pin=>pin&&wired.has(pin))){
    const primary=Math.max(EPS,value(x,["primaryVoltage"],230)),secondary=Math.max(EPS,value(x,["secondaryVoltage"],24));
    transformers.push({comp:x,p1:nodeFor(p1),p2:nodeFor(p2),s1:nodeFor(s1),s2:nodeFor(s2),ratio:Math.max(EPS,value(x,["turnsRatio","ratio"],primary/secondary))});
   }
   continue;
  }
  if(ty==="threephase"){
   const neutral=p[3]||ground,lineVoltage=Math.max(EPS,value(x,["lineVoltage","voltage","amplitude"],400)),phaseVoltage=lineVoltage/Math.sqrt(3);
   const reverse=String(x.props?.sequence??x.state?.sequence??"ABC").toUpperCase()==="ACB";
   const angles=reverse?[0,120,-120]:[0,-120,120];
   for(let i=0;i<3;i++)if(p[i])voltageSources.push({comp:x,a:nodeFor(p[i]),b:nodeFor(neutral),kind:"voltage",value:phaseVoltage,phase:angles[i],phasor:true,phaseName:["L1","L2","L3"][i]});
   continue;
  }
  if(ty==="motor"){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]])),windings=(definition?.paths||[]).filter(w=>w.kind==="motor-winding");
   if(windings.length){for(const winding of windings){const a=index.get(String(winding.from)),b=index.get(String(winding.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["windingResistance","resistance"],24)),contactId:winding.id,phase:winding.phase||null})}}
   else if(p.length>=2&&wired.has(p[0])&&wired.has(p[1]))addBranch(x,p[0],p[1],"resistor",{R:Math.max(EPS,value(x,["windingResistance","resistance","resistance_ohm","value"],32)),contactId:"motor-equivalent"});
   continue;
  }
  if(["overload_relay","thermal_overload_relay","industrial_industrial_overload_relay"].includes(ty)){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   const tripped=Boolean(options.stateOverrides?.[x.id]?.tripped??x.state?.tripped??x.props?.tripped??false);
   for(const contact of definition?.paths||[]){const a=index.get(String(contact.from)),b=index.get(String(contact.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    if(contact.kind==="thermal-element"){addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["heaterResistance","elementResistance"],.01)),contactId:contact.id,phase:contact.phase||null,thermal:true});continue}
    if(contact.kind!=="switchable")continue;
    const closed=Boolean(tripped)===Boolean(contact.closedWhen??true);
    addBranch(x,a,b,"resistor",{R:closed?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10)),contactId:contact.id});
   }
   continue;
  }
  if(ty==="arduino_uno_r3"){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]])),gnd=index.get("GND_D")||index.get("GND_1")||index.get("GND_2")||p[15],fiveV=index.get("5V"),threeV3=index.get("3V3"),ioRef=index.get("IOREF"),sketch=String(x.props?.sketch??x.props?.code??""),firmware=window.VoltProMCU?.simulate?.(sketch,{target:"Arduino Uno R3",state:options.stateOverrides?.[x.id]?.mcuState??x.state?.mcuState,dtMs:0}),pinStates=options.stateOverrides?.[x.id]?.pins??(firmware?.pins||{}),pullups=[],inputs=[];
   for(let n=0;n<=13;n++){const pin=index.get("D"+n),state=pinStates[String(n)];if(!pin||!state||!wired.has(pin))continue;if(state.mode==="OUTPUT"){const voltage=Number(state.voltage??(state.state?value(x,["logicVoltage"],5):0));voltageSources.push({comp:x,a:nodeFor(pin),b:nodeFor(gnd),kind:"voltage",value:Number.isFinite(voltage)?voltage:0,phase:0,pinName:"D"+n})}else if(state.mode==="INPUT_PULLUP")pullups.push(pin);else if(state.mode==="INPUT")inputs.push(pin)}
   if(fiveV&&(wired.has(fiveV)||(ioRef&&wired.has(ioRef))||pullups.length))voltageSources.push({comp:x,a:nodeFor(fiveV),b:nodeFor(gnd),kind:"voltage",value:Math.max(EPS,value(x,["logicVoltage"],5)),phase:0,pinName:"5V"});
   if(threeV3&&wired.has(threeV3))voltageSources.push({comp:x,a:nodeFor(threeV3),b:nodeFor(gnd),kind:"voltage",value:3.3,phase:0,pinName:"3V3"});
   for(const pin of pullups){if(fiveV)addBranch(x,pin,fiveV,"resistor",{R:Math.max(EPS,value(x,["pullupResistance"],20000)),contactId:"pullup-"+String(pin).split(":").pop()})}for(const pin of inputs)addBranch(x,pin,gnd,"resistor",{R:Math.max(EPS,value(x,["inputResistance"],1e6)),contactId:"input-"+String(pin).split(":").pop()})
   continue;
  }
  if(ty==="plc_controller"){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   for(const path of definition?.paths||[]){const a=index.get(String(path.from)),b=index.get(String(path.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    if(path.kind==="supply-load"){addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["supplyResistance"],4800)),contactId:path.id});continue}
    if(path.kind==="input-resistor"){addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["inputResistance"],10000)),contactId:path.id});continue}
    if(path.kind==="switchable"){const stateValue=options.stateOverrides?.[x.id]?.[path.stateKey]??x.state?.[path.stateKey]??x.props?.[path.stateKey]??false,closed=Boolean(stateValue)===Boolean(path.closedWhen??true);addBranch(x,a,b,"resistor",{R:closed?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10)),contactId:path.id})}
   }
   continue;
  }
  if(definition?.paths?.some(contact=>contact.kind==="switchable")){
   const index=new Map((definition.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   for(const contact of definition.paths){if(contact.kind!=="switchable")continue;const a=index.get(String(contact.from)),b=index.get(String(contact.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    const override=options.stateOverrides?.[x.id],stateValue=(typeof override==="boolean"&&contact.stateKey==="energized")?override:override?.[contact.stateKey]??x.state?.[contact.stateKey]??x.props?.[contact.stateKey]??(contact.stateKey==="pressed"?false:undefined);
    const closed=typeof contact.closedWhen==="string"?String(stateValue??"off")===contact.closedWhen:(stateValue===undefined?contact.closedWhen!==false:Boolean(stateValue)===Boolean(contact.closedWhen??true));
    const tripped=Boolean(options.stateOverrides?.[x.id]?.tripped??x.state?.tripped??x.props?.tripped??false);
    addBranch(x,a,b,"resistor",{R:closed&&!tripped?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10)),contactId:contact.id});
   }
   continue;
  }
  if(/^circuit-breaker-[1234]p$/.test(String(x.type))||x.type==="auxiliary-contact-block"||x.type==="abb-aux-cb-11"){
   const index=new Map((definition?.terminals||[]).map((t,i)=>[String(t.id),p[i]]));
   for(const contact of definition?.paths||[]){if(contact.kind!=="switchable")continue;const a=index.get(String(contact.from)),b=index.get(String(contact.to));if(!a||!b||!wired.has(a)||!wired.has(b))continue;
    const stateValue=x.state?.[contact.stateKey]??x.props?.[contact.stateKey]??(contact.stateKey==="closed"?x.props?.closed:undefined);
    const closed=typeof contact.closedWhen==="string"?String(stateValue??"off")===contact.closedWhen:(stateValue===undefined?contact.closedWhen!==false:Boolean(stateValue)===Boolean(contact.closedWhen??true));
    const tripped=x.state?.tripped===true;
    addBranch(x,a,b,"resistor",{R:closed&&!tripped?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10)),contactId:contact.id});
   }
   continue;
  }
  if(p.length<2)continue;
  const a=p[0],b=p[1];
  if(ty==="sensor_resistive")addBranch(x,a,b,"resistor",{R:sensorResistance(x),contactId:"sensor-resistance"});
  else if(ty==="sensor_contact"){const raw=x.state?.closed??x.props?.closed,active=Boolean(x.state?.active??x.props?.active??x.state?.actuated??x.props?.actuated??x.state?.detected??x.props?.detected??false),closed=raw===undefined?active:!(raw===false||raw===0||raw==="0"||String(raw).toLowerCase()==="open"||String(raw).toLowerCase()==="false");addBranch(x,a,b,"resistor",{R:closed?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10))})}
  else if(ty==="rated_load"){const enabled=(x.props?.enabled??x.state?.enabled??true)!==false;addBranch(x,a,b,"resistor",{R:enabled?Math.max(EPS,ratedLoadResistance(x)):Math.max(EPS,value(x,["offResistance"],3e10))})}
  else if(["resistor","lamp","heater","buzzer"].includes(ty))addBranch(x,a,b,"resistor",{R:Math.max(EPS,value(x,["resistance","resistance_ohm","value"],1000))});
  else if(["switch","pushbutton_no","pushbutton_nc","pedal_no","pedal_nc","isolator","selector","limit_switch","float_switch","pressure_switch","thermostat","microswitch","reed_switch","proximity_switch","photo_switch","safety_switch","main_switch","disconnect_switch","test_switch","fuse","breaker","mcb","mccb","rcd","rcbo","emergency_stop"].includes(ty)){
   const raw=x.state?.closed??x.props?.closed??x.props?.state,pressed=Boolean(x.state?.pressed??x.props?.pressed??x.state?.actuated??x.props?.actuated??false);
   let closed=raw===undefined?true:!(raw===false||raw===0||raw==="0"||String(raw).toLowerCase()==="open"||String(raw).toLowerCase()==="false");
   if(["pushbutton_no","pedal_no"].includes(ty))closed=pressed;
   else if(["pushbutton_nc","pedal_nc","emergency_stop"].includes(ty))closed=!pressed;
   const tripped=Boolean(options.stateOverrides?.[x.id]?.tripped??x.state?.tripped??x.props?.tripped??false);
   addBranch(x,a,b,"resistor",{R:closed&&!tripped?Math.max(EPS,value(x,["onResistance"],1e-6)):Math.max(EPS,value(x,["offResistance"],3e10))});
  } else if(["capacitor","c"].includes(ty))addBranch(x,a,b,"capacitor",{C:Math.max(EPS,value(x,["capacitance","value"],1e-6))});
  else if(["inductor","l"].includes(ty))addBranch(x,a,b,"inductor",{L:Math.max(EPS,value(x,["inductance","value"],1e-3))});
  else if(["diode","zener","led"].includes(ty))addBranch(x,a,b,"diode",{vf:Math.max(0,value(x,["forward","forwardVoltage","vf"],ty==="led"?2:0.7)),rd:Math.max(1e-6,value(x,["resistance","dynamicResistance"],10)),reverse:Math.max(1e-9,value(x,["reverseLeakage"],1e-9))});
  else if(["bjt","transistor","npn","pnp"].includes(ty))addBranch(x,a,b,"bjt",{beta:Math.max(1,value(x,["beta","gain"],100)),vt:0.7});
  else if(["mosfet","nmos","pmos","igbt"].includes(ty))addBranch(x,a,b,"mosfet",{threshold:value(x,["threshold","vth"],3),onResistance:Math.max(1e-6,value(x,["onResistance","rdsOn"],1))});
  else if(["current_source","isource"].includes(ty))currentSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"current",value:value(x,["current","amplitude"],1)});
  else if(["battery","dcsource","voltage_source","ac_source","acsource","controlsource"].includes(ty))voltageSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"voltage",value:value(x,["voltage","amplitude"],12),phase:value(x,["phase","phaseDeg"],0)});
  else if(["vcvs","dependent_voltage_source"].includes(ty))voltageSources.push({comp:x,a:nodeFor(a),b:nodeFor(b),kind:"vcvs",gain:value(x,["gain"],1),cp:nodeFor(p[2]||a),cm:nodeFor(p[3]||b)});
  else if(["vccs","dependent_current_source"].includes(ty))addBranch(x,a,b,"vccs",{gm:value(x,["transconductance","gm"],1e-3),cp:nodeFor(p[2]||a),cm:nodeFor(p[3]||b)});
 }
 return {t,comps,nodeFor,nodeKeys,ground,branches,voltageSources,currentSources,transformers,wired,N:nodeKeys.length};
}
function stampG(A,a,b,g){
 if(a>0)A[a-1][a-1]=add(A[a-1][a-1],g);
 if(b>0)A[b-1][b-1]=add(A[b-1][b-1],g);
 if(a>0&&b>0){A[a-1][b-1]=sub(A[a-1][b-1],g);A[b-1][a-1]=sub(A[b-1][a-1],g)}
}
function stampI(z,a,b,i){if(a>0)z[a-1]=sub(z[a-1],i);if(b>0)z[b-1]=add(z[b-1],i)}
function stampV(A,z,a,b,j,v){if(a>0){A[a-1][j]=add(A[a-1][j],C(1));A[j][a-1]=add(A[j][a-1],C(1))}if(b>0){A[b-1][j]=sub(A[b-1][j],C(1));A[j][b-1]=sub(A[j][b-1],C(1))}z[j]=add(z[j],v)}
function linearSolve(b,options,history={}){
 const n=b.N, vs=b.voltageSources.length, ts=b.transformers?.length||0, size=n+vs+2*ts, A=Array.from({length:size},()=>Array.from({length:size},()=>C())),z=Array.from({length:size},()=>C());
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
 for(const q of b.currentSources||[])stampI(z,q.a,q.b,C(q.value));
 b.voltageSources.forEach((q,k)=>{
  let vv=C(q.value);
  if(q.kind==="voltage"&&options.ac&&(q.phasor||["ac_source","acsource"].includes(typeOf(q.comp)))){const ph=(q.phase||0)*Math.PI/180;vv=C(q.value*Math.cos(ph),q.value*Math.sin(ph))}
  if(q.kind==="vcvs")vv=mul(C(q.gain),sub(v(q.cp),v(q.cm)));
  stampV(A,z,q.a,q.b,n+k,vv);
 });
 // Ideal transformer: Vp = ratio*Vs and Ip = -Is/ratio. Two MNA
 // current unknowns preserve galvanic isolation between primary and secondary.
 (b.transformers||[]).forEach((q,i)=>{
  const ip=n+vs+2*i,is=ip+1;
  if(q.p1>0)A[q.p1-1][ip]=add(A[q.p1-1][ip],C(1));
  if(q.p2>0)A[q.p2-1][ip]=sub(A[q.p2-1][ip],C(1));
  if(q.s1>0)A[q.s1-1][is]=add(A[q.s1-1][is],C(1));
  if(q.s2>0)A[q.s2-1][is]=sub(A[q.s2-1][is],C(1));
  if(q.p1>0)A[ip][q.p1-1]=add(A[ip][q.p1-1],C(1));
  if(q.p2>0)A[ip][q.p2-1]=sub(A[ip][q.p2-1],C(1));
  if(q.s1>0)A[ip][q.s1-1]=sub(A[ip][q.s1-1],C(q.ratio));
  if(q.s2>0)A[ip][q.s2-1]=add(A[ip][q.s2-1],C(q.ratio));
  A[is][ip]=add(A[is][ip],C(1));
  A[is][is]=add(A[is][is],C(1/q.ratio));
  // The isolated secondary has arbitrary common-mode voltage. This 1 GΩ
  // solver reference stabilizes the matrix and is negligible beside loads.
  if(q.s2>0)stampG(A,q.s2,0,C(1e-9));
 });
 let x;try{x=solve(A,z)}catch(e){return {ok:false,error:e.message}};
 return {ok:true,x,nodeCount:n,sourceCount:vs};
}
function operatingPoint(project,options={}){
 let stateOverrides={},b,result,xPrev;const ladderAdvanced=new Set(),mcuAdvanced=new Set();
 // Electromechanical coupling: solve coil voltage, update contact state, then solve
 // the changed network again until the relay/contactor state stabilizes.
 for(let stateIteration=0;stateIteration<8;stateIteration++){
  b=build(project,{...options,stateOverrides});
  xPrev=Array.from({length:b.N},()=>C());
  for(let it=0;it<12;it++){const previous=xPrev.slice();result=linearSolve(b,{...options,xPrev});if(!result.ok)return {ok:false,analysis:"DC operating point",error:result.error};xPrev=result.x.slice(0,b.N);if(xPrev.every((v,i)=>mag(sub(v,previous[i]||C()))<1e-9))break}
  const nodeVoltage=n=>n===0?0:(result.x[n-1]?.re||0);
  let changed=false;
  for(const q of b.branches){if(!q.coil)continue;const coilVoltage=Math.abs(nodeVoltage(q.a)-nodeVoltage(q.b));const rated=Math.max(EPS,ratedCoilVoltage(q.comp,typeOf(q.comp)));const next=coilVoltage>=rated*0.8;const previous=Boolean(stateOverrides[q.comp.id]??q.comp.state?.energized??q.comp.props?.energized??false);if(next!==previous){stateOverrides[q.comp.id]=next;changed=true}else if(stateOverrides[q.comp.id]===undefined){stateOverrides[q.comp.id]=next}}
  for(const device of b.comps){if(!["overload_relay","thermal_overload_relay","industrial_industrial_overload_relay"].includes(typeOf(device)))continue;const alreadyTripped=Boolean(stateOverrides[device.id]?.tripped??device.state?.tripped??device.props?.tripped??false);if(alreadyTripped){if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:true};continue}const peak=(b.branches.filter(q=>q.comp.id===device.id&&q.thermal).reduce((max,q)=>Math.max(max,Math.abs(nodeVoltage(q.a)-nodeVoltage(q.b))/q.R),0)),rated=Math.max(EPS,value(device,["ratedCurrent","currentRating","setting"],10)),multiplier=Math.max(1,value(device,["tripMultiplier"],1.05));if(peak>rated*multiplier){stateOverrides[device.id]={tripped:true};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:false}}
  for(const device of b.comps){if(!["circuit_breaker","circuit_breaker_1p","circuit_breaker_2p","circuit_breaker_3p","circuit_breaker_4p","breaker","mcb","mccb","fuse","rcbo"].includes(typeOf(device)))continue;const alreadyTripped=Boolean(stateOverrides[device.id]?.tripped??device.state?.tripped??device.props?.tripped??false);if(alreadyTripped){if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:true};continue}const current=Math.max(0,...b.branches.filter(q=>q.comp.id===device.id&&q.kind==="resistor"&&!q.coil).map(q=>Math.abs(nodeVoltage(q.a)-nodeVoltage(q.b))/q.R)),rating=Math.max(EPS,protectionRating(device)),multiplier=Math.max(1,value(device,["tripMultiplier","instantaneousMultiplier"],typeOf(device)==="fuse"?1.5:5));if(current>rating*multiplier){stateOverrides[device.id]={tripped:true};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:false}}
  for(const device of b.comps){if(typeOf(device)!=="automatic_transfer_switch")continue;const def=window.VoltProTerminalGraph?.definitionFor?.(device.type),pins=pinsOf(device),map=new Map((def?.terminals||[]).map((t,i)=>[String(t.id),pins[i]])),nL1=map.get("N-L1"),nN=map.get("N-N"),eL1=map.get("E-L1"),eN=map.get("E-N"),normalVoltage=b.wired.has(nL1)&&b.wired.has(nN)?Math.abs(nodeVoltage(b.nodeFor(nL1))-nodeVoltage(b.nodeFor(nN))):0,emergencyVoltage=b.wired.has(eL1)&&b.wired.has(eN)?Math.abs(nodeVoltage(b.nodeFor(eL1))-nodeVoltage(b.nodeFor(eN))):0,minVoltage=Math.max(EPS,value(device,["minVoltage","pickupVoltage"],180)),next=normalVoltage>=minVoltage?"normal":emergencyVoltage>=minVoltage?"emergency":"off",previous=stateOverrides[device.id]?.transferSource??device.state?.transferSource??device.props?.transferSource??"normal";if(next!==previous){stateOverrides[device.id]={...(typeof stateOverrides[device.id]==="object"?stateOverrides[device.id]:{}),transferSource:next};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={transferSource:next}}
  for(const device of b.comps){if(typeOf(device)!=="plc_controller")continue;if(plcScan(device,b,nodeVoltage,stateOverrides,ladderAdvanced,options.scanTimeMs))changed=true}
  for(const device of b.comps){if(typeOf(device)!=="arduino_uno_r3")continue;const def=window.VoltProTerminalGraph?.definitionFor?.(device.type),pins=pinsOf(device),map=new Map((def?.terminals||[]).map((t,i)=>[String(t.id),pins[i]])),gnd=map.get("GND_D")||map.get("GND_1")||pins[15],gndV=nodeVoltage(b.nodeFor(gnd)),sketch=String(device.props?.sketch??device.props?.code??""),previous=stateOverrides[device.id]&&typeof stateOverrides[device.id]==="object"?stateOverrides[device.id]:(device.state||{}),mcuState=previous.mcuState??device.state?.mcuState,staticFirmware=window.VoltProMCU?.simulate?.(sketch,{target:"Arduino Uno R3",state:mcuState,dtMs:0}),basePins=stateOverrides[device.id]?.pins??staticFirmware?.pins??device.state?.pins??{},inputs={};for(let n=0;n<=13;n++){const pin=map.get("D"+n),pstate=basePins[String(n)];if(pin&&b.wired.has(pin)&&b.wired.has(gnd)&&["INPUT","INPUT_PULLUP"].includes(pstate?.mode))inputs[String(n)]=Math.abs(nodeVoltage(b.nodeFor(pin))-gndV)>=Math.max(EPS,value(device,["inputThreshold"],2.5))}const dt=mcuAdvanced.has(device.id)?0:Math.max(0,Number(options.scanTimeMs??value(device,["scanTimeMs"],10))||0);mcuAdvanced.add(device.id);const firmware=window.VoltProMCU?.simulate?.(sketch,{target:"Arduino Uno R3",inputs,state:mcuState,dtMs:dt}),currentPins=stateOverrides[device.id]?.pins??staticFirmware?.pins??{},nextPins=firmware?.pins||{},outputChanged=Object.keys(nextPins).some(n=>nextPins[n]?.mode==="OUTPUT"&&(currentPins[n]?.mode!=="OUTPUT"||Math.abs(Number(nextPins[n]?.voltage||0)-Number(currentPins[n]?.voltage||0))>EPS));stateOverrides[device.id]={...previous,pins:nextPins,inputs,firmwareMode:firmware?.mode||"unavailable",mcuState:firmware?.state??mcuState};if(outputChanged)changed=true}
  if(!changed)break;
 }
 const nodeVoltage=n=>n===0?0:(result.x[n-1]?.re||0);
 const x=result.x;
 const branches=b.branches.map(q=>{const u=nodeVoltage(q.a)-nodeVoltage(q.b);let i=0;if(q.kind==="resistor")i=u/q.R;else if(q.kind==="diode")i=u>=q.vf?(u-q.vf)/q.rd:u*q.reverse;else if(q.kind==="bjt")i=u>q.vt?(u-q.vt)/q.beta/Math.max(q.vt,EPS):u*1e-9;else if(q.kind==="mosfet")i=u>q.threshold?u/q.onResistance:u*1e-9;return {id:q.comp.id,type:q.comp.type,contactId:q.contactId||null,voltage:u,current:i,power:u*i}});
 const sourceCurrents=b.voltageSources.map((q,k)=>({id:q.comp.id,type:q.comp.type,current:x[b.N+k]?.re||0}));
 const totalCurrent=sourceCurrents.reduce((s,q)=>s+Math.abs(q.current),0);
 return {ok:true,analysis:"DC operating point (MNA)",engine:"VoltPRo MNA",sourceVoltage:b.voltageSources[0]?.value||0,totalCurrent,totalPower:branches.reduce((s,q)=>s+q.power,0),nodes:b.N,branches,sourceCurrents,nodeVoltages:Array.from({length:b.N},(_,i)=>({node:i+1,voltage:nodeVoltage(i+1)})),deviceStates:Object.fromEntries(Object.entries(stateOverrides)),iterations:12};
}
function dc(project,options={}){return operatingPoint(project,options)}
function ac(project,{start=1,stop=1e5,points=50,frequency=50,groundRef}={}){
 const freqs=points<=1?[frequency]:Array.from({length:points},(_,i)=>start*Math.pow(stop/start,i/(points-1))),rows=[];const ladderAdvanced=new Set(),mcuAdvanced=new Set();
 for(const f of freqs){
  const scale=2*Math.PI*f;let stateOverrides={},b,result;
  // Resolve coil state from AC RMS phasor voltage, then solve the changed network.
  for(let stateIteration=0;stateIteration<8;stateIteration++){
   b=build(project,{groundRef,stateOverrides});
   result=linearSolve(b,{frequency:f,omega:scale,ac:true,xPrev:Array.from({length:b.N},()=>C())},{});
   if(!result.ok)return {ok:false,analysis:"AC sweep",error:result.error};
   const nodeV=n=>n===0?C():result.x[n-1]||C();let changed=false;
   for(const q of b.branches){if(!q.coil)continue;const coilVoltage=mag(sub(nodeV(q.a),nodeV(q.b))),rated=Math.max(EPS,ratedCoilVoltage(q.comp,typeOf(q.comp))),next=coilVoltage>=rated*.8,previous=Boolean(stateOverrides[q.comp.id]??q.comp.state?.energized??q.comp.props?.energized??false);if(next!==previous){stateOverrides[q.comp.id]=next;changed=true}else if(stateOverrides[q.comp.id]===undefined)stateOverrides[q.comp.id]=next}
   for(const device of b.comps){if(!["overload_relay","thermal_overload_relay","industrial_industrial_overload_relay"].includes(typeOf(device)))continue;const alreadyTripped=Boolean(stateOverrides[device.id]?.tripped??device.state?.tripped??device.props?.tripped??false);if(alreadyTripped){if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:true};continue}const peak=b.branches.filter(q=>q.comp.id===device.id&&q.thermal).reduce((max,q)=>Math.max(max,mag(div(sub(nodeV(q.a),nodeV(q.b)),C(q.R)))),0),rated=Math.max(EPS,value(device,["ratedCurrent","currentRating","setting"],10)),multiplier=Math.max(1,value(device,["tripMultiplier"],1.05));if(peak>rated*multiplier){stateOverrides[device.id]={tripped:true};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:false}}
   for(const device of b.comps){if(!["circuit_breaker","circuit_breaker_1p","circuit_breaker_2p","circuit_breaker_3p","circuit_breaker_4p","breaker","mcb","mccb","fuse","rcbo"].includes(typeOf(device)))continue;const alreadyTripped=Boolean(stateOverrides[device.id]?.tripped??device.state?.tripped??device.props?.tripped??false);if(alreadyTripped){if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:true};continue}const current=Math.max(0,...b.branches.filter(q=>q.comp.id===device.id&&q.kind==="resistor"&&!q.coil).map(q=>mag(div(sub(nodeV(q.a),nodeV(q.b)),C(q.R))))),rating=Math.max(EPS,protectionRating(device)),multiplier=Math.max(1,value(device,["tripMultiplier","instantaneousMultiplier"],typeOf(device)==="fuse"?1.5:5));if(current>rating*multiplier){stateOverrides[device.id]={tripped:true};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={tripped:false}}
   for(const device of b.comps){if(typeOf(device)!=="automatic_transfer_switch")continue;const def=window.VoltProTerminalGraph?.definitionFor?.(device.type),pins=pinsOf(device),map=new Map((def?.terminals||[]).map((t,i)=>[String(t.id),pins[i]])),nL1=map.get("N-L1"),nN=map.get("N-N"),eL1=map.get("E-L1"),eN=map.get("E-N"),normalVoltage=b.wired.has(nL1)&&b.wired.has(nN)?mag(sub(nodeV(b.nodeFor(nL1)),nodeV(b.nodeFor(nN)))):0,emergencyVoltage=b.wired.has(eL1)&&b.wired.has(eN)?mag(sub(nodeV(b.nodeFor(eL1)),nodeV(b.nodeFor(eN)))):0,minVoltage=Math.max(EPS,value(device,["minVoltage","pickupVoltage"],180)),next=normalVoltage>=minVoltage?"normal":emergencyVoltage>=minVoltage?"emergency":"off",previous=stateOverrides[device.id]?.transferSource??device.state?.transferSource??device.props?.transferSource??"normal";if(next!==previous){stateOverrides[device.id]={...(typeof stateOverrides[device.id]==="object"?stateOverrides[device.id]:{}),transferSource:next};changed=true}else if(stateOverrides[device.id]===undefined)stateOverrides[device.id]={transferSource:next}}
   for(const device of b.comps){if(typeOf(device)!=="plc_controller")continue;if(plcScan(device,b,nodeV,stateOverrides,ladderAdvanced,options.scanTimeMs))changed=true}
   for(const device of b.comps){if(typeOf(device)!=="arduino_uno_r3")continue;const def=window.VoltProTerminalGraph?.definitionFor?.(device.type),pins=pinsOf(device),map=new Map((def?.terminals||[]).map((t,i)=>[String(t.id),pins[i]])),gnd=map.get("GND_D")||map.get("GND_1")||pins[15],gndV=nodeV(b.nodeFor(gnd)),sketch=String(device.props?.sketch??device.props?.code??""),previous=stateOverrides[device.id]&&typeof stateOverrides[device.id]==="object"?stateOverrides[device.id]:(device.state||{}),mcuState=previous.mcuState??device.state?.mcuState,staticFirmware=window.VoltProMCU?.simulate?.(sketch,{target:"Arduino Uno R3",state:mcuState,dtMs:0}),basePins=stateOverrides[device.id]?.pins??staticFirmware?.pins??device.state?.pins??{},inputs={};for(let n=0;n<=13;n++){const pin=map.get("D"+n),pstate=basePins[String(n)];if(pin&&b.wired.has(pin)&&b.wired.has(gnd)&&["INPUT","INPUT_PULLUP"].includes(pstate?.mode))inputs[String(n)]=mag(sub(nodeV(b.nodeFor(pin)),gndV))>=Math.max(EPS,value(device,["inputThreshold"],2.5))}const dt=mcuAdvanced.has(device.id)?0:Math.max(0,Number(options.scanTimeMs??value(device,["scanTimeMs"],10))||0);mcuAdvanced.add(device.id);const firmware=window.VoltProMCU?.simulate?.(sketch,{target:"Arduino Uno R3",inputs,state:mcuState,dtMs:dt}),currentPins=stateOverrides[device.id]?.pins??staticFirmware?.pins??{},nextPins=firmware?.pins||{},outputChanged=Object.keys(nextPins).some(n=>nextPins[n]?.mode==="OUTPUT"&&(currentPins[n]?.mode!=="OUTPUT"||Math.abs(Number(nextPins[n]?.voltage||0)-Number(currentPins[n]?.voltage||0))>EPS));stateOverrides[device.id]={...previous,pins:nextPins,inputs,firmwareMode:firmware?.mode||"unavailable",mcuState:firmware?.state??mcuState};if(outputChanged)changed=true}
   if(!changed)break;
  }
  const x=result.x,nodeV=n=>n===0?C():x[n-1]||C(),vs=b.voltageSources[0],vout=vs?sub(nodeV(vs.a),nodeV(vs.b)):C(),z=vs&&x[b.N]&&mag(x[b.N])>EPS?div(vout,x[b.N]):C(Infinity,0);
  const branches=b.branches.map(q=>{
   const v=sub(nodeV(q.a),nodeV(q.b));let i=C();
   if(q.kind==="resistor")i=div(v,C(q.R));
   else if(q.kind==="capacitor")i=mul(v,C(0,scale*q.C));
   else if(q.kind==="inductor")i=div(v,C(0,scale*q.L));
   else if(q.kind==="open")i=C();
   const power=v.re*i.re+v.im*i.im;
   return {id:q.comp.id,type:q.comp.type,contactId:q.contactId||null,phase:q.phase||null,voltage:mag(v),voltagePhaseDeg:deg(v),current:mag(i),currentPhaseDeg:deg(i),power};
  });
  const sourceCurrents=b.voltageSources.map((q,k)=>{const i=x[b.N+k]||C();return {id:q.comp.id,type:q.comp.type,phaseName:q.phaseName||null,current:mag(i),phaseDeg:deg(i),real:i.re,imag:i.im}});
  const nodeVoltages=Array.from({length:b.N},(_,i)=>({node:i+1,voltage:mag(x[i]||C()),phaseDeg:deg(x[i]||C()),real:(x[i]||C()).re,imag:(x[i]||C()).im}));
  rows.push({frequency:f,magnitude:mag(vout),phaseDeg:deg(vout),impedanceMagnitude:mag(z),impedancePhaseDeg:deg(z),branches,nodeVoltages,sourceCurrents,deviceStates:{...stateOverrides},totalCurrent:sourceCurrents.length?sourceCurrents.reduce((sum,q)=>sum+q.current,0)/sourceCurrents.length:0,totalPower:branches.reduce((sum,q)=>sum+q.power,0)});
 }
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