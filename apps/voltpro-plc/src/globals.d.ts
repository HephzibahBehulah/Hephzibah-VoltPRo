import type {Project} from './model';
declare global {interface Window {
 VoltProSystemWorkspace?:{recordEvidence:(value:Record<string,unknown>)=>number;register:(adapter:{view:string;read:()=>Project;load:(p:Project)=>void;select:(id:string)=>void})=>void};
 VoltProAccount?:{configured:boolean;user:()=>Promise<{id:string}|null>};
 VoltProCloudProjects?:{save:(value:{id?:string;version?:number;name:string;kind:'plc';data:Project})=>Promise<{id:string;version:number;name:string;kind:'plc'}>};
}}
