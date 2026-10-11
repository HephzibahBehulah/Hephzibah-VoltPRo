const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
test("MCU Lab UI parses and exposes run, step, stop and reset controls",()=>{
 const ui=read("platform/mcu-lab-ui.js");
 assert.doesNotThrow(()=>new Function(ui));
 for(const id of ["vpwRunMcu","vpwStepMcu","vpwStopMcu","vpwResetMcu","vpwMcuStatus","vpwMcuPins","vpwMcuOut"])assert.ok(ui.includes(id));
 assert.ok(ui.includes("setInterval("));assert.ok(ui.includes("clearInterval("));assert.ok(ui.includes("dtMs:dt"));assert.ok(ui.includes("state:state||undefined"));
});
test("MCU Lab supports editable input toggles and labels interpreter limitations",()=>{
 const ui=read("platform/mcu-lab-ui.js");
 assert.ok(ui.includes("data-mcu-input"));assert.ok(ui.includes("Toggle"));assert.ok(ui.includes("PWM"));
 assert.ok(ui.includes("not a native compiler"));assert.ok(ui.includes("does not upload firmware"));
});
test("simulator and breadboard load MCU Lab UI after Workbench and precache it",()=>{
 for(const page of ["simulator.html","breadboard.html"]){const html=read(page);assert.ok(html.indexOf("platform/mcu-lab-ui.js?v=20261012b")>html.indexOf("platform/workbench.js?v=20261012b"))}
 assert.ok(read("service-worker.js").includes('"./platform/mcu-lab-ui.js"'));
});
