(function(root){
"use strict";
let latest={};
const key=(component,index)=>String(component)+":"+String(index);
function endpoint(value){if(typeof value==="string")return value;if(value&&typeof value==="object"){if(value.componentId!=null&&value.terminalId!=null)return key(value.componentId,value.terminalId);if(value.deviceId!=null&&value.terminalId!=null)return key(value.deviceId,value.terminalId)}return ""}
function addEdge(graph,a,b,kind){if(!a||!b||a===b)return;for(const [from,to] of [[a,b],[b,a]]){if(!graph.has(from))graph.set(from,[]);graph.get(from).push({to,kind})}}
function pathBetween(graph,start,target){const queue=[start],previous=new Map([[start,null]]);for(let i=0;i<queue.length;i++){const here=queue[i];if(here===target){const path=[];let p=target;while(p!==null){path.push(p);p=previous.get(p)}return path.reverse()}for(const edge of graph.get(here)||[]){if(previous.has(edge.to))continue;previous.set(edge.to,here);queue.push(edge.to)}}return null}
function evaluate(components,wires,outputs={}){
 const list=Array.isArray(components)?components:[],graph=new Map(),boards=list.filter(c=>c.type==="arduino-uno-r3"),grounds=list.filter(c=>c.type==="ground").map(c=>key(c.id,0));
 for(const wire of Array.isArray(wires)?wires:[]){const a=endpoint(wire.a??wire.from),b=endpoint(wire.b??wire.to);addEdge(graph,a,b,"wire")}
 for(const component of list){if(component.type==="resistor"||component.type==="fuse"&&Number(component.props?.blown)!==1||component.type==="switch"&&Number(component.props?.closed)===1){const count=component.type==="resistor"||component.type==="fuse"||component.type==="switch"?2:0;if(count===2)addEdge(graph,key(component.id,0),key(component.id,1),component.type)}}
 for(const board of boards){for(const index of [15,22,23,37])grounds.push(key(board.id,index))}
 const outputRefs=[];for(const board of boards){for(let pin=0;pin<=13;pin++)outputRefs.push({board,pin,ref:key(board.id,pin)})}
 const leds=list.filter(c=>c.type==="led").map(led=>{
  const anode=key(led.id,0),cathode=key(led.id,1);let match=null;
  for(const output of outputRefs){const outputPath=pathBetween(graph,output.ref,anode);if(!outputPath)continue;for(const ground of grounds){const groundPath=pathBetween(graph,cathode,ground);if(!groundPath)continue;const nodes=outputPath.concat(groundPath),resistorInPath=nodes.some(node=>{const id=node.slice(0,node.lastIndexOf(":")),part=list.find(c=>c.id===id);return part?.type==="resistor"});const state=outputs[String(output.pin)],voltage=Number(state?.voltage)||0,high=Boolean(state?.state)||voltage>=2.5;match={id:led.id,connected:true,pin:output.pin,outputHigh:high,seriesResistor:resistorInPath,lit:high&&resistorInPath,voltage:high?voltage:0,warning:resistorInPath?"": "No series current-limiting resistor found in the modeled connection."};break}if(match)break}
  return match||{id:led.id,connected:false,pin:null,outputHigh:false,seriesResistor:false,lit:false,voltage:0,warning:"No complete Arduino output → LED anode → LED cathode → GND path detected."};
 });
 latest=Object.fromEntries(leds.map(led=>[led.id,Boolean(led.lit)]));
 return {leds,ledCount:leds.length,connectedCount:leds.filter(led=>led.connected).length,litCount:leds.filter(led=>led.lit).length,boardCount:boards.length,signature:JSON.stringify(leds.map(({id,connected,pin,lit,seriesResistor})=>({id,connected,pin,lit,seriesResistor})))};
}
const api={evaluate,isLedLit:id=>Boolean(latest[id]),reset:()=>{latest={}}};
root.VoltProMCUCircuitBridge=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
