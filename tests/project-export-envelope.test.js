const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

function loadProjectFormat() {
  const window = { defs: {} };
  vm.runInNewContext(fs.readFileSync("platform/project-format.js", "utf8"), {
    window, structuredClone, Map, Set, Array, String, Number, Object, JSON, Date, Error
  });
  return window.VoltProProject;
}

function projectV5() {
  return {
    format: "voltpro",
    version: 5,
    metadata: { name: "Relay test circuit", author: "VoltPRo" },
    workspace: "schematic",
    devices: [
      { id: "V1", type: "battery", position: { x: 20, y: 40 }, terminals: [{ id: "+", label: "+" }, { id: "-", label: "-" }], parameters: { voltage: 12 } },
      { id: "R1", type: "resistor", position: { x: 120, y: 40 }, terminals: [{ id: "1", label: "1" }, { id: "2", label: "2" }], parameters: { resistance: 1000 } }
    ],
    wires: [
      { id: "W1", from: "V1:+", to: "R1:1" },
      { id: "W2", from: "R1:2", to: "V1:-" }
    ]
  };
}

test("decode accepts the exported envelope and preserves project contents", () => {
  const format = loadProjectFormat();
  const source = projectV5();
  const decoded = format.decode(JSON.stringify({ format: "voltpro-export", version: 1, project: source, exportedAt: "2026-10-11T00:00:00.000Z" }));
  assert.equal(decoded.version, 5);
  assert.equal(decoded.metadata.name, "Relay test circuit");
  assert.equal(decoded.devices.length, 2);
  assert.equal(decoded.wires.length, 2);
  assert.equal(decoded.wires[0].from, "V1:+");
  assert.equal(decoded.devices[1].parameters.resistance, 1000);
});

test("migrate reads the wrapped project's version, not the envelope version", () => {
  const format = loadProjectFormat();
  const migrated = format.migrate({ format: "voltpro-export", version: 1, project: projectV5() });
  assert.equal(migrated.version, 5);
  assert.equal(migrated.metadata.migratedFrom, undefined);
});

test("legacy project wrapped for export still migrates with its real version", () => {
  const format = loadProjectFormat();
  const legacy = { format: "voltpro", version: 2, components: [{ id: "R1", type: "resistor", x: 10, y: 20, props: { resistance: 220 } }], wires: [] };
  const migrated = format.migrate({ format: "voltpro-export", version: 1, project: legacy });
  assert.equal(migrated.version, 5);
  assert.equal(migrated.metadata.migratedFrom, 2);
  assert.equal(migrated.devices[0].parameters.resistance, 220);
});

test("rejects an export envelope with no project payload", () => {
  const format = loadProjectFormat();
  assert.throws(() => format.decode({ format: "voltpro-export", version: 1 }), /project payload is missing/);
});

test("toLegacy round-trips named terminal endpoints through the compatibility layer", () => {
  const format = loadProjectFormat();
  const legacy = format.toLegacy({ format: "voltpro-export", version: 1, project: projectV5() });
  assert.equal(legacy.components.length, 2);
  assert.deepEqual(Array.from(legacy.wires, wire => [wire.a, wire.b]), [["V1:0", "R1:0"], ["R1:1", "V1:1"]]);
});
