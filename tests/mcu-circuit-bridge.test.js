const test=require("node:test");
const assert=require("node:assert/strict");
const Bridge=require("../platform/mcu-circuit-bridge.js");

const components=[
 {id:"uno1",type:"arduino-uno-r3",props:{}},
 {id:"r1",type:"resistor",props:{resistance:220}},
 {id:"d1",type:"led",props:{forward:2}}
];
const goodWires=[
 {a:"uno1:13",b:"r1:0"},
 {a:"r1:1",b:"d1:0"},
 {a:"d1:1",b:"uno1:15"}
];

test("MCU circuit bridge lights a correctly wired schematic LED from a HIGH output through a resistor",()=>{
 const r=Bridge.evaluate(components,goodWires,{"13":{mode:"OUTPUT",state:1,voltage:5}});
 assert.equal(r.boardCount,1);assert.equal(r.connectedCount,1);assert.equal(r.litCount,1);
 assert.equal(r.leds[0].pin,13);assert.equal(r.leds[0].seriesResistor,true);assert.equal(Bridge.isLedLit("d1"),true);
});

test("MCU circuit bridge turns a connected LED off when the output is LOW",()=>{
 const r=Bridge.evaluate(components,goodWires,{"13":{mode:"OUTPUT",state:0,voltage:0}});
 assert.equal(r.connectedCount,1);assert.equal(r.litCount,0);assert.equal(Bridge.isLedLit("d1"),false);
});

test("MCU circuit bridge warns and does not light an LED without a series resistor",()=>{
 const wires=[{a:"uno1:13",b:"d1:0"},{a:"d1:1",b:"uno1:15"}];
 const r=Bridge.evaluate([components[0],components[2]],wires,{"13":{mode:"OUTPUT",state:1,voltage:5}});
 assert.equal(r.connectedCount,1);assert.equal(r.litCount,0);assert.match(r.leds[0].warning,/current-limiting resistor/);
});

test("MCU circuit bridge rejects reversed LED polarity and incomplete ground paths",()=>{
 const reversed=[{a:"uno1:13",b:"r1:0"},{a:"r1:1",b:"d1:1"},{a:"d1:0",b:"uno1:15"}];
 assert.equal(Bridge.evaluate(components,reversed,{"13":{state:1,voltage:5}}).connectedCount,0);
 assert.equal(Bridge.evaluate(components,goodWires.slice(0,2),{"13":{state:1,voltage:5}}).connectedCount,0);
});
