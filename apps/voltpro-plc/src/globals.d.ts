import type {Project} from './model';
declare global {interface Window {
 VoltProAccount?:{configured:boolean;user:()=>Promise<{id:string}|null>};
 VoltProCloudProjects?:{save:(value:{id?:string;version?:number;name:string;kind:'plc';data:Project})=>Promise<{id:string;version:number;name:string;kind:'plc'}>};
}}
