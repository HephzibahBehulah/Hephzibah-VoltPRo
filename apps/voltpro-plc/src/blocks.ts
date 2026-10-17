import type {Kind} from './model';
export interface BlockState {elapsed:number;previous:boolean;output:boolean;count?:number}
export const sequentialKinds:Kind[]=['TON','TOF','TONR','CTU','CTD','R_TRIG','F_TRIG','RS','SR'];
export function block(kind:Kind,input:boolean,reset:boolean,preset:number,old:BlockState|undefined,dt:number):BlockState{
 const t={elapsed:0,previous:false,output:false,count:kind==='CTD'?Math.floor(preset):0,...old},rising=input&&!t.previous;
 if(kind==='TON'){t.elapsed=input?Math.min(preset,t.elapsed+dt):0;t.output=input&&t.elapsed>=preset;}
 if(kind==='TOF'){t.elapsed=input?0:Math.min(preset,t.elapsed+dt);t.output=input||(t.output&&t.elapsed<preset);}
 if(kind==='TONR'){t.elapsed=reset?0:input?Math.min(preset,t.elapsed+dt):t.elapsed;t.output=t.elapsed>=preset;}
 if(kind==='CTU'){t.count=reset?0:Math.min(1000000000,t.count+(rising?1:0));t.output=t.count>=preset;}
 if(kind==='CTD'){t.count=reset?Math.floor(preset):Math.max(0,t.count-(rising?1:0));t.output=t.count===0;}
 if(kind==='R_TRIG')t.output=rising;
 if(kind==='F_TRIG')t.output=!input&&t.previous;
 if(kind==='RS')t.output=reset?false:input?true:t.output;
 if(kind==='SR')t.output=input?true:reset?false:t.output;
 t.previous=input;return t;
}
