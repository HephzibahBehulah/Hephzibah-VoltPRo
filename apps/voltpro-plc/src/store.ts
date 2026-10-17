import {create} from 'zustand';
import {starter} from './examples';
import {validate,type Project,type Result} from './model';
const key='voltpro-plc-project-v1';
function initial():Project{try{const raw=localStorage.getItem(key);if(raw){const p=JSON.parse(raw) as Project;if(!validate(p).length)return p;}}catch{/* Keep the embedded example available. */}return starter();}
interface State {project:Project;past:Project[];future:Project[];running:boolean;inputs:Record<string,boolean>;result:Result|null;error:string;selected:string|null;grid:boolean;left:boolean;right:boolean;setProject:(p:Project,history?:boolean)=>void;undo:()=>void;redo:()=>void;toggleInput:(id:string)=>void;save:()=>void}
export const usePLC=create<State>((set,get)=>({project:initial(),past:[],future:[],running:false,inputs:{},result:null,error:'',selected:null,grid:true,left:true,right:true,
setProject:(project,history=true)=>{const errors=validate(project);if(errors.length){set({error:errors.join(' ')});return;}set(s=>({project,past:history?[...s.past.slice(-49),structuredClone(s.project)]:s.past,future:history?[]:s.future,result:null,error:'',running:false}));},
undo:()=>{const s=get(),p=s.past.at(-1);if(p)set({project:p,past:s.past.slice(0,-1),future:[s.project,...s.future],result:null,running:false});},
redo:()=>{const s=get(),p=s.future[0];if(p)set({project:p,past:[...s.past,s.project],future:s.future.slice(1),result:null,running:false});},
toggleInput:id=>set(s=>{const tag=s.project.nodes.find(n=>n.id===id)?.data.tag;const inputs={...s.inputs};for(const n of s.project.nodes)if(n.id===id||n.data.tag===tag)inputs[n.id]=!s.inputs[id];return {inputs};}),
save:()=>{try{localStorage.setItem(key,JSON.stringify(get().project));set({error:'Saved on this device.'});}catch{set({error:'Device storage is full. Export a project file to keep your work.'});}}
}));
