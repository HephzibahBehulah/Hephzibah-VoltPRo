const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadAdapters() {
  const window = { defs: { resistor: { pins: 2 }, battery: { pins: 2 } } };
  const context = { window, structuredClone, Map, Set, String, Number, Array, Boolean, Object, JSON, Date, Error };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("platform/v5-runtime.js", "utf8"), context);
  vm.runInContext(fs.readFileSync("platform/project-format.js", "utf8"), context);
  return window;
}

test("canonical v5 serialization preserves topology, viewport, and wire styling", () => {
  const window = loadAdapters();
  const legacy = {
    mode: "schematic",
    grid: 20,
    components: [
      { id: "V1", type: "battery", x: 20, y: 40, rotation: 0, props: { voltage: 12 } },
      { id: "R1", type: "resistor", x: 120, y: 40, rotation: 90, props: { resistance: 1000 } }
    ],
    wires: [
      { id: "W1", a: "V1:0", b: "R1:0", color: "#65d8ff", cableType: "control", size: "1.5", gauge: "16", width: 3, pattern: "solid", bends: [{ x: 60, y: 20 }] }
    ]
  };
  const canonical = window.VoltProV5Runtime.adapt(legacy);
  canonical.metadata = { name: "Styled test circuit", created: "2026-10-11T00:00:00.000Z" };
  canonical.viewport = { zoom: 1.4, pan: { x: 12, y: -8 } };
  canonical.wireStyle = { color: "#65d8ff", cableType: "standard", size: "2.5", gauge: "14", width: 2.5 };
  const encoded = window.VoltProProject.encode(canonical);
  const decoded = window.VoltProProject.decode(encoded);
  assert.equal(decoded.version, 5);
  assert.equal(decoded.devices.length, 2);
  assert.equal(decoded.wires.length, 1);
  assert.equal(decoded.wires[0].from, "V1:0");
  assert.equal(decoded.wires[0].to, "R1:0");
  assert.equal(decoded.wires[0].color, "#65d8ff");
  assert.equal(decoded.wires[0].cableType, "control");
  assert.equal(decoded.wires[0].width, 3);
  assert.deepEqual(JSON.parse(JSON.stringify(decoded.wires[0].bends)), [{ x: 60, y: 20 }]);
  assert.deepEqual(JSON.parse(JSON.stringify(decoded.viewport)), { zoom: 1.4, pan: { x: 12, y: -8 } });
  assert.equal(decoded.wireStyle.size, "2.5");
});

test("canonical v5 project converts back to the legacy canvas endpoint convention", () => {
  const window = loadAdapters();
  const canonical = window.VoltProProject.normalize({
    version: 5,
    devices: [
      { id: "V1", type: "battery", terminals: [{ id: "+" }, { id: "-" }], position: { x: 0, y: 0 } },
      { id: "R1", type: "resistor", terminals: [{ id: "1" }, { id: "2" }], position: { x: 100, y: 0 } }
    ],
    wires: [{ id: "W1", from: "V1:+", to: "R1:1", color: "#123456", width: 4 }],
    viewport: { zoom: 1.2, pan: { x: 5, y: 6 } },
    wireStyle: { cableType: "flexible" }
  });
  const legacy = window.VoltProProject.toLegacy(canonical);
  assert.deepEqual(Array.from(legacy.wires, wire => [wire.a, wire.b]), [["V1:0", "R1:0"]]);
  assert.equal(legacy.wires[0].color, "#123456");
  assert.equal(legacy.wires[0].width, 4);
  assert.equal(legacy.wireStyle.cableType, "flexible");
  assert.deepEqual(JSON.parse(JSON.stringify(legacy.viewport)), { zoom: 1.2, pan: { x: 5, y: 6 } });
});
