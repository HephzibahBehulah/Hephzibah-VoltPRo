import {scan} from './engine';
import {emptyMemory,type Project} from './model';
let project:Project|null=null,inputs:Record<string,boolean>={},memory=emptyMemory(),timer:ReturnType<typeof setInterval>|undefined;
function stop(){if(timer)clearInterval(timer);timer=undefined;}
self.onmessage=(event:MessageEvent<{type:'run'|'stop'|'inputs'|'reset'|'step';project?:Project;inputs?:Record<string,boolean>}>)=>{const m=event.data;if(m.type==='stop'){stop();return;}if(m.type==='reset'){stop();memory=emptyMemory();return;}if(m.project)project=m.project;if(m.inputs)inputs=m.inputs;if(m.type==='inputs')return;const tick=()=>{if(!project)return;try{const next=scan(project,inputs,memory,20);memory=next.memory;self.postMessage({type:'result',result:next.result});}catch(error){stop();self.postMessage({type:'error',message:error instanceof Error?error.message:'Simulation failed.'});}};if(m.type==='step')tick();if(m.type==='run'){stop();timer=setInterval(tick,20);tick();}};
