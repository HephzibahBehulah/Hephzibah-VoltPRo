"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

test("simulator learning tools are in-page dropdowns rather than outbound Workbench links", () => {
  const html = read("simulator.html");
  for (const menu of ["demos","motor","logic","projects","faults","challenges","tutorials","mcu","tools"]) assert.ok(html.includes('data-vp-menu="' + menu + '"'));
  assert.ok(!html.includes('href="academy-workbench.html'));
  assert.ok(html.includes('id="pngBtn"'));
  assert.ok(html.includes('>SVG</button>'));
  assert.ok(html.includes('id="paletteBtn"'));
  assert.ok(html.includes('id="inspectorBtn"'));
  assert.ok(html.includes('data-ui-build="2026.10.12-tool-action-repair"'));
});

test("SVG export serializes the current schematic and reports success or failure", () => {
  const js = read("simulator.js");
  assert.match(js, /function exportSVG\(\)/);
  assert.match(js, /XMLSerializer\(\)/);
  assert.match(js, /download\("voltpro-schematic\.svg"/);
  assert.match(js, /SVG schematic exported/);
  assert.match(js, /SVG export failed/);
});

test("keyboard arrow movement remains available and avoids editable fields", () => {
  const js = read("simulator.js");
  assert.match(js, /\["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"\]/);
  assert.match(js, /target\.isContentEditable/);
  assert.match(js, /saveHistory\(\)/);
  assert.match(js, /e\.shiftKey\?5:1/);
});

test("sidebar controls expose state and CSS gives the canvas released space", () => {
  const html = read("simulator.html");
  const js = read("simulator.js");
  const css = read("simulator-layout-restore.css");
  assert.match(html, /id="paletteBtn"[^>]*aria-controls="palette"[^>]*aria-expanded="true"/);
  assert.match(html, /id="inspectorBtn"[^>]*aria-controls="inspectorPanel"/);
  assert.match(js, /workspace\?\.classList\.toggle\("palette-hidden"/);
  assert.match(js, /workspace\.classList\.toggle\("inspector-hidden"\)/);
  assert.match(css, /\.workspace\.palette-hidden\.inspector-hidden/);
  assert.match(css, /#palette,\s*\.simulator-page \.workspace\.inspector-hidden #inspectorPanel/);
});

test("Workbench provides Logic Lab and motor deep links focus the intended tools", () => {
  const html = read("academy-workbench.html");
  const js = read("academy-workbench.js");
  assert.match(html, /id="logic-lab"/);
  assert.match(html, /simulator\.html\?mode=logic/);
  assert.match(js, /get\("focus"\)/);
  assert.match(js, /focus==="motor"/);
  assert.match(js, /demoSearch/);
});

test("changed JavaScript files parse without syntax errors", () => {
  assert.doesNotThrow(() => new Function(read("simulator.js")));
  assert.doesNotThrow(() => new Function(read("academy-workbench.js")));
});

test("component and inspector controls bind before initial rendering can fail",()=>{
 const js=read("simulator.js");
 assert.ok(js.indexOf("bindExtraControls();renderPalette();render();")>0);
 assert.ok(js.indexOf("bindExtraControls();renderPalette();render();")<js.indexOf("log(\"Base simulation components"));
 assert.match(js,/const pb=document\.querySelector\("#paletteBtn"\)/);
 assert.match(js,/const ib=document\.querySelector\("#inspectorBtn"\)/);
});
