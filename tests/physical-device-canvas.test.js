const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const source = fs.readFileSync(path.join(__dirname, "../simulator.js"), "utf8");
const html = fs.readFileSync(path.join(__dirname, "../simulator.html"), "utf8");
const css = fs.readFileSync(path.join(__dirname, "../simulator.css"), "utf8");

test("physical devices render as large canvas faces rather than photos over schematic blocks", () => {
  assert.match(source, /const physicalCanvasKinds=new Set/);
  assert.match(source, /function canvasDevice\(c,d\)/);
  assert.match(source, /canvasDevice\(c,d\)/);
  assert.doesNotMatch(source, /symbol\(c\)\+canvasPhoto\(c,d\)/);
  assert.match(source, /physical-device-photo/);
  assert.match(source, /physical-device-fallback/);
});

test("multi-pole breaker terminals are mapped to top and bottom phase rows", () => {
  assert.ok(source.includes("spacing=poles===4?22:24"));
  assert.match(source, /y:-58/);
  assert.match(source, /y:58/);
  assert.match(source, /if\(c\.type==="contactor"\)\{const p=\[\[-24,75\],\[24,75\],\[-24,-58\],\[-24,58\],\[0,-58\],\[0,58\],\[24,-58\],\[24,58\]/);
});

test("physical canvas terminals and labels remain visually prominent and cache-busted", () => {
  assert.match(css, /\.component \.terminal-label\{font-size:11px;font-weight:800/);
  assert.match(css, /\.component \.pin\{r:6;stroke-width:2\}/);
  assert.match(html, /simulator\.css\?v=20261011c/);
  assert.match(html, /simulator\.js\?v=20261011q/);
});
