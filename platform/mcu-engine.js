(function(root){
"use strict";
const PIN_RE=/pinMode\s*\(\s*(\d+)\s*,\s*(OUTPUT|INPUT|INPUT_PULLUP)\s*\)/g;
const WRITE_RE=/(digitalWrite|analogWrite)\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|\d+)\s*\)/g;
const IF_RE=/if\s*\(\s*digitalRead\s*\(\s*(\d+)\s*\)\s*(?:==\s*(HIGH|LOW|1|0))?\s*\)\s*\{([^{}]*)\}(?:\s*else\s*\{([^{}]*)\})?/g;
const INSTRUCTION_RE=/(digitalWrite|analogWrite)\s*\(\s*(\d+)\s*,\s*(HIGH|LOW|\d+)\s*\)\s*;|delay\s*\(\s*(\d+)\s*\)\s*;/g;
function functionBody(source,name){const re=new RegExp("\\b"+name+"\\s*\\(\\s*\\)\\s*\\{"),m=re.exec(source);if(!m)return null;const open=source.indexOf("{",m.index);let depth=1;for(let i=open+1;i<source.length;i++){if(source[i]==="{")depth++;else if(source[i]==="}"&&--depth===0)return source.slice(open+1,i)}return null}
function applyWrite(pins,method,pin,raw){pins[pin]??={mode:"OUTPUT",state:0,voltage:0};const voltage=method==="analogWrite"?5*Math.max(0,Math.min(255,Number(raw)||0))/255:raw==="HIGH"?5:raw==="LOW"?0:Number(raw)?5:0;pins[pin].voltage=voltage;pins[pin].state=voltage>0?1:0;if(method==="analogWrite")pins[pin].pwmDuty=Math.max(0,Math.min(255,Number(raw)||0));else delete pins[pin].pwmDuty}
function runWrites(code,pins){let m;const re=new RegExp(WRITE_RE.source,"g");while((m=re.exec(code||"")))applyWrite(pins,m[1],m[2],m[3])}
function runConditionals(code,pins,inputs){let m;IF_RE.lastIndex=0;while((m=IF_RE.exec(code||""))){const input=Boolean(inputs?.[m[1]]??inputs?.["D"+m[1]]??false),expected=m[2]===undefined||m[2]==="HIGH"||m[2]==="1",chosen=input===expected?m[3]:(m[4]||"");runWrites(chosen,pins)}}
function parseInstructions(code){const list=[];let m;INSTRUCTION_RE.lastIndex=0;while((m=INSTRUCTION_RE.exec(code||""))){if(m[1])list.push({type:"write",method:m[1],pin:m[2],value:m[3]});else list.push({type:"delay",ms:Math.max(0,Number(m[4])||0)})}return list}
function simulate(code,opts={}){
 const source=String(code||""),inputs=opts.inputs||{},prior=opts.state?.signature===source?(opts.state||{}):{},pins={},serial=[];let m;
 PIN_RE.lastIndex=0;while((m=PIN_RE.exec(source))){const old=prior.pins?.[m[1]];pins[m[1]]=old?.mode===m[2]?{...old}:{mode:m[2],state:0,voltage:0}}
 const setup=functionBody(source,"setup"),loop=functionBody(source,"loop"),hasTimedLoop=loop!==null&&!/if\\s*\\(\\s*digitalRead/.test(loop),instructions=hasTimedLoop?parseInstructions(loop):[];
 let pc=Number(prior.pc)||0,delayRemainingMs=Math.max(0,Number(prior.delayRemainingMs)||0),initialized=Boolean(prior.initialized);
 if(!initialized){if(setup!==null){runWrites(setup,pins);runConditionals(setup,pins,inputs)}initialized=true}
 if(loop===null){runWrites(source,pins);runConditionals(source,pins,inputs)}
 else if(!hasTimedLoop){runWrites(source,pins);runConditionals(source,pins,inputs)}
 else if(instructions.length){
  let dtLeft=Math.max(0,Number(opts.dtMs)||0),steps=0;
  while(steps++<500){
   if(delayRemainingMs>0){if(dtLeft<=0)break;const used=Math.min(dtLeft,delayRemainingMs);delayRemainingMs-=used;dtLeft-=used;if(delayRemainingMs>0)break;continue}
   if(pc>=instructions.length)pc=0;
   const instruction=instructions[pc++];
   if(instruction.type==="delay"){delayRemainingMs=instruction.ms;if(delayRemainingMs>0&&dtLeft<=0)break}
   else applyWrite(pins,instruction.method,instruction.pin,instruction.value);
  }
 }
 const prints=source.match(/Serial\.println?\s*\(([^)]*)\)/g)||[];prints.forEach(x=>serial.push(x.replace(/^.*?\((.*)\).*$/,"$1")));
 const state={signature:source,initialized,pc,delayRemainingMs,pins:Object.fromEntries(Object.entries(pins).map(([k,v])=>[k,{...v}]))};
 return {target:opts.target||"Arduino UNO",pins,serial,mode:"safe-subset-interpreter",executable:false,state,note:"Supports pinMode, digitalWrite, analogWrite, simple digitalRead if/else branches, and timed sequential digitalWrite/analogWrite/delay loops. It is not a native compiler; nested/general C++ control flow, interrupts, analogRead, peripherals and full AVR behavior remain unsupported."};
}
const api={simulate};root.VoltProMCU=api;
if(typeof module!=="undefined"&&module.exports)module.exports=api;
})(typeof window!=="undefined"?window:globalThis);
