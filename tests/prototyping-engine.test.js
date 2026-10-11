const test=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const vm=require("node:vm");
const T=require("../src/core/terminal-graph.js");
function loadEngine(){const window={VoltProTerminalGraph:T};vm.runInNewContext(fs.readFileSync("engine/voltpro-engine.js","utf8"),{window,Map,Set,Array,String,Number,Math,Boolean,Object,JSON,Error});return window.VoltProEngine}
const E=loadEngine();
function comp(id,type,pins,props={}){return {id,type,pins:Array.from({length:pins},(_,i)=>id+":"+i),props}}
function wire(a,b){return {a,b}}
test("BB400 joins each five-hole strip and power rail in the MNA topology",()=>{const p={components:[comp("V1","battery",2,{voltage:5}),comp("R1","resistor",2,{resistance:100}),comp("BB1","breadboard-bb400",400)],wires:[wire("V1:0","BB1:0"),wire("R1:0","BB1:30"),wire("R1:1","BB1:150"),wire("V1:1","BB1:150")]};const result=E.analyze(p).dc;assert.equal(result.ok,true,JSON.stringify(result));assert.ok(result.totalCurrent>0.04&&result.totalCurrent<0.06,"expected about 50 mA through 100 Ω at 5 V")});
test("one-pole breaker opens and closes its actual line/load path",()=>{const base={components:[comp("V1","battery",2,{voltage:12}),comp("Q1","circuit-breaker-1p",2,{rating:16,closed:1}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","Q1:0"),wire("Q1:1","R1:0"),wire("R1:1","V1:1")]};const closed=E.analyze(base).dc;assert.equal(closed.ok,true,JSON.stringify(closed));assert.ok(closed.totalCurrent>0.1);const opened=E.analyze({...base,components:base.components.map(c=>c.id==="Q1"?{...c,props:{...c.props,closed:0}}:c)}).dc;assert.equal(opened.ok,true,JSON.stringify(opened));assert.ok(Math.abs(opened.totalCurrent)<1e-9)});
test("four-pole breaker exposes independent phase and neutral paths without shorting different poles",()=>{const def=T.definitionFor("circuit-breaker-4p");assert.equal(def.paths.length,4);assert.deepEqual(Array.from(def.paths,p=>[p.from,p.to]),[["L1","T1"],["L2","T2"],["L3","T3"],["N","TN"]]);});

test("Arduino Uno R3 aliases shared power, ground, reset and I2C terminals in the MNA topology",()=>{const p={components:[comp("V1","battery",2,{voltage:5}),comp("R1","resistor",2,{resistance:100}),comp("U1","arduino-uno-r3",38)],wires:[wire("V1:0","U1:21"),wire("R1:0","U1:33"),wire("R1:1","V1:1")]};const result=E.analyze(p).dc;assert.equal(result.ok,true,JSON.stringify(result));assert.ok(result.totalCurrent>0.04&&result.totalCurrent<0.06,"5V and ICSP VCC should share a net")});

test("ABB AUX-CB-11 NC path is closed when released and opens when actuated",()=>{const base={components:[comp("V1","battery",2,{voltage:12}),comp("AUX1","abb-aux-cb-11",8,{actuated:0}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","AUX1:1"),wire("AUX1:5","R1:0"),wire("R1:1","V1:1")]};const released=E.analyze(base).dc;assert.equal(released.ok,true,JSON.stringify(released));assert.ok(released.totalCurrent>0.1);const actuated=E.analyze({...base,components:base.components.map(c=>c.id==="AUX1"?{...c,props:{...c.props,actuated:1}}:c)}).dc;assert.equal(actuated.ok,true,JSON.stringify(actuated));assert.ok(Math.abs(actuated.totalCurrent)<1e-9)});

test("contactor coil voltage drives three independent main poles and auxiliary contacts",()=>{
 const make=(voltage)=>({components:[comp("V1","battery",2,{voltage}),comp("KM1","contactor",12,{coilVoltage:230,coilResistance:82}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","KM1:0"),wire("KM1:1","V1:1"),wire("V1:0","KM1:2"),wire("KM1:3","R1:0"),wire("R1:1","V1:1"),wire("V1:0","KM1:8"),wire("KM1:9","R1:0")]});
 const energized=E.analyze(make(230)).dc;
 assert.equal(energized.ok,true,JSON.stringify(energized));
 assert.equal(energized.deviceStates.KM1,true,"230 V coil should pull in");
 assert.ok(energized.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&b.current>2),"main contact should conduct after coil energizes: "+JSON.stringify(energized.branches));
 assert.ok(energized.branches.some(b=>b.id==="KM1"&&b.contactId==="aux-no-13-14"&&b.current>0),"NO auxiliary contact should close with coil");
 const released=E.analyze(make(24)).dc;
 assert.equal(released.ok,true,JSON.stringify(released));
 assert.equal(released.deviceStates.KM1,false,"24 V should not pull in a 230 V coil");
 assert.ok(released.branches.some(b=>b.id==="KM1"&&b.contactId==="main-1"&&Math.abs(b.current)<1e-9),"main contact should remain open");
});
test("relay uses explicit eight-terminal coil and changeover contacts",()=>{
 const p={components:[comp("V1","battery",2,{voltage:24}),comp("K1","relay",8,{coilVoltage:24,coilResistance:240}),comp("R1","resistor",2,{resistance:100}),comp("R2","resistor",2,{resistance:100})],wires:[wire("V1:0","K1:0"),wire("K1:1","V1:1"),wire("V1:0","K1:2"),wire("K1:3","R1:0"),wire("R1:1","V1:1"),wire("K1:4","R2:0"),wire("R2:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.deviceStates.K1,true,"24 V relay coil should energize");
 assert.ok(result.branches.some(b=>b.id==="K1"&&b.contactId==="changeover-1-no"&&b.current>0),"relay NO contact should conduct");
 assert.ok(result.branches.some(b=>b.id==="K1"&&b.contactId==="changeover-1-nc"&&Math.abs(b.current)<1e-9),"relay NC contact should open");
});
test("numeric zero opens a legacy generic switch rather than being treated as closed",()=>{
 const p={components:[comp("V1","battery",2,{voltage:12}),comp("S1","switch",2,{closed:0}),comp("R1","resistor",2,{resistance:100})],wires:[wire("V1:0","S1:0"),wire("S1:1","R1:0"),wire("R1:1","V1:1")]};
 const result=E.analyze(p).dc;
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.ok(Math.abs(result.totalCurrent)<1e-9);
});
