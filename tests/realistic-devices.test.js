const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.join(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
test("realistic device visual script is valid JavaScript",()=>{try{new vm.Script(read("src/ui/realistic-devices.js"),{filename:"src/ui/realistic-devices.js"})}catch(e){throw new Error(e.stack)}});
test("curated product photos have an illustration fallback",()=>{const s=read("src/ui/realistic-devices.js");assert.ok(s.includes("photoCatalog[kind(type,name)]?.url"));assert.ok(s.includes("function svg(type,name,ref)"));assert.ok(s.includes("onerror="));assert.ok(s.includes("illustrated device view"))});
test("physical panel view uses the existing simulator component IDs and panel validator",()=>{const s=read("src/ui/realistic-devices.js");assert.ok(s.includes("componentId:c.id"));assert.ok(s.includes("window.VoltProPanel?.validate?.(p)"));assert.ok(s.includes("PHYSICAL PANEL DESIGNER"));assert.ok(s.includes("DIN rail"));assert.ok(s.includes("NOT FOR CONSTRUCTION"))});
test("simulator exposes only the state hooks needed by the panel view",()=>{const s=read("simulator.js");assert.ok(s.includes("window.VoltProSimulator={state:S,addComponent:"));const html=read("simulator.html");assert.ok(html.indexOf('src="src/ui/realistic-devices.js?v=20261011b" defer')<html.indexOf('src="simulator.js?v=20261011e" defer'))});
test("offline asset list includes the new visual module and stylesheet",()=>{const s=read("service-worker.js");assert.ok(s.includes('"./src/ui/realistic-devices.js"'));assert.ok(s.includes('"./src/ui/realistic-devices.css"'))});

test("curated real component photographs include attribution and a local fallback",()=>{const s=read("src/ui/realistic-devices.js");for(const k of ["mcb:","rcd:","rcbo:","resistor:","knx:","plc:","db:","contactor:"])assert.ok(s.includes(k),"missing photo mapping "+k);assert.ok(s.includes("photoCredit(type,name)"));assert.ok(s.includes("device-image-credits.html"));const credits=read("device-image-credits.html");assert.ok(credits.includes("CC BY-SA 4.0"));assert.ok(credits.includes("Source file & attribution"))});

test("canvas renderer overlays curated product photos while retaining the symbol fallback",()=>{const s=read("simulator.js");assert.ok(s.includes("function canvasPhoto(c,d)"));assert.ok(s.includes("visuals?.photoCatalog?.[key]?.url"));assert.ok(s.includes("<image href="));assert.ok(s.includes("symbol(c)+canvasPhoto(c,d)"));assert.ok(s.includes("onerror="));const html=read("simulator.html");assert.ok(html.indexOf('src="src/ui/realistic-devices.js?v=20261011b" defer')<html.indexOf('src="simulator.js?v=20261011e" defer'),"photo catalog must load before the initial canvas render")});
