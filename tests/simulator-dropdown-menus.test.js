"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");

test("simulator defines one toolbar and unique local dropdown triggers",()=>{
 const html=read("simulator.html");
 assert.equal((html.match(/class="sim-top"/g)||[]).length,1);
 assert.equal((html.match(/class="toolbar"/g)||[]).length,1);
 const ids=Array.from(html.matchAll(new RegExp('id="([^"]+)"',"g")),m=>m[1]);
 assert.equal(ids.length,new Set(ids).size,"all HTML IDs must be unique");
 for(const name of ["demos","motor","logic","projects","faults","challenges","tutorials","mcu","tools"])assert.ok(html.includes('data-vp-menu="'+name+'"'));
 assert.ok(!html.includes('href="academy-workbench.html'));
 assert.ok(html.includes('data-ui-build="2026.10.12-tool-action-repair"'));
});

test("platform UI no longer appends a duplicate toolbar and exposes tool actions",()=>{
 const ui=read("platform/ui.js");
 assert.doesNotThrow(()=>new Function(ui));
 assert.ok(!ui.includes("bar.appendChild(b)"));
 assert.ok(ui.includes("window.VoltProPlatformActions=actions"));
 assert.ok(ui.includes("const esc=value=>"),"platform action renderers must define their own HTML escaping helper");
 assert.ok(ui.includes("window.__voltproPlatformKeysBound"));
 for(const action of ["fault(initialType","challenge(id","tutorial(id","mcu(sample"])assert.ok(ui.includes(action));
});

test("dropdown runtime parses and supplies accessible, keyboard-operable menus",()=>{
 const js=read("platform/toolbar-menus.js");
 assert.doesNotThrow(()=>new Function(js));
 assert.ok(js.includes('setAttribute("role","menu")'));
 assert.ok(js.includes('role="menuitem"'));
 assert.ok(js.includes('aria-expanded'));
 assert.ok(js.includes('event.key==="ArrowDown"'));
 assert.ok(js.includes('event.key==="Escape"'));
 assert.ok(js.includes("getBoundingClientRect()"));
 assert.ok(js.includes("VoltProDemoLibrary.load(d)"));
 assert.ok(js.includes("VoltProProjectWorkspace?.open?.()"));
});

test("menu contents connect demo, motor, PLC, fault, challenge, tutorial, MCU and engineering tools locally",()=>{
 const js=read("platform/toolbar-menus.js");
 for(const term of ["Protected DC Lamp · Starter","Contactor Motor Concept · Starter","Open PLC ladder editor","Open conductor / open circuit","Switch a lamp · Beginner","Your first circuit","Button input example","Engineering Documentation","Bill of Materials"])assert.ok(js.includes(term),"missing menu option "+term);
 assert.ok(js.includes('actions.fault?.(value)'));
 assert.ok(js.includes('actions.challenge?.(value)'));
 assert.ok(js.includes('actions.tutorial?.(value)'));
 assert.ok(js.includes('actions.mcu?.(value)'));
 assert.ok(js.includes('window.location.href=value'));
});

test("MCU Lab accepts named example sketches and retains explicit interpreter limitations",()=>{
 const ui=read("platform/mcu-lab-ui.js");
 assert.doesNotThrow(()=>new Function(ui));
 assert.ok(ui.includes("function open(options={})"));
 for(const sample of ["blink","button","pwm"])assert.ok(ui.includes(sample));
 assert.ok(ui.includes("if (digitalRead(2) == LOW)"));
 assert.ok(ui.includes("analogWrite(9, 64)"));
 assert.ok(ui.includes("not a native compiler"));
});

test("cache and deployment version invalidates stale simulator shell and precaches menu runtime",()=>{
 const html=read("simulator.html"),worker=read("service-worker.js"),css=read("simulator-layout-restore.css");
 assert.ok(worker.includes('const CACHE="voltpro-v88"'));
 assert.ok(worker.includes('"./platform/toolbar-menus.js"'));
 assert.ok(worker.includes('"./platform/ui.js"'));
 assert.ok(worker.includes('"./platform/workbench.js"'));
 assert.ok(html.includes('service-worker.js?v=20261017a'));
 assert.ok(html.includes('updateViaCache:"none"'));
 assert.ok(html.includes('platform/toolbar-menus.js?v=20261017f'));
 assert.ok(html.includes('platform/ui.js?v=20261012b'));
 assert.ok(html.includes('simulator.js?v=20261017n'));
 assert.ok(css.includes(".vp-toolbar-popover"));
});

test("MCU Lab mounts through the Workbench host without recursive legacy startup",()=>{
 const ui=read("platform/mcu-lab-ui.js"),workbench=read("platform/workbench.js");
 assert.ok(ui.includes('workbench.openWorkspace("MICROCONTROLLER LAB"'));
 assert.ok(workbench.includes('openWorkspace:(title,body)=>open(title,body)'));
 assert.ok(!ui.includes("legacyMicro()"));
});
