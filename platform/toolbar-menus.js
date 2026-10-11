(()=>{"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const menus={
 demos:{title:"Demo circuits",items:[
  ["Protected DC Lamp · Starter","demo","Protected DC Lamp · Starter"],
  ["LED Indicator · Starter","demo","LED Indicator · Starter"],
  ["Series Resistor Study · Starter","demo","Series Resistor Study · Starter"],
  ["RC Learning Circuit · Starter","demo","RC Learning Circuit · Starter"],
  ["AC Measurement · Starter","demo","AC Measurement · Starter"],
  ["Browse all demo circuits…","demo-library"]
 ]},
 motor:{title:"Motor starter",items:[
  ["Contactor Motor Concept · Starter","demo","Contactor Motor Concept · Starter"],
  ["Motor Load Study · Standard Range","demo","Motor Load Study · Standard Range"],
  ["Fuse Protected Motor · Starter","demo","Fuse Protected Motor · Starter"],
  ["Open PLC ladder editor","plc"],
  ["Run motor-starter challenge","challenge","motor-starter"]
 ]},
 logic:{title:"Logic lab",items:[
  ["Open PLC ladder editor","plc"],
  ["Switch a lamp challenge","challenge","light-basic"],
  ["3-phase motor starter challenge","challenge","motor-starter"],
  ["MCU Blink challenge","challenge","arduino-blink"],
  ["Open PLC Logic mode","mode","plc"]
 ]},
 projects:{title:"Project library",items:[
  ["Open saved project library","project-library"],
  ["Save current project","click-id","saveBtn"],
  ["Load project file","click-id","loadBtn"],
  ["Export project file","click-id","exportBtn"]
 ]},
 faults:{title:"Fault lab",items:[
  ["Open conductor / open circuit","fault","open"],
  ["Short circuit","fault","short"],
  ["Overload","fault","overload"],
  ["Reverse polarity","fault","reverse"],
  ["Ground fault","fault","ground"],
  ["Phase loss","fault","phaseLoss"]
 ]},
 challenges:{title:"Challenges",items:[
  ["Switch a lamp · Beginner","challenge","light-basic"],
  ["3-phase motor starter · Professional","challenge","motor-starter"],
  ["MCU Blink · Intermediate","challenge","arduino-blink"]
 ]},
 tutorials:{title:"Tutorials",items:[
  ["Your first circuit","tutorial","first-circuit"],
  ["Five safety rules","tutorial","five-safety-rules"]
 ]},
 mcu:{title:"Microcontroller lab",items:[
  ["Open MCU Lab · Blink LED","mcu","blink"],
  ["Button input example","mcu","button"],
  ["PWM LED dimmer example","mcu","pwm"],
  ["Open BB400 breadboard workspace","navigate","breadboard.html"]
 ]},
 tools:{title:"Engineering tools",items:[
  ["Engineering Toolkit","tool","engineering"],
  ["Engineering Documentation","tool","docs"],
  ["Bill of Materials","tool","bom"],
  ["Panel Designer","tool","panel"],
  ["Component Information","tool","info"],
  ["Accessibility settings","tool","a11y"],
  ["Demo Project Library","demo-library"]
 ]}
};
let activeTrigger=null,popover=null;
function close(){if(popover){popover.remove();popover=null}if(activeTrigger){activeTrigger.setAttribute("aria-expanded","false");activeTrigger=null}}
function position(){
 if(!popover||!activeTrigger)return;
 const r=activeTrigger.getBoundingClientRect(),w=popover.offsetWidth,h=popover.offsetHeight;
 const left=Math.max(8,Math.min(window.innerWidth-w-8,r.left));
 let top=r.bottom+6;if(top+h>window.innerHeight-8)top=Math.max(8,r.top-h-6);
 popover.style.left=left+"px";popover.style.top=top+"px";
}
function dispatch(kind,value){
 const actions=window.VoltProPlatformActions||{};
 if(kind==="demo"){const d=window.VoltProDemoLibrary?.demos?.().find(x=>x.title===value);if(!d){window.VoltProDemoLibrary?.open?.();return}window.VoltProDemoLibrary.load(d);return}
 if(kind==="demo-library"){window.VoltProDemoLibrary?.open?.();return}
 if(kind==="project-library"){window.VoltProProjectWorkspace?.open?.();return}
 if(kind==="click-id"){document.getElementById(value)?.click();return}
 if(kind==="plc"){window.VoltProWorkbench?.plc?.();return}
 if(kind==="mode"){document.querySelector('.mode[data-mode="'+value+'"]')?.click();return}
 if(kind==="fault"){actions.fault?.(value);return}
 if(kind==="challenge"){actions.challenge?.(value);return}
 if(kind==="tutorial"){actions.tutorial?.(value);return}
 if(kind==="mcu"){actions.mcu?.(value);return}
 if(kind==="tool"){if(typeof actions[value]==="function")actions[value]();return}
 if(kind==="navigate"){window.location.href=value;return}
}
function open(trigger){
 const key=trigger.dataset.vpMenu,definition=menus[key];if(!definition)return;
 if(activeTrigger===trigger){close();return}close();
 activeTrigger=trigger;trigger.setAttribute("aria-expanded","true");
 popover=document.createElement("div");popover.className="vp-toolbar-popover";popover.id="vp-menu-"+key;popover.setAttribute("role","menu");popover.setAttribute("aria-label",definition.title);
 popover.innerHTML='<div class="vp-toolbar-popover-title">'+esc(definition.title)+'</div>'+definition.items.map((item,i)=>'<button type="button" role="menuitem" data-index="'+i+'" data-kind="'+esc(item[1])+'" data-value="'+esc(item[2]||"")+'">'+esc(item[0])+'</button>').join("");
 document.body.appendChild(popover);trigger.setAttribute("aria-controls",popover.id);position();
 popover.addEventListener("click",event=>{const button=event.target.closest("button[role=menuitem]");if(!button)return;const kind=button.dataset.kind,value=button.dataset.value;close();try{dispatch(kind,value)}catch(error){console.error("VoltPRo toolbar action failed:",error);const status=$("#simStatus");if(status){status.dataset.state="error";status.querySelector(".status-label").textContent="TOOL ERROR"}window.alert("That tool could not be opened. Check the simulator console and try again.")}});
 popover.addEventListener("keydown",event=>{const items=[...popover.querySelectorAll("button[role=menuitem]")],i=items.indexOf(document.activeElement);if(event.key==="Escape"){event.preventDefault();close();trigger.focus()}else if(event.key==="ArrowDown"||event.key==="ArrowUp"){event.preventDefault();items[(i+(event.key==="ArrowDown"?1:-1)+items.length)%items.length]?.focus()}else if(event.key==="Home"){event.preventDefault();items[0]?.focus()}else if(event.key==="End"){event.preventDefault();items.at(-1)?.focus()}});
 popover.querySelector("button")?.focus();
}
document.querySelectorAll("[data-vp-menu]").forEach(trigger=>trigger.addEventListener("click",()=>open(trigger)));
document.addEventListener("click",event=>{if(!popover)return;if(popover.contains(event.target)||event.target.closest("[data-vp-menu]"))return;close()});
document.addEventListener("keydown",event=>{if(event.key==="Escape"&&popover){const trigger=activeTrigger;close();trigger?.focus()}});
const bar=$(".toolbar");bar?.addEventListener("scroll",close,{passive:true});window.addEventListener("resize",position);window.addEventListener("scroll",position,true);
window.VoltProToolbarMenus={close,open,definitions:menus};
})();