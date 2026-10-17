const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../simulator.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../simulator.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../simulator.css"), "utf8");
const worker = fs.readFileSync(path.join(__dirname, "../service-worker.js"), "utf8");

test("physical devices render as large canvas faces rather than photos over schematic blocks", () => {
  assert.match(source, /const physicalCanvasKinds=new Set/);
  assert.match(source, /function canvasDevice\(c,d\)/);
  assert.match(source, /function physicalTerminalPoint\(c,i,n\)/);
  assert.match(source, /canvasDevice\(c,d\)/);
  assert.doesNotMatch(source, /symbol\(c\)\+canvasPhoto\(c,d\)/);
  assert.match(source, /physical-device-photo/);
  assert.match(source, /physical-device-fallback/);
});

test("multi-pole breaker and contactor terminals map to physical terminal rows", () => {
  assert.ok(source.includes("spacing=poles===4?22:24"));
  assert.ok(source.includes("y:-58"));
  assert.ok(source.includes("y:58"));
  assert.ok(source.includes('const aux=label.match(/^([1-4])([34])$/)'));
});

test("physical canvas terminals and labels remain visually prominent and cache-busted", () => {
  assert.match(css, /\.component \.terminal-label\{font-size:11px;font-weight:800/);
  assert.match(css, /\.component \.pin\{r:6;stroke-width:2\}/);
  assert.match(html, /simulator\.css\?v=20261013a/);
  assert.match(html, /simulator\.js\?v=20261017f/);
  assert.match(worker, /voltpro-v83/);
});

test("Arduino terminal labels stay readable at close header spacing",()=>{
  assert.ok(source.includes("arduino-terminal-label"));
  assert.ok(source.includes('rotate(-90 '));
  assert.ok(source.includes('rotate(90 '));
  assert.ok(css.includes(".component .arduino-terminal-label{font-size:7px"));
});
