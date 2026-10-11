(function(root){
"use strict";
const bit=value=>value===true||value===1||String(value).toLowerCase()==="true"||String(value)==="1";
const address=value=>String(value??"").trim().toUpperCase();
function readBit(tag,inputs,state){
 const key=address(tag);
 if(!key)return false;
 if(key.startsWith("I"))return bit(inputs[key]??inputs[key.toLowerCase()]??inputs[key.slice(1)]??false);
 if(key.startsWith("Q"))return bit(state.outputs[key]??state.outputs[key.toLowerCase()]??false);
 if(key.startsWith("M"))return bit(state.memory[key]??state.memory[key.toLowerCase()]??false);
 if(key.startsWith("T"))return bit(state.timers[key]?.done??false);
 if(key.startsWith("C"))return bit(state.counters[key]?.done??false);
 return bit(inputs[key]??state.outputs[key]??state.memory[key]??false);
}
function contactClosed(contact,inputs,state,currentBits){
 const tag=address(contact.address??contact.tag??contact.bit),kind=String(contact.type??contact.kind??"NO").toUpperCase(),raw=readBit(tag,inputs,state);
 if(tag)currentBits[tag]=raw;
 if(["NC","XIO","NORMALLY_CLOSED"].includes(kind))return !raw;
 if(["P","RISING","ONS","ONE_SHOT"].includes(kind))return raw&&!bit(state.previousBits?.[tag]);
 if(["N","FALLING"].includes(kind))return !raw&&bit(state.previousBits?.[tag]);
 return raw;
}
function branchPowered(branch,inputs,state,currentBits){return (branch||[]).every(contact=>contactClosed(contact,inputs,state,currentBits))}
function scan(program,inputs={},previousState={},options={}){
 if(!program||!Array.isArray(program.rungs))return {ok:false,error:"Ladder program must contain a rungs array."};
 const dt=Math.max(0,Number(options.dtMs??10)||0);
 const state={outputs:{...(previousState.outputs||{})},memory:{...(previousState.memory||{})},timers:{...(previousState.timers||{})},counters:{...(previousState.counters||{})},previousBits:{...(previousState.previousBits||{})},rungPower:{...(previousState.rungPower||{})}};
 const currentBits={},rungResults=[];
 for(const rung of program.rungs){
  const branches=Array.isArray(rung.branches)?rung.branches:[Array.isArray(rung.contacts)?rung.contacts:[]];
  const branchResults=branches.map(branch=>branchPowered(branch,inputs,state,currentBits)),powered=branchResults.some(Boolean);
  const coils=Array.isArray(rung.coils)?rung.coils:(rung.coil?[rung.coil]:[]);
  for(const coil of coils){
   const tag=address(coil.address??coil.tag??coil.output),kind=String(coil.type??coil.kind??"COIL").toUpperCase();
   if(!tag)continue;
   if(["SET","LATCH","OTL"].includes(kind)){if(powered)state.outputs[tag]=true}
   else if(["RESET","UNLATCH","OTU"].includes(kind)){if(powered)state.outputs[tag]=false}
   else if(["TON","TOF","TP"].includes(kind)){
    const key=address(coil.timer??tag),preset=Math.max(0,Number(coil.presetMs??coil.preset??1000)||0),old=state.timers[key]||{elapsedMs:0,done:false};
    let elapsed=old.elapsedMs,done=false;
    if(kind==="TON"){elapsed=powered?Math.min(preset,elapsed+dt):0;done=powered&&elapsed>=preset}
    else if(kind==="TOF"){elapsed=powered?0:old.done?Math.min(preset,elapsed+dt):preset;done=powered||elapsed<preset}
    else {elapsed=powered&&!old.triggered?0:old.elapsedMs;done=powered&&elapsed<preset; if(powered&&!old.triggered)elapsed=0; if(!powered)elapsed=preset; }
    state.timers[key]={elapsedMs:elapsed,done,triggered:powered};
    state.outputs[tag]=done;
   }
   else if(["CTU","COUNTER_UP"].includes(kind)){
    const key=address(coil.counter??tag),preset=Math.max(1,Number(coil.preset??1)||1),old=state.counters[key]||{count:0,done:false},rising=powered&&!bit(state.rungPower[rung.id??tag]);
    const count=old.count+(rising?1:0),done=count>=preset;state.counters[key]={count,done};state.outputs[tag]=done;
   }
   else if(["CTD","COUNTER_DOWN"].includes(kind)){
    const key=address(coil.counter??tag),preset=Math.max(1,Number(coil.preset??1)||1),old=state.counters[key]||{count:preset,done:false},falling=!powered&&bit(state.rungPower[rung.id??tag]);
    const count=Math.max(0,old.count-(falling?1:0)),done=count===0;state.counters[key]={count,done};state.outputs[tag]=done;
   }
   else state.outputs[tag]=powered;
  }
  state.rungPower[rung.id??String(rungResults.length)]=powered;
  rungResults.push({id:rung.id??String(rungResults.length),powered,branches:branchResults,coils:coils.map(c=>({address:address(c.address??c.tag??c.output),energized:bit(state.outputs[address(c.address??c.tag??c.output)]),type:String(c.type??c.kind??"COIL").toUpperCase()}))});
 }
 state.previousBits={...currentBits};
 return {ok:true,outputs:{...state.outputs},memory:{...state.memory},timers:{...state.timers},counters:{...state.counters},rungs:rungResults,state};
}
const api={scan,evaluate:scan,readBit,contactClosed};
root.VoltProLadder=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
