(function(root){
"use strict";
const PIN_RE=/pinMode\s*\(\s*(\d+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/g;
const WRITE_RE=/(digitalWrite|analogWrite)\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|\d+)\s*\)/g;
const IF_RE=/if\s*\(\s*digitalRead\s*\(\s*(\d+)\s*\)\s*(?:==\s*(HIGH|LOW|1|0))?\s*\)\s*\{([^{}]*)\}(?:\s*else\s*\{([^{}]*)\})?/g;
function applyWrite(pins,method,pin,raw){
 pins[pin]??={mode:"OUTPUT",state:0,voltage:0};
 const voltage=method==="analogWrite"?5*Math.max(0,Math.min(255,Number(raw)||0))/255:raw==="HIGH"?5:raw==="LOW"?0:Number(raw)?5:0;
 pins[pin].voltage=voltage;pins[pin].state=voltage>0?1:0;
 if(method==="analogWrite")pins[pin].pwmDuty=Math.max(0,Math.min(255,Number(raw)||0));
 else delete pins[pin].pwmDuty;
}
function runWrites(code,pins){let m;const re=new RegExp(WRITE_RE.source,"g");while((m=re.exec(code||"")))applyWrite(pins,m[1],m[2],m[3])}
function simulate(code,opts={}){
 const source=String(code||""),pins={},serial=[];let m;
 PIN_RE.lastIndex=0;while((m=PIN_RE.exec(source)))pins[m[1]]={mode:m[2],state:0,voltage:0};
 runWrites(source,pins);
 IF_RE.lastIndex=0;
 while((m=IF_RE.exec(source))){
  const input=Boolean(opts.inputs?.[m[1]]??opts.inputs?.["D"+m[1]]??false),expected=m[2]===undefined||m[2]==="HIGH"||m[2]==="1",chosen=input===expected?m[3]:(m[4]||"");
  runWrites(chosen,pins);
 }
 const prints=source.match(/Serial\.println?\s*\(([^)]*)\)/g)||[];
 prints.forEach(x=>serial.push(x.replace(/^.*?\((.*)\).*$/,"$1")));
 return {target:opts.target||"Arduino UNO",pins,serial,mode:"safe-static-simulation",executable:false,note:"Supported pinMode, digitalWrite, analogWrite and simple digitalRead if/else statements are interpreted deterministically; native compilation, timed loop execution, interrupts and full AVR behavior are not implemented."};
}
const api={simulate};root.VoltProMCU=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
