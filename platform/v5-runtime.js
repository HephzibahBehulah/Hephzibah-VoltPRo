(()=>{'use strict';
function adapt(legacy){
 const source=legacy.components||legacy.devices||[];
 const devices=source.map(c=>{
  const meta=window.VoltProRegistry?.get?.(c.type);
  const graph=window.VoltProTerminalGraph?.definitionFor?.(c.type);
  const registered=meta?.terminals?.length?meta.terminals:null;
  const specs=graph?.terminals?.length?graph.terminals:(registered||null);
  const terminals=specs?specs.map(t=>({id:String(t.id),label:t.label||t.id,type:t.type||'electrical',number:t.number??null,domain:t.domain||'dc',position:t.position||undefined,direction:t.direction||undefined,phase:t.phase??null,polarity:t.polarity??null})):Array.from({length:Number(window.defs?.[c.type]?.pins||c.pins?.length||2)},(_,i)=>({id:String(i),label:String(i+1),type:'electrical',domain:'dc'}));
  return {id:c.id,type:c.type,ref:c.ref||c.id,registryId:c.registryId||meta?.id||null,position:{x:c.x||0,y:c.y||0},rotation:c.rotation||0,terminals,parameters:structuredClone(c.props||c.parameters||{}),state:structuredClone(c.state||{}),model:c.model||meta?.electricalModel?.type||null};
 });
 const terminalIndex=new Map(devices.map(d=>[d.id,d.terminals.map(t=>String(t.id))]));
 const terminalDomains=new Map(devices.flatMap(d=>d.terminals.map(t=>[d.id+":"+String(t.id),String(t.domain||"dc")])));
 const mapEndpoint=value=>{
  if(value&&typeof value==='object'&&value.deviceId!=null&&value.terminalId!=null)return {deviceId:String(value.deviceId),terminalId:String(value.terminalId)};
  if(typeof value!=='string')return value;
  const split=value.lastIndexOf(':');if(split<1)return value;
  const deviceId=value.slice(0,split),local=value.slice(split+1),ids=terminalIndex.get(deviceId);
  if(!ids)return value;
  const index=/^\d+$/.test(local)?Number(local):-1;
  return deviceId+':'+(index>=0&&index<ids.length?ids[index]:local);
 };
 const wires=(legacy.wires||[]).map((w,i)=>{const {a,b,...extra}=w,from=mapEndpoint(w.from||a),to=mapEndpoint(w.to||b),domain=w.domain||terminalDomains.get(String(from))||terminalDomains.get(String(to))||"dc";return {...extra,id:w.id||"W"+String(i+1).padStart(3,"0"),from,to,segments:w.segments||[],number:w.number||null,domain,phase:w.phase||null}});
 return {format:'voltpro',version:5,workspace:legacy.mode||'schematic',metadata:{name:'VoltPRo runtime project'},settings:{grid:legacy.grid||20,units:'SI',symbolStandard:'IEC'},devices,wires,nets:[],simulation:{mode:'dc',running:false,time:0},faults:structuredClone(legacy.faults||[])};
}
function analyze(legacy){const project=adapt(legacy),tg=window.VoltProTerminalGraph?.build(project);const validation=tg?.validateTopology?.()||{valid:false,errors:[{code:'TOPOLOGY_VALIDATOR_UNAVAILABLE'}]},nr=tg&&window.VoltProNetResolver?.resolve(project,tg);const errors=validation.errors||[],netErrors=nr?.errors||[],behaviour=(project.devices||[]).map(d=>window.VoltProDeviceModels?.evaluate(d,{})||{ok:false,status:'unavailable',deviceId:d.id});return {project,topology:{valid:Boolean(validation.valid)&&Boolean(nr?.valid),errors,nets:nr?.nets||[],netErrors},behaviour}}
window.VoltProV5Runtime={adapt,analyze};
})();