const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");

test("simulator drag updates are frame-throttled and do not rebuild component DOM", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  const start = source.indexOf('svg.addEventListener("pointermove"');
  const end = source.indexOf('window.addEventListener("pointerup"', start);
  assert.ok(start >= 0 && end > start, "drag handlers should be present");
  const handler = source.slice(start, end);
  assert.ok(handler.includes("requestAnimationFrame"));
  assert.ok(handler.includes("renderWires();"));
  assert.ok(!handler.includes("renderCanvas();"), "dragging must not rebuild the full component DOM");
});

test("simulator external scripts are deferred for parallel fetch and non-blocking HTML parsing", () => {
  const html = fs.readFileSync(path.join(root, "simulator.html"), "utf8");
  const tags = html.split('<script src="').slice(1).map(chunk => chunk.slice(0, chunk.indexOf(">")));
  assert.ok(tags.length > 20, "expected simulator dependency scripts");
  assert.ok(tags.every(tag => tag.endsWith(" defer")), "every external simulator script should use defer");
});

test("service worker does not prefetch the entire asset catalog during installation", () => {
  const source = fs.readFileSync(path.join(root, "service-worker.js"), "utf8");
  const start = source.indexOf('self.addEventListener("install"');
  const end = source.indexOf('self.addEventListener("activate"');
  const install = source.slice(start, end);
  assert.ok(install.includes("small application shell"));
  assert.ok(!install.includes("ASSETS.map"), "install must not fetch the full asset catalog");
});

test("component media requests start after page load and run in small batches", () => {
  const source = fs.readFileSync(path.join(root, "platform/component-media.js"), "utf8");
  assert.ok(source.includes("i+=4"), "CSV fetch concurrency should be limited to four");
  assert.ok(source.includes("setTimeout(()=>load()"), "media loading should be delayed until after page load");
});


test("wire preview redraws only the wire layer, not all components", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('onPreview:(start,p)=>{S.wirePointer=p;if(!wirePreviewFrame)wirePreviewFrame=requestAnimationFrame('));
});

test("common electrical components use recognizable schematic symbols and leads", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('if(c.type==="resistor") return line(-55,0,-34,0)+path("M-34 0'));
  assert.ok(source.includes('if(c.type==="lamp") return line(-55,0,-23,0)+circle(23)+path("M-15 -15 L15 15'));
  assert.ok(source.includes('if(c.type==="battery"||c.type==="acsource")'));
});

test("inspector remains visible on medium desktop widths", () => {
  const source = fs.readFileSync(path.join(root, "simulator.css"), "utf8");
  assert.ok(source.includes('.workspace{grid-template-columns:205px minmax(0,1fr) 250px}'));
  assert.ok(source.includes('@media (max-width:900px)'));
});


test("viewport zoom and pan are applied to the rendered layers", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes("function applyViewport()"));
  assert.ok(source.includes('setAttribute("transform",t)'));
  assert.ok(source.includes('const p=svg.createSVGPoint()'));
  assert.ok(source.includes('p.matrixTransform(m.inverse())'));
});

test("terminal clicks use pointer input and avoid rebuilding the full palette on every render", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('p.onpointerdown=e=>{e.stopPropagation();e.preventDefault();dragWire={start:p.dataset.pin,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};handlePin(p.dataset.pin)}'));
  assert.ok(source.includes("paletteRenderKey"));
  assert.ok(source.includes("if(key!==paletteRenderKey)renderPalette()"));
});

test("reference symbols render as labels rather than object coercions and MCU workspace is wired", () => {
  const source = fs.readFileSync(path.join(root, "platform/workbench.js"), "utf8");
  assert.ok(source.includes("const symbolLabel="));
  assert.ok(source.includes('else if(b.dataset.mode==="micro"){if(window.VoltProMCULab?.open)window.VoltProMCULab.open();else micro()}'));
  assert.ok(source.includes("VoltProMCU?.simulate"));
});

test("demo library defines 100 documented demo variants and can load them into the schematic", () => {
  const source = fs.readFileSync(path.join(root, "platform/demo-library.js"), "utf8");
  assert.ok(source.includes("const demos=templates.flatMap"));
  assert.ok(source.includes('["Troubleshooting",.8]'));
  assert.ok(source.includes("window.VoltProDemoLibrary={open,demos:()=>demos.slice(),load:loadDemo}"));
  const html = fs.readFileSync(path.join(root, "simulator.html"), "utf8");
  assert.ok(html.includes('platform/demo-library.js'));
});


test("toolbar SVG export, library collapse, and grid spacing are wired", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('svgExport.onclick=exportSVG'));
  assert.ok(source.includes('workspace?.classList.toggle("palette-hidden"'));
  assert.ok(source.includes('pat.setAttribute("width",S.grid)'));
});

