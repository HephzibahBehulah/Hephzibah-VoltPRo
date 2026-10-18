(()=>{"use strict";
const CURRENT=5;
function unwrap(input){
 const value=typeof input==="string"?JSON.parse(input):input;
 if(!value||typeof value!=="object"||Array.isArray(value))throw Error("Invalid .voltpro project");
 if(value.format==="voltpro-export"){
  if(!value.project||typeof value.project!=="object"||Array.isArray(value.project))throw Error("Invalid VoltPRo export envelope: project payload is missing");
  return value.project;
 }
 return value;
}
function legacyTerminals(d){
 if(Array.isArray(d.terminals)&&d.terminals.length)return d.terminals.map((t,i)=>({id:t.id||String(i),label:t.label||t.id||String(i),type:t.type||"electrical",number:t.number??null,domain:t.domain||"dc"}));
 if(Array.isArray(d.pins)&&d.pins.length)return d.pins.map((p,i)=>{const id=typeof p==="string"?String(p).split(":").pop():p.id||String(i);return {id,label:typeof p==="string"?id:(p.label||id),type:typeof p==="string"?"electrical":(p.type||"electrical"),number:typeof p==="string"?null:(p.number??null),domain:typeof p==="string"?"dc":(p.domain||"dc")};});
 const count=Math.max(2,Number(window.defs?.[d.type]?.pins||window.VoltProRegistry?.definition?.(d.type)?.pins||2));
 return Array.from({length:count},(_,i)=>({id:String(i),label:String(i+1),type:"electrical",number:String(i+1),domain:"dc"}));
}
function migrateDevice(d,index){
 const id=d.id||"D"+String(index+1).padStart(3,"0");
 return {id,type:d.type||d.model||"unknown",version:d.version||"1.0.0",ref:d.ref||id,registryId:d.registryId||null,position:{x:Number(d.position?.x??d.x??0),y:Number(d.position?.y??d.y??0)},rotation:Number(d.rotation||0),terminals:legacyTerminals(d),parameters:structuredClone(d.parameters||d.props||{}),state:structuredClone(d.state||{}),model:d.model||d.simulation?.model||null};
}
function normalize(input={}){
 const raw=unwrap(input);
 const now=new Date().toISOString();
 const devices=(raw.devices||raw.components||[]).map(migrateDevice);
 return {format:"voltpro",version:CURRENT,metadata:{name:"Untitled Circuit",author:"",created:now,updated:now,standards:["IEC 60617","IEC 81346","IEC 60417"],...(raw.metadata||{})},settings:{grid:20,units:"SI",symbolStandard:"IEC",theme:"dark",...(raw.settings||{})},workspace:raw.workspace||"schematic",devices,wires:(raw.wires||[]).map((w,i)=>{const {a,b,...extra}=w;return {...extra,id:w.id||"W"+String(i+1).padStart(3,"0"),from:w.from||a,to:w.to||b,segments:Array.isArray(w.segments)?structuredClone(w.segments):[],number:w.number??null,crossSection:w.crossSection??null,colour:w.colour??null,color:w.color??null,material:w.material??null,cableType:w.cableType??null,size:w.size??null,gauge:w.gauge??null,width:w.width??null,pattern:w.pattern??null,bends:Array.isArray(w.bends)?structuredClone(w.bends):[],domain:w.domain||"dc",phase:w.phase??null}}),nets:Array.isArray(raw.nets)?structuredClone(raw.nets):[],panel:raw.panel||{rails:[],items:[],width:600,height:400},viewport:raw.viewport||{zoom:1,pan:{x:0,y:0}},wireStyle:raw.wireStyle||{},simulation:raw.simulation||{mode:"dc",running:false,time:0},plc:raw.plc||null,firmware:raw.firmware||{target:null,language:"arduino-cpp",code:""},faults:raw.faults||[],componentContracts:Array.isArray(raw.componentContracts)?structuredClone(raw.componentContracts):[],history:[]};
}
function encode(p){return JSON.stringify(normalize(p),null,2)}
function decode(s){return normalize(unwrap(s))}
function migrate(input){
 const raw=unwrap(input);
 const old=Number(raw.version||1),x=normalize(raw);if(old<CURRENT){x.metadata.migratedFrom=old;x.metadata.migratedAt=new Date().toISOString()}return x;
}
function toLegacy(input){
 const envelope=typeof input==="string"?JSON.parse(input):input;
 if(!envelope||typeof envelope!=="object")throw Error("Invalid .voltpro project");
 const raw=envelope.format==="voltpro-export"?envelope.project:envelope;
 if(!raw||raw.format!=="voltpro")throw Error("Unsupported VoltPRo project format");
 const p=migrate(raw),devices=p.devices||[],byId=new Map(devices.map(d=>[String(d.id),d]));
 const components=devices.map(d=>({id:d.id,ref:d.ref||d.id,type:d.type||d.model||"unknown",registryId:d.registryId||null,x:Number(d.position?.x??0),y:Number(d.position?.y??0),rotation:Number(d.rotation||0),props:structuredClone(d.parameters||{}),pins:(d.terminals||[]).map((_,i)=>d.id+":"+i)}));
 function endpoint(value){
  if(value&&typeof value==="object"&&value.deviceId!=null&&value.terminalId!=null)value=String(value.deviceId)+":"+String(value.terminalId);
  if(typeof value!=="string"||!value.includes(":"))throw Error("Invalid wire endpoint: "+String(value));
  const cut=value.lastIndexOf(":"),id=value.slice(0,cut),terminal=value.slice(cut+1),d=byId.get(id);
  if(!d)throw Error("Wire references missing device: "+id);
  const terms=Array.isArray(d.terminals)?d.terminals:[];
  // Exact IDs take precedence: terminal id "1" may be the second pin even
  // when the first pin has the human-facing label "1".
  let index=terms.findIndex(t=>String(t.id)===terminal);
  if(index<0)index=terms.findIndex(t=>String(t.label)===terminal||(t.number!=null&&String(t.number)===terminal));
  if(index<0&&/^\d+$/.test(terminal)&&Number(terminal)<terms.length)index=Number(terminal);
  if(index<0)throw Error("Unknown terminal "+terminal+" on device "+id);
  return id+":"+index;
 }
 const wires=(p.wires||[]).map((wire,i)=>{const {from,to,...w}=wire;return {...w,id:w.id||"W"+String(i+1).padStart(3,"0"),a:endpoint(from||w.a),b:endpoint(to||w.b)}});
 const workspace=typeof p.workspace==="string"?p.workspace:(p.workspace?.mode||"schematic");
 return {format:"voltpro",version:2,mode:raw.mode||workspace,viewport:structuredClone(raw.viewport||{}),components,wires,wireStyle:structuredClone(raw.wireStyle||{}),panel:structuredClone(p.panel||{rails:[],items:[],width:600,height:400}),metadata:structuredClone(p.metadata||{})};
}
window.VoltProProject={CURRENT,normalize,encode,decode,migrate,toLegacy};
})();
