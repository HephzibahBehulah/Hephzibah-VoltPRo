/* VoltPRo wiring workflow: geometry and interaction state, independent of SVG rendering. */
(function(root,factory){
 const api=factory();
 if(typeof module==="object"&&module.exports) module.exports=api;
 if(root){root.VoltProWiring=api;if(root.window&&root.window!==root)root.window.VoltProWiring=api;}
})(typeof globalThis!=="undefined"?globalThis:this,function(){
 "use strict";
 const endpointPair=w=>[String(w.a??w.from??""),String(w.b??w.to??"")];
 const pairKey=(a,b)=>[String(a),String(b)].sort().join("|");
 function routeOrthogonal(a,b,opts={}){
  const grid=Math.max(1,Number(opts.grid)||10), sx=Number(a.x),sy=Number(a.y),tx=Number(b.x),ty=Number(b.y);
  const bends=Array.isArray(opts.bends)?opts.bends.map(p=>({x:Number(p.x),y:Number(p.y)})):[];
  let points=[{x:sx,y:sy},...bends,{x:tx,y:ty}];
  if(opts.mode!=="free"&&!bends.length&&sx!==tx&&sy!==ty){const mid=opts.prefer==="vertical"?{x:sx,y:ty}:{x:tx,y:sy};points=[points[0],mid,points[1]]}
  const orthogonal=[];
  for(let i=0;i<points.length;i++){
   const p=points[i];if(!orthogonal.length){orthogonal.push(p);continue}
   const prev=orthogonal[orthogonal.length-1];
   if(opts.mode!=="free"&&prev.x!==p.x&&prev.y!==p.y){const elbow=opts.prefer==="vertical"?{x:prev.x,y:p.y}:{x:p.x,y:prev.y};orthogonal.push(elbow)}
   orthogonal.push(p);
  }
  const compact=orthogonal.filter((p,i)=>!i||p.x!==orthogonal[i-1].x||p.y!==orthogonal[i-1].y);
  return {points:compact,segments:compact.slice(1).map((p,i)=>({x1:compact[i].x,y1:compact[i].y,x2:p.x,y2:p.y,orientation:compact[i].x===p.x?"v":"h"}))};
 }
 function electricalWires(wires=[]){
  const normalized=wires.map((w,i)=>normalizeWire(w,i)), byJunction=new Map(), links=[];
  normalized.forEach((w,i)=>(w.junctions||[]).forEach(j=>{if(!j||!j.id)return;const id=String(j.id);if(!byJunction.has(id))byJunction.set(id,[]);byJunction.get(id).push(i)}));
  for(const [junctionId,indices] of byJunction){const unique=[...new Set(indices)];if(unique.length<2)continue;const anchor=normalized[unique[0]];for(const i of unique.slice(1)){const other=normalized[i];if(anchor.a!==other.a)links.push({id:"JUNCTION:"+junctionId+":"+i,a:anchor.a,b:other.a,route:"electrical-junction",junctionId,synthetic:true})}}
  return normalized.concat(links);
 }
 function normalizeWire(w,index=0){
  const [a,b]=endpointPair(w);
  return {...w,id:String(w.id||"W"+String(index+1).padStart(3,"0")),a,b,route:"orthogonal",bends:Array.isArray(w.bends)?w.bends.map(p=>({x:Number(p.x),y:Number(p.y)})):[],junctions:Array.isArray(w.junctions)?w.junctions.map(j=>({...j})):[]};
 }
 function validateConnection(a,b,wires){
  if(!a||!b)return {valid:false,code:"TERMINAL_NOT_FOUND",message:"Choose two existing component terminals."};
  if(a===b)return {valid:false,code:"SAME_TERMINAL",message:"Choose a different destination terminal."};
  const [ad]=a.split(":"),[bd]=b.split(":");
  if(ad===bd)return {valid:false,code:"SAME_COMPONENT",message:"Connect terminals on different components. Internal device paths are defined by the component model."};
  if((wires||[]).some(w=>{const [x,y]=endpointPair(w);return pairKey(x,y)===pairKey(a,b)}))return {valid:false,code:"DUPLICATE_CONNECTION",message:"These terminals are already connected."};
  return {valid:true,code:"OK",message:"Connection is valid."};
 }
 class Controller{
  constructor(callbacks={}){this.callbacks=callbacks;this.active=false;this.start=null;this.pointer=null;this.selectedWire=null;this.lastError=null;this.bends=[];this.prefer="horizontal";this.mode="orthogonal"}
  begin(){this.bends=[];this.active=true;this.start=null;this.pointer=null;this.lastError=null;this.callbacks.onState?.(this.snapshot())}
  cancel(){this.bends=[];const was=this.active||this.start!==null;this.active=false;this.start=null;this.pointer=null;if(was)this.callbacks.onCancel?.();this.callbacks.onState?.(this.snapshot());return was}
  pointerMove(point){if(!this.active||!this.start)return;this.pointer={x:Number(point.x),y:Number(point.y)};this.callbacks.onPreview?.(this.start,this.pointer)}
  addWaypoint(point){if(!this.active||!this.start)return false;this.bends.push({x:Number(point.x),y:Number(point.y)});this.pointer={...point};this.callbacks.onState?.(this.snapshot());return true}
  undoWaypoint(){this.bends.pop();this.callbacks.onState?.(this.snapshot())}
  selectTerminal(ref,position){
   if(!this.active){this.callbacks.onTerminalSelect?.(ref);return {action:"select"}}
   if(!this.start){this.start=ref;this.pointer=position?{...position}:null;this.callbacks.onStart?.(ref,position);this.callbacks.onState?.(this.snapshot());return {action:"start"}}
   const result=validateConnection(this.start,ref,this.callbacks.getWires?.()||[]);
   if(!result.valid){this.lastError=result;this.callbacks.onError?.(result.message,result);this.callbacks.onState?.(this.snapshot());return {action:"invalid",...result}}
   const wire={id:this.callbacks.nextId?.()||("W"+Date.now().toString(36)),a:this.start,b:ref,route:"orthogonal",routeMode:this.mode,prefer:this.prefer,bends:this.bends.map(p=>({...p})),junctions:[]};
   this.callbacks.onCommit?.(wire);this.bends=[];this.active=false;this.start=null;this.pointer=null;this.lastError=null;this.callbacks.onState?.(this.snapshot());return {action:"connected",wire};
  }
  selectWire(id){this.selectedWire=id;this.callbacks.onWireSelect?.(id)}
  handleKey(event){if(this.active&&event?.key==="Backspace"){event.preventDefault?.();this.undoWaypoint();return true}if(this.active&&event?.key==="Tab"){event.preventDefault?.();this.prefer=this.prefer==="horizontal"?"vertical":"horizontal";this.callbacks.onState?.(this.snapshot());return true}if(event?.key==="Escape"&&this.active){event.preventDefault?.();this.cancel();return true}if(event?.key==="Delete"&&this.selectedWire){event.preventDefault?.();this.callbacks.onDeleteWire?.(this.selectedWire);return true}return false}
  snapshot(){return {bends:this.bends.map(p=>({...p})),prefer:this.prefer,mode:this.mode,active:this.active,start:this.start,pointer:this.pointer,selectedWire:this.selectedWire,lastError:this.lastError}}
 }
 return {routeOrthogonal,normalizeWire,electricalWires,validateConnection,Controller,pairKey,endpointPair};
});