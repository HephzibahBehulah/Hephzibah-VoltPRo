const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const T = require("../src/core/terminal-graph.js");

function runtime(defs = {}) {
  const window = { VoltProTerminalGraph: T, defs };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../platform/v5-runtime.js"), "utf8"), {
    window, structuredClone, Map, String, Number, Array, Boolean, Object
  });
  return window.VoltProV5Runtime;
}

test("ABB AUX-CB-11 maps numeric pins to NO/NC terminal pairs",()=>{const result=runtime({"abb-aux-cb-11":{pins:8}}).adapt({components:[{id:"AUX1",type:"abb-aux-cb-11"}],wires:[{a:"AUX1:0",b:"AUX1:4"}]});assert.deepEqual(Array.from(result.devices[0].terminals,t=>t.id),["13","21","31","41","14","22","32","42"]);assert.equal(result.wires[0].from,"AUX1:13");assert.equal(result.wires[0].to,"AUX1:14")});
test("BB400 numeric pins map to unique breadboard holes",()=>{const result=runtime({"breadboard-bb400":{pins:400}}).adapt({components:[{id:"BB1",type:"breadboard-bb400",x:0,y:0}],wires:[{a:"BB1:0",b:"BB1:399"}]});assert.equal(result.devices[0].terminals.length,400);assert.equal(result.wires[0].from,"BB1:A1");assert.equal(result.wires[0].to,"BB1:NMINUS25");assert.equal(T.build(result).validateTopology().valid,true)});
test("legacy numeric pins adapt to stable model terminal IDs", () => {
  const result = runtime({resistor:{pins:2}}).adapt({
    components:[{id:"R1",type:"resistor",x:0,y:0},{id:"R2",type:"resistor",x:100,y:0}],
    wires:[{a:"R1:0",b:"R2:1"}]
  });
  assert.equal(JSON.stringify(result.devices[0].terminals.map(t=>t.id)),JSON.stringify(["1","2"]));
  assert.equal(result.wires[0].from,"R1:1");
  assert.equal(result.wires[0].to,"R2:2");
  assert.equal(result.wires[0].domain,"dc");
  assert.equal(T.build(result).validateTopology().valid,true);
});

test("four-pole breaker maps all eight legacy pins to stable phase and neutral terminals",()=>{const result=runtime({"circuit-breaker-4p":{pins:8}}).adapt({components:[{id:"QF4",type:"circuit-breaker-4p",x:0,y:0}],wires:[{a:"QF4:3",b:"QF4:7"}]});assert.deepEqual(Array.from(result.devices[0].terminals,t=>t.id),["L1","L2","L3","N","T1","T2","T3","TN"]);assert.equal(result.wires[0].from,"QF4:N");assert.equal(result.wires[0].to,"QF4:TN");assert.equal(T.build(result).validateTopology().valid,true)});

test("auxiliary contact block exposes four separately addressable contact pairs",()=>{const result=runtime({"auxiliary-contact-block":{pins:8}}).adapt({components:[{id:"AUX1",type:"auxiliary-contact-block",x:0,y:0}],wires:[{a:"AUX1:0",b:"AUX1:4"},{a:"AUX1:1",b:"AUX1:5"}]});assert.deepEqual(Array.from(result.devices[0].terminals,t=>t.id),["13","21","31","41","14","22","32","42"]);assert.equal(result.wires[0].from,"AUX1:13");assert.equal(result.wires[0].to,"AUX1:14");assert.equal(T.build(result).validateTopology().valid,true)});

test("three-phase source and three-pole breaker adapt to phase-labelled terminals", () => {
  const result = runtime({ "circuit-breaker-3p":{pins:6}, threephase:{pins:3} }).adapt({
    components:[
      {id:"PS1",type:"threephase",x:0,y:0},
      {id:"QF1",type:"circuit-breaker-3p",x:100,y:0}
    ],
    wires:[{a:"PS1:0",b:"QF1:0"},{a:"PS1:1",b:"QF1:1"},{a:"PS1:2",b:"QF1:2"}]
  });
  assert.equal(JSON.stringify(result.devices[0].terminals.map(t=>t.id)),JSON.stringify(["L1","L2","L3"]));
  assert.equal(JSON.stringify(result.devices[1].terminals.map(t=>t.id)),JSON.stringify(["L1","L2","L3","T1","T2","T3"]));
  assert.equal(JSON.stringify(result.wires.map(w=>[w.from,w.to,w.domain])),JSON.stringify([
    ["PS1:L1","QF1:L1","ac3"],
    ["PS1:L2","QF1:L2","ac3"],
    ["PS1:L3","QF1:L3","ac3"]
  ]));
  const topology=T.build(result).validateTopology();
  assert.equal(topology.valid,true,JSON.stringify(topology.errors));
});