test("PLC input switches execute ladder scans and calculate output state", () => {
  const source = fs.readFileSync(path.join(root, "platform/workbench.js"), "utf8");
  assert.ok(source.includes("window.VoltProLadder?.scan"));
  assert.ok(source.includes("io.q0=Boolean(result.outputs.Q0)"));
  assert.ok(source.includes("io.q1=Boolean(result.outputs.Q1)"));
  assert.ok(source.includes('else if(b.dataset.mode==="plc")plc()'));
});


test("component terminal hit targets render above wire strokes", () => {
  const html = fs.readFileSync(path.join(root, "simulator.html"), "utf8");
  assert.ok(html.includes('<g id="wires"></g><g id="components"></g>'));
});


test("panel designer spans the workbench and keeps its layout inside the responsive modal", () => {
  const source = fs.readFileSync(path.join(root, "platform/workbench.js"), "utf8");
  assert.ok(source.includes('class="vpw-main" style="grid-column:1 / -1;min-width:0"'));
  assert.ok(source.includes(".vpw-rail{position:relative;min-height:320px"));
  assert.ok(source.includes("overflow:auto;padding:22px"));
});

test("wire rendering uses the defined all-elements selector and cannot abort simulator startup", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('$$("[data-wire]").forEach(el=>'), "wire interaction binding must use the defined $$ helper");
  assert.ok(!source.includes('$$$("[data-wire]")'), "an undefined $$$ helper would throw during initial render and disable all simulator workspaces");
});

test("every rendered component, terminal, and wire receives interaction handlers", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('comps.querySelectorAll(".component[data-id]").forEach(g=>{'), "component handlers must be scoped to actual schematic components");
  assert.ok(source.includes('$$(".pin").forEach(p=>p.onpointerdown='), "all terminals must be clickable for wiring and selection");
  assert.ok(source.includes('$$("[data-wire]").forEach(el=>{') && source.includes("el.onclick=e=>"), "all wires must be selectable");
});


test("arrow keys move the selected component on the grid and preserve text-field editing", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.key)'));
  assert.ok(source.includes('const step=S.grid*(e.shiftKey?5:1)'));
  assert.ok(source.includes("if(!e.repeat)saveHistory()"));
  assert.ok(source.includes('/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)'));
});

test("clicking a terminal starts wiring automatically and the next terminal completes it", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes("if(!wiring.active)wiring.begin();wiring.selectTerminal(ref,p)"));
  assert.ok(source.includes('p.onpointerdown=e=>{e.stopPropagation();e.preventDefault();dragWire={start:p.dataset.pin,pointerId:e.pointerId,startX:e.clientX,startY:e.clientY,moved:false};handlePin(p.dataset.pin)}'));
});

test("component selection keeps the canvas element stable during pointer-down", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  const start = source.indexOf('comps.querySelectorAll(".component[data-id]").forEach(g=>{g.onclick=');
  const end = source.indexOf('$$(".pin").forEach', start);
  const handler = source.slice(start, end);
  assert.ok(start >= 0 && end > start);
  assert.ok(handler.includes('$$(".component").forEach'));
  assert.ok(handler.includes("renderInspector()"));
  assert.ok(!handler.includes("renderCanvas();renderInspector()"), "selection should not rebuild canvas DOM during ordinary pointer-down");
});

test("new palette components can be placed by click and selected for editing", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  assert.ok(source.includes('el.onclick=()=>{if(suppressPaletteClick)return;const r=wrap.getBoundingClientRect();addComponent(el.dataset.type,'));
  assert.ok(source.includes('g.onclick=e=>{if(e.target.classList.contains("pin"))return;'));
  assert.ok(source.includes('const c=S.components.find(x=>x.id===S.selected)'));
});

test("wire inspector exposes cable type, colour, cross-section, width and line pattern", () => {
  const source = fs.readFileSync(path.join(root, "simulator.js"), "utf8");
  for (const property of ["cableType", "color", "size", "width", "pattern"]) {
    assert.ok(source.includes('data-wire-prop="' + property + '"'), "missing wire property " + property);
  }
  assert.ok(source.includes("stroke-dasharray"));
  assert.ok(source.includes("wire-bend-handle"));
  assert.ok(source.includes("if(wireBending)"));
});

test("PLC workbench executes the ladder scan engine instead of hard-coded output equations",()=>{const source=fs.readFileSync(path.join(root,"platform/workbench.js"),"utf8");assert.ok(source.includes("window.VoltProLadder?.scan"));assert.ok(source.includes('{address:"Q0",type:"NO"}'));assert.ok(source.includes("Seal-in contact Q0"))});

test("Run mode continuously re-solves and Stop clears the simulation timer",()=>{
 const source=fs.readFileSync(path.join(root,"simulator.js"),"utf8");
 assert.ok(source.includes("function solveSimulationTick(continuous=false)"));
 assert.ok(source.includes("setInterval(()=>{if(S.running)solveSimulationTick(true)"));
 assert.ok(source.includes("clearInterval(simulationInterval)"));
 assert.ok(source.includes("scanTimeMs:250"));
});
