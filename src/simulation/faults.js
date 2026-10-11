(()=>{'use strict';
const TYPES=new Set(['open-wire','short-circuit','open-neutral','earth-fault','phase-loss','overload','blown-fuse','breaker-trip','rcd-trip','stuck-open-contact','welded-contact','coil-failure','sensor-failure','wrong-terminal','loose-connection']);
const clone=value=>structuredClone(value);
function inject(project,fault){if(!TYPES.has(fault.type))throw Error('Unknown fault type: '+fault.type);const faults=project.faults||(project.faults=[]);const f={id:fault.id||'F'+String(faults.length+1).padStart(3,'0'),active:fault.active!==false,type:fault.type,target:fault.target||null,parameters:clone(fault.parameters||{}),description:fault.description||fault.type};const i=faults.findIndex(x=>x.id===f.id);if(i>=0)faults[i]=f;else faults.push(f);return f}
function clear(project,id){if(!Array.isArray(project.faults))return false;const i=project.faults.findIndex(x=>x.id===id);if(i<0)return false;project.faults.splice(i,1);return true}
function active(project,type){return (project.faults||[]).filter(f=>f.active!==false&&(type?f.type===type:true))}
function applyToDevice(device,project){for(const f of active(project)){if(String(f.target)!==String(device.id))continue;device.state={...(device.state||{})};if(f.type==='stuck-open-contact')device.state.forcedOpen=true;else if(f.type==='welded-contact')device.state.forcedClosed=true;else if(f.type==='coil-failure')device.state.coilFailed=true;else if(['blown-fuse','breaker-trip','rcd-trip'].includes(f.type)){device.state.tripped=true;if(f.type==='blown-fuse')device.state.intact=false}else if(f.type==='phase-loss')device.state.lostPhase=String(f.parameters?.phase||'L2').toUpperCase();else if(f.type==='sensor-failure')device.state.sensorFailed=true}return device}
function applyToProject(project){
 const out={...project,components:clone(project.components||[]),wires:clone(project.wires||[]),faults:clone(project.faults||[])},applied=[],unsupported=[];
 for(const fault of active(out)){
  const target=String(fault.target||''),device=out.components.find(c=>String(c.id)===target);
  if(fault.type==='open-wire'||fault.type==='open-neutral'){
   const before=out.wires.length;out.wires=out.wires.filter(w=>String(w.id)!==target);
   if(out.wires.length<before)applied.push(fault.id);else unsupported.push({id:fault.id,reason:'Target must be an existing wire ID'});continue;
  }
  if(fault.type==='short-circuit'){
   if(!device){unsupported.push({id:fault.id,reason:'Target must be an existing component ID'});continue}
   device.props={...(device.props||{}),resistance:Math.max(0.01,Number(fault.parameters?.resistance)||0.01)};
   applied.push(fault.id);continue;
  }
  if(fault.type==='earth-fault'){
   if(!device){unsupported.push({id:fault.id,reason:'Target must be an existing component ID'});continue}
   const source=out.components.find(c=>['battery','dcsource','acsource','ac_source','threephase'].includes(String(c.type||'').toLowerCase()));
   if(!source){unsupported.push({id:fault.id,reason:'A source with a reference terminal is required'});continue}
   const pin=Math.max(0,Math.floor(Number(fault.parameters?.pin)||0)),groundPin=String(source.type).toLowerCase()==='threephase'?3:1,resistorId='FRT_'+String(fault.id).replace(/[^A-Za-z0-9_-]/g,'_'),resistance=Math.max(1,Number(fault.parameters?.resistance)||1000);
   if(out.components.some(c=>String(c.id)===resistorId)){unsupported.push({id:fault.id,reason:'Fault resistor ID already exists'});continue}
   out.components.push({id:resistorId,type:'resistor',props:{resistance},pins:[resistorId+':0',resistorId+':1'],faultInjected:true});
   out.wires.push({id:resistorId+'_A',a:target+':'+pin,b:resistorId+':0',internal:true,faultId:fault.id},{id:resistorId+'_B',a:resistorId+':1',b:String(source.id)+':'+groundPin,internal:true,faultId:fault.id});
   applied.push(fault.id);continue;
  }
  if(['stuck-open-contact','welded-contact','coil-failure','blown-fuse','breaker-trip','rcd-trip','phase-loss','sensor-failure'].includes(fault.type)&&device){
   applyToDevice(device,{faults:[fault]});applied.push(fault.id);continue;
  }
  unsupported.push({id:fault.id,reason:'Fault type is not yet connected to an electrical model'});
 }
 out.faultDiagnostics={applied,unsupported};
 return out;
}
window.VoltProFaults={TYPES:Array.from(TYPES),inject,clear,active,applyToDevice,applyToProject};
})();
