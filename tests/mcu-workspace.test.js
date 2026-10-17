const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");

const ui=fs.readFileSync("platform/mcu-lab-ui.js","utf8");
const simulator=fs.readFileSync("simulator.html","utf8");
const breadboard=fs.readFileSync("breadboard.html","utf8");
const worker=fs.readFileSync("service-worker.js","utf8");
const runtime=fs.readFileSync("simulator.js","utf8");
const css=fs.readFileSync("simulator.css","utf8");
const bridge=fs.readFileSync("platform/mcu-circuit-bridge.js","utf8");

test("Microcontroller Lab exposes a board pinout, sketch controls and modeled virtual I/O",()=>{
  for(const id of ["vpwBoard","vpwCode","vpwRunMcu","vpwStepMcu","vpwStopMcu","vpwResetMcu","vpwDigitalPins","vpwAnalogPins","vpwLedPin","vpwButtonPin","vpwMcuPins","vpwMcuOut","vpwMcuDetails"]){
    assert.ok(ui.includes('id="'+id+'"'),"missing MCU workspace control: "+id);
  }
  assert.match(ui,/Arduino Uno R3/);
  assert.match(ui,/INPUT_PULLUP/);
  assert.match(ui,/Place Uno R3 on schematic/);
  assert.match(ui,/voltpro virtual I\/O patch|VIRTUAL I\/O PATCH/i);
});

test("MCU runner lifecycle clears timers and supports a changing tick interval",()=>{
  assert.match(ui,/function stopTimer\(\)/);
  assert.match(ui,/clearTimeout\(timer\)/);
  assert.match(ui,/scheduleTick\(\)/);
  assert.match(ui,/addEventListener\("click",stopTimer\)/);
});

test("simulator loads MCU assets while breadboard uses its native electrical model",()=>{
  assert.match(simulator,/platform\/mcu-engine\.js\?v=20261017f/);
  assert.match(simulator,/platform\/mcu-circuit-bridge\.js\?v=20261013a/);
  assert.match(simulator,/platform\/mcu-lab-ui\.js\?v=20261017f/);
  assert.match(breadboard,/engine\/breadboard-project\.js/);
  assert.match(breadboard,/engine\/breadboard-solver\.js/);
});

test("service worker cache version is advanced for the MCU workspace release",()=>{
  assert.match(worker,/const CACHE="voltpro-v90"/);
  assert.ok(worker.includes('"./platform/mcu-circuit-bridge.js"'));
  assert.ok(worker.includes('"./platform/mcu-lab-ui.js"'));
  assert.ok(worker.includes('"./platform/mcu-engine.js"'));
  assert.ok(worker.includes('"./engine/breadboard-project.js"'));
  assert.ok(worker.includes('"./engine/breadboard-solver.js"'));
});

test("MCU outputs propagate into correctly wired schematic LED visuals",()=>{
  assert.match(runtime,/syncMcuOutputs:outputs=>/);
  assert.match(runtime,/mcu-led-lit/);
  assert.match(css,/\.component\.mcu-led-lit/);
  assert.match(bridge,/function evaluate\(components,wires,outputs=\{\}\)/);
  assert.match(bridge,/No series current-limiting resistor found/);
});
