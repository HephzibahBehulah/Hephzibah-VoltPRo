import type {Node,Edge} from '@xyflow/react';
export type Kind='supply'|'neutral'|'earth'|'threephase'|'breaker'|'breaker3'|'no'|'nc'|'selector'|'auxNO'|'auxNC'|'overloadNC'|'overloadNO'|'coil'|'lamp'|'motor'|'contactor3'|'overload3'|'TON'|'TOF'|'AND'|'OR'|'NOT';
export type DeviceData={kind:Kind;tag:string;label:string;preset:number;pin:number;active?:boolean;input?:boolean;elapsed?:number;[key:string]:unknown};
export type Device=Node<DeviceData,'device'>;
export type Wire=Edge<{active?:boolean}>;
export interface Project {version:1;name:string;mode:'ladder'|'fbd';nodes:Device[];edges:Wire[]}
export interface Result {active:Record<string,boolean>;tags:Record<string,boolean>;elapsed:Record<string,number>;wires:Record<string,boolean>;warnings:string[];scan:number}
export interface EngineMemory {tags:Record<string,boolean>;timers:Record<string,{elapsed:number;previous:boolean;output:boolean}>;scan:number}
export const emptyMemory=():EngineMemory=>({tags:{},timers:{},scan:0});
export const catalog:{kind:Kind;label:string;category:string;pins:string[];pro?:boolean}[]=[
{kind:'supply',label:'Control supply · L / +24 V',category:'Power',pins:['L']},{kind:'neutral',label:'Neutral / 0 V',category:'Power',pins:['N']},{kind:'earth',label:'Protective earth',category:'Power',pins:['PE']},{kind:'threephase',label:'Three-phase supply',category:'Power',pins:['L1','L2','L3','PE']},
{kind:'breaker',label:'Circuit breaker · 1 pole',category:'Protection',pins:['1','2']},{kind:'breaker3',label:'Circuit breaker · 3 pole',category:'Protection',pins:['1','3','5','2','4','6']},{kind:'overloadNC',label:'Overload · NC 95 / 96',category:'Protection',pins:['95','96']},{kind:'overloadNO',label:'Overload · NO 97 / 98',category:'Protection',pins:['97','98']},{kind:'overload3',label:'Thermal overload · power',category:'Protection',pins:['1','3','5','2','4','6']},
{kind:'no',label:'Start pushbutton · NO',category:'Contacts',pins:['3','4']},{kind:'nc',label:'Stop pushbutton · NC',category:'Contacts',pins:['1','2']},{kind:'selector',label:'Selector switch',category:'Contacts',pins:['3','4']},
{kind:'auxNO',label:'Auxiliary contact · NO',category:'Auxiliaries',pins:['13','14']},{kind:'auxNC',label:'Auxiliary contact · NC',category:'Auxiliaries',pins:['21','22']},{kind:'contactor3',label:'Contactor · 3 pole',category:'Auxiliaries',pins:['1','3','5','2','4','6']},
{kind:'coil',label:'Contactor / relay coil',category:'Coils & loads',pins:['A1','A2']},{kind:'lamp',label:'Indicator lamp',category:'Coils & loads',pins:['X1','X2']},{kind:'motor',label:'Three-phase motor',category:'Coils & loads',pins:['U','V','W','PE']},
{kind:'TON',label:'On-delay timer',category:'Timers',pins:['A1','A2'],pro:true},{kind:'TOF',label:'Off-delay timer',category:'Timers',pins:['A1','A2'],pro:true},
{kind:'AND',label:'AND gate',category:'Function blocks',pins:['IN1','IN2','OUT']},{kind:'OR',label:'OR gate',category:'Function blocks',pins:['IN1','IN2','OUT']},{kind:'NOT',label:'NOT gate',category:'Function blocks',pins:['IN','OUT']}];
export const isInput=(k:Kind)=>['no','nc','selector','breaker','breaker3','overloadNC','overloadNO','overload3'].includes(k);
export function ports(k:Kind){return catalog.find(c=>c.kind===k)!.pins;}
export function portRole(k:Kind,p:string):'source'|'target'{if(['supply','threephase','earth'].includes(k))return 'source';if(['TON','TOF'].includes(k)&&p==='A2')return 'source';if(['neutral','motor'].includes(k))return 'target';if(['AND','OR','NOT'].includes(k))return p==='OUT'?'source':'target';return ['2','4','6','14','22','96','98'].includes(p)?'source':'target';}
export function validate(p:Project):string[]{
 const errors:string[]=[];if(!p||p.version!==1||!['ladder','fbd'].includes(p.mode)||typeof p.name!=='string'||p.name.length>100||!Array.isArray(p.nodes)||!Array.isArray(p.edges)||p.nodes.length>300||p.edges.length>1000)return ['Invalid project or limit exceeded (300 devices / 1,000 wires).'];
 const ids=new Set<string>(),drivers=new Set<string>();const reserved=(v:string)=>Object.prototype.hasOwnProperty.call(Object.prototype,v);
 for(const n of p.nodes){if(!n||typeof n.id!=='string'||!/^[A-Za-z0-9_-]{1,80}$/.test(n.id)||ids.has(n.id)||reserved(n.id)||!catalog.some(c=>c.kind===n.data?.kind)){errors.push('Invalid or duplicate device.');continue;}ids.add(n.id);if(typeof n.data.tag!=='string'||!/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(n.data.tag)||reserved(n.data.tag))errors.push('Tags must start with a letter and contain at most 32 letters, digits or underscores.');if(['coil','TON','TOF'].includes(n.data.kind)){if(drivers.has(n.data.tag))errors.push('Each output tag needs a single coil or timer driver.');drivers.add(n.data.tag);}if(typeof n.data.label!=='string'||n.data.label.length>100)errors.push('Device label must be at most 100 characters.');if(!Number.isFinite(n.data.preset)||n.data.preset<0||n.data.preset>3600000)errors.push('Timer preset must be 0–3,600,000 ms.');if(!n.position||!Number.isFinite(n.position.x)||!Number.isFinite(n.position.y)||Math.abs(n.position.x)>100000||Math.abs(n.position.y)>100000)errors.push('Invalid position.');}
 if(errors.length)return [...new Set(errors)];
 const edgeIds=new Set<string>();for(const e of p.edges){if(!e||typeof e.id!=='string'||edgeIds.has(e.id)){errors.push('Invalid or duplicate wire.');continue;}edgeIds.add(e.id);const a=p.nodes.find(n=>n.id===e.source),b=p.nodes.find(n=>n.id===e.target);if(!a||!b||!ports(a.data.kind).includes(e.sourceHandle||'')||!ports(b.data.kind).includes(e.targetHandle||''))errors.push('A wire refers to a missing terminal.');}
 return [...new Set(errors)];
}
