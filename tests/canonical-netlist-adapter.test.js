const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const P = require("../platform/canonical-project.js");
const Adapter = require("../platform/canonical-netlist-adapter.js");

function sample(resistance = 1000) {
  return {
    format: P.FORMAT,
    formatVersion: P.VERSION,
    metadata: { id: "canonical-reference", name: "12 V / 1 kOhm" },
    workspace: { mode: "schematic", grid: 20 },
    devices: [
      P.createDevice({
        id: "V1",
        type: "battery",
        terminals: [
          { id: "PLUS", label: "+", type: "electrical", domain: "dc" },
          { id: "MINUS", label: "-", type: "electrical", domain: "dc" }
        ],
        parameters: { voltage: 12 }
      }),
      P.createDevice({
        id: "R1",
        type: "resistor",
        terminals: [
          { id: "1", label: "1", type: "electrical", domain: "dc" },
          { id: "2", label: "2", type: "electrical", domain: "dc" }
        ],
        parameters: { resistance }
      })
    ],
    wires: [
      { id: "W1", from: "V1:PLUS", to: "R1:1", domain: "dc", routing: [] },
      { id: "W2", from: "R1:2", to: "V1:MINUS", domain: "dc", routing: [] }
    ],
    nets: { policy: "derived", snapshot: null },
    panel: {},
    plc: { programs: [], ioMappings: [] },
    simulation: { configuration: { mode: "dc" } },
    extensions: {}
  };
}

function loadEngine() {
  const context = { window: {}, console, Date, Map, Set, Array, String, Number, Boolean, Object, JSON, Math, Error };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync("engine/voltpro-engine.js", "utf8"), context);
  return context.window.VoltProEngine;
}

test("canonical adapter collapses external wires into deterministic solver net IDs", () => {
  const project = sample();
  const adapted = Adapter.toSolverProject(project, P);
  assert.deepEqual(adapted.wires, []);
  assert.equal(adapted.topology.source, "canonical-project");
  assert.equal(adapted.components.length, 2);
  assert.equal(adapted.components[0].pins[0], adapted.components[1].pins[0]);
  assert.equal(adapted.components[0].pins[1], adapted.components[1].pins[1]);
  assert.equal(adapted.topology.terminalToNet["V1:PLUS"], adapted.topology.terminalToNet["R1:1"]);
  assert.equal(adapted.topology.terminalToNet["V1:MINUS"], adapted.topology.terminalToNet["R1:2"]);
  assert.deepEqual(adapted.topology.nets, Adapter.toSolverProject(sample(), P).topology.nets);
});

test("MNA solves the canonical 12 V / 1 kOhm reference circuit", () => {
  const solverProject = Adapter.toSolverProject(sample(), P);
  const result = loadEngine().dc(solverProject);
  assert.equal(result.ok, true, result.error);
  assert.ok(Math.abs(result.totalCurrent - 0.012) < 1e-9, "expected 12 mA");
  assert.ok(Math.abs(result.totalPower - 0.144) < 1e-6, "expected 144 mW");
});

test("MNA solves canonical 12 V / 100 ohm reference circuit", () => {
  const solverProject = Adapter.toSolverProject(sample(100), P);
  const result = loadEngine().dc(solverProject);
  assert.equal(result.ok, true, result.error);
  assert.ok(Math.abs(result.totalCurrent - 0.12) < 1e-9, "expected 120 mA");
  assert.ok(Math.abs(result.totalPower - 1.44) < 1e-6, "expected 1.44 W");
});

test("invalid canonical endpoints are rejected before solver input is built", () => {
  const project = sample();
  project.wires[0].to = "R9:99";
  assert.throws(() => Adapter.toSolverProject(project, P), error => {
    assert.match(error.message, /invalid canonical project/i);
    assert.ok(error.validation.errors.some(item => item.code === "MISSING_TERMINAL"));
    return true;
  });
});

test("adapter preserves model parameters and operating state without merging them", () => {
  const project = sample();
  project.devices[1].operatingState = { energized: true };
  const adapted = Adapter.toSolverProject(project, P);
  assert.equal(adapted.components[1].props.resistance, 1000);
  assert.deepEqual(adapted.components[1].state, { energized: true });
  assert.notEqual(adapted.components[1].props, project.devices[1].parameters);
});
